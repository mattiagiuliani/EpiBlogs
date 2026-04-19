import 'dotenv/config';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Author from '../models/Author.js';
import Post from '../models/Post.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTHORS_PATH = join(__dirname, '../../seed/authors.json');
const POSTS_PATH = join(__dirname, '../../seed/posts.json');

const deriveSlug = (name) =>
    String(name ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

const parseJsonFile = (path) => {
    const raw = readFileSync(path, 'utf8');
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) {
        throw new Error(`${path} must contain an array`);
    }
    return value;
};

const buildAuthorOps = (authors) =>
    authors.map((author) => {
        const document = {
            email: author.email,
            password: author.password,
            firstName: author.firstName,
            lastName: author.lastName,
            birthDate: author.birthDate,
            avatar: author.avatar,
            profile: author.profile,
            createdAt: author.createdAt,
            updatedAt: author.updatedAt,
        };

        return {
            updateOne: {
                filter: { email: document.email },
                update: {
                    $set: document,
                    $setOnInsert: {
                        _id: new mongoose.Types.ObjectId(author._id),
                    },
                },
                upsert: true,
            },
        };
    });

const normalizeComments = (comments) => {
    if (!Array.isArray(comments)) return [];

    return comments.map((comment) => ({
        ...comment,
        author: new mongoose.Types.ObjectId(comment.author),
    }));
};

const buildPostOps = (posts, authorIdByEmail) =>
    posts.map((post) => {
        const normalizedEmail = String(post.authorEmail ?? '').toLowerCase();
        const mappedAuthorId = authorIdByEmail.get(normalizedEmail) ?? new mongoose.Types.ObjectId(post.author);

        const document = {
            category: post.category,
            categorySlug: post.categorySlug || deriveSlug(post.category),
            title: post.title,
            cover: post.cover,
            readTime: post.readTime,
            author: mappedAuthorId,
            authorEmail: normalizedEmail,
            content: post.content,
            comments: normalizeComments(post.comments),
            tags: Array.isArray(post.tags) ? post.tags : [],
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };

        return {
            updateOne: {
                filter: {
                    title: document.title,
                    authorEmail: document.authorEmail,
                },
                update: { $set: document },
                upsert: true,
            },
        };
    });

const run = async () => {
    const uri = process.env.MONGODB_CONNECTION_URI?.trim();
    if (!uri) {
        throw new Error('MONGODB_CONNECTION_URI is not set');
    }

    const authors = parseJsonFile(AUTHORS_PATH);
    const posts = parseJsonFile(POSTS_PATH);

    await mongoose.connect(uri);

    try {
        const authorResult = await Author.bulkWrite(buildAuthorOps(authors), { ordered: false });

        const persistedAuthors = await Author.find(
            { email: { $in: authors.map((author) => author.email.toLowerCase()) } },
            '_id email'
        ).lean();

        const authorIdByEmail = new Map(
            persistedAuthors.map((author) => [author.email.toLowerCase(), author._id])
        );

        const postResult = await Post.bulkWrite(buildPostOps(posts, authorIdByEmail), { ordered: false });

        const authorCount = await Author.countDocuments();
        const postCount = await Post.countDocuments();

        console.log('MongoDB seed sync complete:', {
            authors: {
                input: authors.length,
                inserted: authorResult.upsertedCount,
                matched: authorResult.matchedCount,
                modified: authorResult.modifiedCount,
                totalInDb: authorCount,
            },
            posts: {
                input: posts.length,
                inserted: postResult.upsertedCount,
                matched: postResult.matchedCount,
                modified: postResult.modifiedCount,
                totalInDb: postCount,
            },
        });
    } finally {
        await mongoose.disconnect();
    }
};

run().catch((error) => {
    console.error('syncSeedToMongo failed:', error);
    process.exit(1);
});
