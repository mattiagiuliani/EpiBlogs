/**
 * Idempotent category seed — safe to run multiple times.
 * Uses $setOnInsert so existing documents are never overwritten.
 *
 * Usage:
 *   MONGODB_CONNECTION_URI=<uri> node backend/scripts/seedCategories.js
 * Or via npm script:
 *   npm --prefix backend run seed:categories
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Category from '../models/Category.js';

const CATEGORIES = [
    { name: 'Artificial Intelligence',  slug: 'artificial-intelligence',  color: '#6366f1' },
    { name: 'Machine Learning',         slug: 'machine-learning',         color: '#8b5cf6' },
    { name: 'Deep Learning',            slug: 'deep-learning',            color: '#a855f7' },
    { name: 'Quantum Computing',        slug: 'quantum-computing',        color: '#06b6d4' },
    { name: 'Web Development',          slug: 'web-development',          color: '#3b82f6' },
    { name: 'Frontend Engineering',     slug: 'frontend-engineering',     color: '#22c55e' },
    { name: 'Backend Engineering',      slug: 'backend-engineering',      color: '#f97316' },
    { name: 'Full Stack Development',   slug: 'full-stack-development',   color: '#eab308' },
    { name: 'DevOps & Cloud',           slug: 'devops-cloud',             color: '#14b8a6' },
    { name: 'Cybersecurity',            slug: 'cybersecurity',            color: '#ef4444' },
    { name: 'Game Development',         slug: 'game-development',         color: '#ec4899' },
    { name: 'Blockchain & Web3',        slug: 'blockchain-web3',          color: '#f59e0b' },
    { name: 'Mobile Development',       slug: 'mobile-development',       color: '#10b981' },
    { name: 'Data Science',             slug: 'data-science',             color: '#64748b' },
    { name: 'System Design',            slug: 'system-design',            color: '#6b7280' },
];

const seed = async () => {
    const uri = process.env.MONGODB_CONNECTION_URI;
    if (!uri) {
        console.error('MONGODB_CONNECTION_URI is not set');
        process.exit(1);
    }

    await mongoose.connect(uri);

    const operations = CATEGORIES.map((cat) => ({
        updateOne: {
            filter: { slug: cat.slug },
            update: { $setOnInsert: cat },
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
