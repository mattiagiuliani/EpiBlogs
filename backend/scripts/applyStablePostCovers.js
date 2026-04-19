/**
 * Stable post cover updater for seed/posts.json.
 *
 * Strategy:
 * - Build deterministic Picsum seed URLs from category + title keywords.
 * - Add a deterministic hash seed so each post gets a unique stable image URL.
 * - Keep the process idempotent: same input => same output.
 *
 * Usage:
 *   node backend/scripts/applyStablePostCovers.js          # dry run
 *   node backend/scripts/applyStablePostCovers.js --write  # apply changes
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const WRITE = process.argv.includes('--write');

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_PATH = join(__dirname, '../../seed/posts.json');

const CATEGORY_KEYWORDS = {
    'Artificial Intelligence': ['artificial-intelligence', 'neural-network', 'machine-learning'],
    'Machine Learning': ['machine-learning', 'model-training', 'data-science'],
    'Data Science': ['data-science', 'analytics', 'statistics'],
    'Web Development': ['web-development', 'coding', 'javascript'],
    'Frontend Development': ['frontend', 'ui-design', 'react'],
    'Backend Development': ['backend', 'server', 'api'],
    'Cloud Computing': ['cloud-computing', 'cloud-infrastructure', 'devops'],
    DevOps: ['devops', 'ci-cd', 'automation'],
    Cybersecurity: ['cybersecurity', 'network-security', 'encryption'],
    'Data Engineering': ['data-engineering', 'data-pipeline', 'big-data'],
    'Quantum Computing': ['quantum-computing', 'qubits', 'physics'],
    Blockchain: ['blockchain', 'distributed-ledger', 'cryptography'],
    'Internet of Things': ['iot', 'smart-devices', 'embedded-systems'],
    'Game Development': ['game-development', 'game-engine', '3d-graphics'],
    'Mobile Development': ['mobile-development', 'smartphone-app', 'ios-android'],
    Mathematics: ['mathematics', 'equations', 'calculus'],
    'Computer Science': ['computer-science', 'algorithms', 'programming'],
    default: ['technology', 'software', 'engineering']
};

const STOP_WORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'your', 'that', 'this', 'what', 'why', 'how', 'are', 'is', 'of',
    'to', 'in', 'on', 'by', 'a', 'an', 'vs', 'using', 'guide', 'practical', 'explained', 'introduction', 'building'
]);

const slugify = (value) =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

const hashString = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const extractTitleKeywords = (title) => {
    const tokens = slugify(title)
        .split('-')
        .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));

    return [...new Set(tokens)].slice(0, 3);
};

const buildCoverUrl = (post, index) => {
    const categoryBase = CATEGORY_KEYWORDS[post.category] ?? CATEGORY_KEYWORDS.default;
    const titleKw = extractTitleKeywords(post.title);
    const queryKeywords = [...new Set([...categoryBase, ...titleKw])].slice(0, 6);
    const seedBase = slugify(queryKeywords.join('-')) || 'epiblogs';

    const titleHash = hashString(`${post.category}|${post.title}|${index}`);
    const sig = (titleHash % 900000) + 100000;
    const seed = `${seedBase}-${sig}`;

    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`;
};

const run = () => {
    const raw = readFileSync(POSTS_PATH, 'utf8');
    const posts = JSON.parse(raw);

    if (!Array.isArray(posts)) {
        throw new Error('seed/posts.json does not contain an array');
    }

    const seen = new Set();
    let updated = 0;
    let unchanged = 0;
    let dedupAdjusted = 0;

    const next = posts.map((post, index) => {
        if (!post || typeof post !== 'object') return post;

        let nextCover = buildCoverUrl(post, index);

        // Keep URL uniqueness even in edge hash-collision cases.
        let bump = 1;
        while (seen.has(nextCover)) {
            nextCover = `${nextCover}?v=${bump}`;
            bump += 1;
            dedupAdjusted += 1;
        }
        seen.add(nextCover);

        if (post.cover !== nextCover) {
            updated += 1;
            return { ...post, cover: nextCover };
        }

        unchanged += 1;
        return post;
    });

    const report = {
        total: posts.length,
        updated,
        unchanged,
        uniqueCoverUrls: seen.size,
        dedupAdjusted,
        writeMode: WRITE
    };

    console.log('Stable cover update report:', report);

    if (!WRITE) {
        console.log('Dry run complete. Pass --write to persist changes.');
        return;
    }

    writeFileSync(POSTS_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log('seed/posts.json updated successfully.');
};

try {
    run();
} catch (error) {
    console.error('applyStablePostCovers failed:', error);
    process.exit(1);
}
