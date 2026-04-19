/**
 * Freeze Unsplash source URLs into stable images.unsplash.com photo URLs.
 *
 * Reads seed/posts.json and resolves each cover URL that points to source.unsplash.com
 * into a canonical images.unsplash.com URL with fixed dimensions and quality.
 *
 * Usage:
 *   node backend/scripts/freezeUnsplashCovers.js          # dry run
 *   node backend/scripts/freezeUnsplashCovers.js --write  # write seed + mapping
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const WRITE = process.argv.includes('--write');

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_PATH = join(__dirname, '../../seed/posts.json');
const MAP_PATH = join(__dirname, 'postCoverMap.json');

const isSourceUnsplash = (url) => typeof url === 'string' && url.includes('source.unsplash.com');
const isImageUnsplash = (url) => typeof url === 'string' && url.includes('images.unsplash.com');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const canonicalizeImageUrl = (resolvedUrl) => {
    const match = String(resolvedUrl).match(/https:\/\/images\.unsplash\.com\/(photo-[^?]+)/i);
    if (!match) return null;

    const photoPath = match[1];
    return `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1200&h=800&q=80`;
};

const resolveOne = async (url) => {
    // Step 1: inspect redirect target directly.
    const manual = await fetch(url, { method: 'GET', redirect: 'manual' });

    const location = manual.headers.get('location');
    if (location) {
        const canonical = canonicalizeImageUrl(location);
        if (canonical) return canonical;
    }

    // Step 2: fallback to following redirects and reading final URL.
    const followed = await fetch(url, { method: 'GET', redirect: 'follow' });
    const canonical = canonicalizeImageUrl(followed.url);
    return canonical;
};

const run = async () => {
    const raw = readFileSync(POSTS_PATH, 'utf8');
    const posts = JSON.parse(raw);

    if (!Array.isArray(posts)) {
        throw new Error('seed/posts.json must contain an array');
    }

    const mapping = {};

    let alreadyFrozen = 0;
    let resolved = 0;
    let unchanged = 0;
    let failed = 0;

    const nextPosts = [];

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const currentCover = post?.cover;

        if (!post || typeof post !== 'object') {
            nextPosts.push(post);
            continue;
        }

        if (isImageUnsplash(currentCover)) {
            alreadyFrozen += 1;
            mapping[post.title] = {
                category: post.category,
                cover: currentCover,
                status: 'already-frozen'
            };
            nextPosts.push(post);
            continue;
        }

        if (!isSourceUnsplash(currentCover)) {
            unchanged += 1;
            mapping[post.title] = {
                category: post.category,
                cover: currentCover,
                status: 'unchanged-non-unsplash-source'
            };
            nextPosts.push(post);
            continue;
        }

        try {
            const fixedCover = await resolveOne(currentCover);

            if (!fixedCover) {
                failed += 1;
                mapping[post.title] = {
                    category: post.category,
                    cover: currentCover,
                    status: 'failed-no-photo-id'
                };
                nextPosts.push(post);
            } else {
                resolved += 1;
                mapping[post.title] = {
                    category: post.category,
                    cover: fixedCover,
                    status: 'resolved'
                };
                nextPosts.push({ ...post, cover: fixedCover });
            }
        } catch (error) {
            failed += 1;
            mapping[post.title] = {
                category: post.category,
                cover: currentCover,
                status: `failed-${error?.name ?? 'error'}`
            };
            nextPosts.push(post);
        }

        // Soft throttle to reduce transient provider errors.
        await sleep(120);
    }

    const report = {
        total: posts.length,
        alreadyFrozen,
        resolved,
        unchanged,
        failed,
        writeMode: WRITE
    };

    console.log('Freeze Unsplash report:', report);

    if (!WRITE) {
        console.log('Dry run complete. Pass --write to persist changes.');
        return;
    }

    writeFileSync(POSTS_PATH, `${JSON.stringify(nextPosts, null, 2)}\n`, 'utf8');
    writeFileSync(MAP_PATH, `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
    console.log('Updated seed/posts.json and wrote backend/scripts/postCoverMap.json');
};

run().catch((error) => {
    console.error('freezeUnsplashCovers failed:', error);
    process.exit(1);
});
