/**
 * Post categorySlug migration script — ensures all posts are correctly linked to existing categories.
 *
 * For each post it runs these checks in order:
 *  1. If categorySlug is already a valid slug in the Category collection → skip.
 *  2. If post.category matches a Category name → set canonical name + slug.
 *  3. Otherwise → derive slug from post.category string (lowercase, hyphenated).
 *
 * Dry-run mode (default) prints what would change without writing anything.
 * Pass --write to apply fixes.
 *
 * Usage:
 *   MONGODB_CONNECTION_URI=<uri> node backend/scripts/fixPostCategorySlugs.js          # dry run
 *   MONGODB_CONNECTION_URI=<uri> node backend/scripts/fixPostCategorySlugs.js --write  # apply
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Post from '../models/Post.js';

const WRITE = process.argv.includes('--write');

const deriveSlug = (name) =>
    String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

const run = async () => {
    const uri = process.env.MONGODB_CONNECTION_URI;
    if (!uri) {
        console.error('MONGODB_CONNECTION_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(uri);

    // Build lookup maps: slug → doc, lowercase name → doc
    const allCategories = await Category.find().lean();
    const bySlug = new Map(allCategories.map((c) => [c.slug, c]));
    const byName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c]));

    const posts = await Post.find({}, '_id category categorySlug').lean();

    let alreadyOk = 0;
    let toFix = 0;
    const bulkOps = [];

    for (const post of posts) {
        // 1. Valid slug already present → no action needed
        if (post.categorySlug && bySlug.has(post.categorySlug)) {
            alreadyOk++;
            continue;
        }

        // 2. Try to match by category name
        const matchByName = byName.get((post.category ?? '').toLowerCase());
        if (matchByName) {
            console.log(
                `[FIX] ${post._id}  category="${post.category}"  ` +
                `oldSlug="${post.categorySlug ?? '(none)'}"  → newSlug="${matchByName.slug}"`
            );
            toFix++;
            bulkOps.push({
                updateOne: {
                    filter: { _id: post._id },
                    update: { $set: { category: matchByName.name, categorySlug: matchByName.slug } }
                }
            });
            continue;
        }

        // 3. No match in Category collection → derive slug from name string
        const derived = deriveSlug(post.category ?? '');
        if (derived) {
            console.log(
                `[DERIVE] ${post._id}  category="${post.category}"  ` +
                `oldSlug="${post.categorySlug ?? '(none)'}"  → derivedSlug="${derived}" (no matching category doc)`
            );
            toFix++;
            bulkOps.push({
                updateOne: {
                    filter: { _id: post._id },
                    update: { $set: { categorySlug: derived } }
                }
            });
        } else {
            console.log(
                `[WARN] ${post._id}  category="${post.category}"  ` +
                `oldSlug="${post.categorySlug ?? '(none)'}"  → Unmatched category found for postId`
            );
        }
    }

    console.log(`\nSummary: ${alreadyOk} OK, ${toFix} need fixing.`);

    if (bulkOps.length === 0) {
        console.log('Nothing to update.');
        await mongoose.disconnect();
        return;
    }

    if (!WRITE) {
        console.log(`\nDry run — pass --write to apply ${bulkOps.length} update(s).`);
        await mongoose.disconnect();
        return;
    }

    const result = await Post.bulkWrite(bulkOps, { ordered: false });
    console.log(`\nApplied: ${result.modifiedCount} post(s) updated.`);

    await mongoose.disconnect();
};

run().catch((err) => {
    console.error('fixPostCategorySlugs failed:', err);
    process.exit(1);
});