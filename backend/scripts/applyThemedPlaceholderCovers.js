/**
 * Apply fully stable external covers using themed placeholder images.
 *
 * Why this fallback exists:
 * - source.unsplash.com returns HTTP 503 in this environment.
 * - unsplash.com search endpoints are not reachable here.
 *
 * This script guarantees:
 * - external HTTPS URLs only
 * - deterministic and unique URL per post
 * - topic coherence via category + title text on the image
 *
 * Usage:
 *   node backend/scripts/applyThemedPlaceholderCovers.js          # dry run
 *   node backend/scripts/applyThemedPlaceholderCovers.js --write  # apply
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const WRITE = process.argv.includes('--write');

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_PATH = join(__dirname, '../../seed/posts.json');

const CATEGORY_COLORS = {
    'Artificial Intelligence': '0b1020',
    'Machine Learning': '111827',
    'Data Science': '0f172a',
    'Web Development': '1e293b',
    'Frontend Development': '1f2937',
    'Backend Development': '0f172a',
    'Cloud Computing': '0c4a6e',
    DevOps: '14532d',
    Cybersecurity: '3f0d12',
    'Data Engineering': '312e81',
    'Quantum Computing': '172554',
    Blockchain: '1f2937',
    'Internet of Things': '134e4a',
    'Game Development': '3b0764',
    'Mobile Development': '4c0519',
    Mathematics: '083344',
    'Computer Science': '0f172a',
    default: '111827'
};

const trimTitle = (title) => {
    const value = String(title ?? '').trim();
    if (value.length <= 72) return value;
    return `${value.slice(0, 69)}...`;
};

const buildCoverUrl = (post, index) => {
    const bg = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.default;
    const fg = 'e5e7eb';
    const label = `${post.category}\n${trimTitle(post.title)}\n#${index + 1}`;
    const text = encodeURIComponent(label);

    return `https://placehold.co/1200x800/${bg}/${fg}/png?text=${text}`;
};

const run = () => {
    const raw = readFileSync(POSTS_PATH, 'utf8');
    const posts = JSON.parse(raw);

    if (!Array.isArray(posts)) {
        throw new Error('seed/posts.json must contain an array');
    }

    const seen = new Set();
    let updated = 0;
    let unchanged = 0;

    const nextPosts = posts.map((post, index) => {
        if (!post || typeof post !== 'object') return post;

        const nextCover = buildCoverUrl(post, index);

        if (seen.has(nextCover)) {
            throw new Error(`Duplicate generated URL for post index ${index}`);
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
        writeMode: WRITE
    };

    console.log('Themed cover update report:', report);

    if (!WRITE) {
        console.log('Dry run complete. Pass --write to persist changes.');
        return;
    }

    writeFileSync(POSTS_PATH, `${JSON.stringify(nextPosts, null, 2)}\n`, 'utf8');
    console.log('seed/posts.json updated successfully with themed stable covers.');
};

try {
    run();
} catch (error) {
    console.error('applyThemedPlaceholderCovers failed:', error);
    process.exit(1);
}
