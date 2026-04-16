const allowedPostFields = [
    'author',
    'category',
    'content',
    'cover',
    'readTime',
    'tags',
    'title'
];

export const pickPostInput = (data = {}) => {
    return allowedPostFields.reduce((postData, field) => {
        if (Object.hasOwn(data, field)) {
            postData[field] = data[field];
        }

        return postData;
    }, {});
};

// Normalize a single tag: lowercase, trim, spaces → hyphens, strip non-alphanumeric.
export const normalizeTag = (tag) =>
    String(tag)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

// Normalize an array or comma-separated string of tags.
// Returns a deduplicated array of slug-style tag strings.
// Any falsy input returns [].
export const normalizeTags = (input) => {
    if (!input && input !== 0) return [];
    const arr = Array.isArray(input)
        ? input
        : String(input).split(',');
    return [...new Set(arr.map(normalizeTag).filter(Boolean))];
};
