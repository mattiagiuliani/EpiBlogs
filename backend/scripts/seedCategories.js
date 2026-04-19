/**
 * Idempotent category seed — safe to run multiple times.
 * Reads categories from categories.json so the script and the dataset
 * stay in sync automatically.
 *
 * Uses $setOnInsert so existing documents are never overwritten.
 *
 * Usage:
 *   MONGODB_CONNECTION_URI=<uri> node backend/scripts/seedCategories.js
 * Or via npm script:
 *   npm --prefix backend run seed:categories
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATEGORIES = JSON.parse(
    readFileSync(join(__dirname, 'categories.json'), 'utf8')
);

const seed = async () => {
    const uri = process.env.MONGODB_CONNECTION_URI;
    if (!uri) {
        console.error('MONGODB_CONNECTION_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(uri);

    const operations = CATEGORIES.map(({ name, slug, description, color }) => ({
        updateOne: {
            filter: { slug },
            update: {
                $setOnInsert: { name, slug, description: description ?? '', color: color ?? '' }
            },
            upsert: true
        }
    }));

    const result = await Category.bulkWrite(operations, { ordered: false });
    console.log(
        `Seed complete — inserted: ${result.upsertedCount}, already existed: ${result.matchedCount}`
    );

    await mongoose.disconnect();
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
