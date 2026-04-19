/**
 * Predefined tags that serve as fallback when the backend tag list is unavailable.
 * Used for autocomplete suggestions and preset chips.
 * These are domain-coherent tags matching common topics in the blog posts.
 */
export const PREDEFINED_TAGS = [
  'ai',
  'backend',
  'cloud',
  'cs',
  'database',
  'dev',
  'devops',
  'feature-engineering',
  'frontend',
  'machine-learning',
  'math',
  'microservices',
  'node-js',
  'quantum',
  'security',
  'testing',
  'web',
];

/**
 * Maximum number of tags to show in the "Most Popular" preset section.
 * Keeps the UI clean and not overwhelming.
 */
export const MAX_POPULAR_TAGS = 12;

/**
 * Debounce delay (ms) for autocomplete filtering while typing.
 * Reduces re-renders and improves performance.
 */
export const AUTOCOMPLETE_DEBOUNCE_MS = 150;
