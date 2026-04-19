import { useCallback, useEffect, useRef, useState } from 'react';
import CategorySelect from './CategorySelect.jsx';
import PostCard from './PostCard.jsx';
import SearchBar from './SearchBar.jsx';
import TagFilter from './TagFilter.jsx';
import TagInput from './TagInput.jsx';
import { deletePost, listCategories, listPostTags, listPosts, updatePost } from './assets/api.js';
import { PREDEFINED_TAGS } from './constants/tags.js';

const DEFAULT_LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

const normalizeId = (value) => {
  if (typeof value === 'string') return value;
  if (value?.toString) return value.toString();
  return '';
};

const resolveCategorySlug = (post, categories) => {
  if (post.categorySlug) return post.categorySlug;
  const match = categories.find((c) => c.name === post.category);
  return match ? match.slug : (post.category ?? '');
};

const buildEditablePostState = (post, categories = []) => ({
  category: resolveCategorySlug(post, categories),
  title: post.title ?? '',
  cover: post.cover ?? '',
  content: post.content ?? '',
  readTimeValue: post.readTime?.value ? String(post.readTime.value) : '1',
  readTimeUnit: post.readTime?.unit ?? 'min',
  tags: Array.isArray(post.tags) ? post.tags : [],
});

// ── URL helpers ───────────────────────────────────────────────────────────────

// Hard cap: never store more than this many tags in the URL.
const MAX_URL_TAGS = 10;

const sanitizeTags = (raw) =>
  raw.map((t) => t.trim()).filter(Boolean).slice(0, MAX_URL_TAGS);

const readUrlFilters = () => {
  const p = new URLSearchParams(window.location.search);
  const tagsStr = p.get('tags') ?? '';
  return {
    search: p.get('search') ?? '',
    category: p.get('category') ?? '',
    // Sanitize on read: trim, drop blanks, cap at MAX_URL_TAGS
    tags: sanitizeTags(tagsStr ? tagsStr.split(',') : []),
    page: Math.max(Number(p.get('page')) || 1, 1),
  };
};

const writeUrlFilters = ({ search, category, tags, page }) => {
  const p = new URLSearchParams();
  if (search) p.set('search', search.trim());
  if (category) p.set('category', category);
  // Sanitize on write: trim, drop blanks, cap at MAX_URL_TAGS
  // URLSearchParams.toString() percent-encodes the value automatically.
  const safeTags = sanitizeTags(tags);
  if (safeTags.length > 0) p.set('tags', safeTags.join(','));
  if (page > 1) p.set('page', String(page));
  const qs = p.toString();
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
};

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_PREFIX = 'epiblogs:pc:';    // localStorage key namespace

// Module-scope Map: survives component remounts (e.g. React StrictMode),
// shared across the lifetime of the page.
const postCache = new Map();

/**
 * Build a deterministic string key from the active filters.
 * Tags are sorted so ["node","react"] and ["react","node"] produce the same key.
 * Empty / falsy values are omitted so defaults never pollute keys.
 */
const buildCacheKey = (s, cat, tgs, pg) => {
  const parts = [];
  if (s) parts.push(`search=${s.trim()}`);
  if (cat) parts.push(`category=${cat}`);
  const sorted = [...tgs].sort();
  if (sorted.length > 0) parts.push(`tags=${sorted.join(',')}`);
  parts.push(`page=${pg}`);
  return parts.join('|');
};

/** Build URLSearchParams for the posts API from the four filter dimensions. */
const buildFetchParams = (s, cat, tgs, pg) => {
  const p = new URLSearchParams({ page: String(pg), limit: String(DEFAULT_LIMIT) });
  if (s) p.set('search', s);
  if (cat) p.set('category', cat);
  if (tgs.length > 0) p.set('tag', tgs.join(','));
  return p;
};

// ── localStorage persistence ──────────────────────────────────────────────────

/**
 * Read a single entry from localStorage. Returns null on any error (missing,
 * corrupted JSON, expired TTL). Invalid entries are deleted on read.
 */
const lsRead = (key) => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry.timestamp !== 'number') {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

const lsWrite = (key, entry) => {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry)); } catch { /* quota exceeded */ }
};

const lsClear = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(LS_PREFIX)) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
};

/**
 * Hydrate the in-memory Map from localStorage on module load.
 * Expired entries are evicted during this pass so they never pollute the Map.
 * Called once synchronously — must not block the UI.
 */
const hydrateFromLocalStorage = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const lsKey = localStorage.key(i);
      if (!lsKey?.startsWith(LS_PREFIX)) continue;
      const cacheKey = lsKey.slice(LS_PREFIX.length);
      const entry = lsRead(cacheKey);
      if (entry) postCache.set(cacheKey, entry);
    }
  } catch { /* localStorage unavailable (SSR, private mode) */ }
};

hydrateFromLocalStorage();

// ── Cache read / write / clear ────────────────────────────────────────────────

/**
 * Returns cached API response if it exists and has not expired.
 * Checks memory first; falls back to localStorage on a Map miss so a fresh
 * page load after the tab was closed still gets instant data.
 */
const getCached = (key) => {
  const mem = postCache.get(key);
  if (mem) {
    if (Date.now() - mem.timestamp > CACHE_TTL_MS) {
      postCache.delete(key);
      try { localStorage.removeItem(LS_PREFIX + key); } catch { /* ignore */ }
      return null;
    }
    return mem.data;
  }
  // Memory miss → try localStorage (e.g. after a hard refresh)
  const ls = lsRead(key);
  if (ls) { postCache.set(key, ls); return ls.data; }
  return null;
};

/** Write to both memory and localStorage. */
const setCached = (key, data) => {
  const entry = { data, timestamp: Date.now() };
  postCache.set(key, entry);
  lsWrite(key, entry);
};

/** Wipe the entire cache — called after any mutation so stale pages are not served. */
export const clearCache = () => { postCache.clear(); lsClear(); };

/** Lightweight structural equality check used for SWR change detection. */
const dataChanged = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="post-card skeleton-card" aria-hidden="true">
    <div className="skeleton-line skeleton-title" />
    <div className="skeleton-line skeleton-text" />
    <div className="skeleton-line skeleton-text skeleton-text--short" />
    <div className="skeleton-line skeleton-meta" />
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const PostList = ({ currentUser, onPostsChanged, refreshToken, optimisticPost }) => {
  // Parse the URL exactly once and check the cache in the same pass.
  // If a warm cache entry exists for the initial filters the component can
  // render immediately with real data — no skeleton flash on the first paint.
  const [init] = useState(() => {
    const f = readUrlFilters();
    const cached = getCached(buildCacheKey(f.search, f.category, f.tags, f.page));
    return { f, cached };
  });

  const [search, setSearch] = useState(init.f.search);
  const [category, setCategory] = useState(init.f.category);
  const [tags, setTags] = useState(init.f.tags);
  const [page, setPage] = useState(init.f.page);

  // Data state — pre-populated from cache when available.
  const [posts, setPosts] = useState(init.cached?.data ?? []);
  const [loading, setLoading] = useState(init.cached === null);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(
    Math.max(init.cached?.totalPages ?? 1, 1),
  );
  const [categories, setCategories] = useState([]);
  const [presetTags, setPresetTags] = useState([]);

  // Edit / delete state
  const [editingPostId, setEditingPostId] = useState('');
  const [editValues, setEditValues] = useState(null);
  const [mutationError, setMutationError] = useState('');
  const [mutationLoadingPostId, setMutationLoadingPostId] = useState('');

  // ── Refs ─────────────────────────────────────────────────────────────────────
  // Tracks whether the initial mount URL-write should be skipped.
  // On first render the filter state was seeded FROM the URL, so writing
  // the same values back is a no-op — but skipping it is cleaner and avoids
  // any edge case where a replaceState on the first tick could interfere.
  const skipInitialUrlWrite = useRef(true);

  // Generation counter: each doFetch call increments this; stale async
  // results (from earlier renders or React StrictMode double-invocations)
  // are silently discarded when the counter no longer matches.
  const fetchGenRef = useRef(0);

  // ── URL sync ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (skipInitialUrlWrite.current) {
      skipInitialUrlWrite.current = false;
      return;
    }
    writeUrlFilters({ search, category, tags, page });
  }, [search, category, tags, page]);

  // ── Fetch posts ─────────────────────────────────────────────────────────────
  // Generation counter guards against stale async results (rapid filter
  // changes, React StrictMode double-invocation).
  //
  // Stale-while-revalidate (SWR): on a cache HIT the UI is updated instantly
  // from cache AND a background fetch fires silently. If the fresh data
  // differs from the cached snapshot the UI updates without a loading flash.
  const doFetch = useCallback(async (s, cat, tgs, pg) => {
    const gen = ++fetchGenRef.current;
    const cacheKey = buildCacheKey(s, cat, tgs, pg);

    // ── Cache read ────────────────────────────────────────────────────────────
    const cached = getCached(cacheKey);
    if (cached) {
      if (gen !== fetchGenRef.current) return;
      const resolvedTotalPages = Math.max(cached.totalPages ?? 1, 1);
      setPosts(cached.data ?? []);
      setTotalPages(resolvedTotalPages);
      setLoading(false);
      setError('');
      if (pg > resolvedTotalPages) setPage(resolvedTotalPages);

      // ── SWR background revalidation ─────────────────────────────────────────
      // Claim a new generation slot so a concurrent user-triggered fetch can
      // still supersede this background pass.
      const bgGen = ++fetchGenRef.current;
      try {
        const fresh = await listPosts(buildFetchParams(s, cat, tgs, pg));
        if (bgGen !== fetchGenRef.current) return; // superseded by newer fetch
        if (dataChanged(cached, fresh)) {
          setCached(cacheKey, fresh);
          const freshTotalPages = Math.max(fresh.totalPages ?? 1, 1);
          setPosts(fresh.data ?? []);
          setTotalPages(freshTotalPages);
          if (pg > freshTotalPages) setPage(freshTotalPages);
        }
      } catch { /* silently ignore background failures */ }
      return;
    }

    // ── Network fetch (cache miss) ────────────────────────────────────────────
    setLoading(true);
    setError('');
    try {
      const result = await listPosts(buildFetchParams(s, cat, tgs, pg));
      if (gen !== fetchGenRef.current) return;

      setCached(cacheKey, result);

      const resolvedTotalPages = Math.max(result.totalPages ?? 1, 1);
      setPosts(result.data ?? []);
      setTotalPages(resolvedTotalPages);
      if (pg > resolvedTotalPages) setPage(resolvedTotalPages);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;
      setPosts([]);
      setError(err.message);
    } finally {
      if (gen === fetchGenRef.current) setLoading(false);
    }
  }, []);

  // Re-fetch whenever any filter or the external refreshToken changes.
  // Tags is an array, so we derive a string key to avoid reference-equality misses.
  const tagsKey = tags.join(',');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    doFetch(search, category, tags, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, tagsKey, page, refreshToken]);

  // Load categories once (used by the inline edit form)
  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Load preset tags once (used by the tag filter with autocomplete)
  useEffect(() => {
    listPostTags()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          // Fallback to predefined tags if empty or error
          setPresetTags(PREDEFINED_TAGS.map(tag => ({ tag, count: 0 })));
          return;
        }
        
        // Validate format: should be [{tag, count}, ...] from new backend
        const isNewFormat = data.every(item => 
          item && typeof item === 'object' && typeof item.tag === 'string' && typeof item.count === 'number'
        );
        
        if (isNewFormat) {
          setPresetTags(data);
        } else {
          // Fallback for unexpected format
          setPresetTags(PREDEFINED_TAGS.map(tag => ({ tag, count: 0 })));
        }
      })
      .catch(() => {
        // Silently fall back to predefined tags on error
        setPresetTags(PREDEFINED_TAGS.map(tag => ({ tag, count: 0 })));
      });
  }, []);

  // ── Filter handlers — always reset to page 1 ────────────────────────────────
  const handleSearchChange = (val) => { setSearch(val); setPage(1); };
  const handleCategoryChange = (val) => { setCategory(val); setPage(1); };
  const handleTagsChange = (newTags) => { setTags(newTags); setPage(1); };

  const handleTagClick = (tag) => {
    if (!tags.includes(tag)) {
      handleTagsChange([...tags, tag]);
    }
  };

  const clearAllFilters = () => {
    setSearch(''); setCategory(''); setTags([]); setPage(1);
  };

  const hasActiveFilters = !!(search || category || tags.length);

  // ── Auth helpers ────────────────────────────────────────────────────────────
  const authenticatedAuthorId = normalizeId(currentUser?._id);
  const canManagePost = (post) =>
    authenticatedAuthorId !== '' &&
    normalizeId(post.author) === authenticatedAuthorId;

  // ── Edit handlers ───────────────────────────────────────────────────────────
  const startEditingPost = (post) => {
    setMutationError('');
    setEditingPostId(post._id);
    setEditValues(buildEditablePostState(post, categories));
  };

  const cancelEditingPost = () => {
    setEditingPostId('');
    setEditValues(null);
    setMutationError('');
  };

  const handleEditFieldChange = ({ target }) => {
    setEditValues((v) => ({ ...v, [target.name]: target.value }));
  };

  const handleUpdatePost = async (postId) => {
    if (!editValues) return;

    // ── Optimistic update ─────────────────────────────────────────────────────
    // Snapshot state for rollback, then apply changes immediately.
    const snapshotPosts = posts;
    const snapshotEditId = editingPostId;
    const snapshotEditVals = editValues;

    const optimistic = {
      ...posts.find((p) => p._id === postId),
      title: editValues.title,
      category: editValues.category,
      content: editValues.content,
      cover: editValues.cover,
      readTime: { value: Number(editValues.readTimeValue), unit: editValues.readTimeUnit },
      tags: editValues.tags,
    };

    setPosts((curr) => curr.map((p) => (p._id === postId ? optimistic : p)));
    cancelEditingPost(); // Close the edit form immediately

    // Optimistically update the in-memory cache (not localStorage — the
    // pre-mutation localStorage entry serves as the rollback snapshot).
    const cacheKey = buildCacheKey(search, category, tags, page);
    const cacheSnapshot = postCache.get(cacheKey);
    if (cacheSnapshot) {
      postCache.set(cacheKey, {
        ...cacheSnapshot,
        data: { ...cacheSnapshot.data, data: (cacheSnapshot.data.data ?? []).map((p) => (p._id === postId ? optimistic : p)) },
      });
    }

    setMutationLoadingPostId(postId);
    setMutationError('');
    try {
      await updatePost(postId, {
        category: editValues.category,
        title: editValues.title,
        cover: editValues.cover,
        content: editValues.content,
        readTime: { value: Number(editValues.readTimeValue), unit: editValues.readTimeUnit },
        tags: editValues.tags,
      });
      onPostsChanged?.();
      clearCache();
      await doFetch(search, category, tags, page);
    } catch (err) {
      // ── Rollback ────────────────────────────────────────────────────────────
      setPosts(snapshotPosts);
      setEditingPostId(snapshotEditId);
      setEditValues(snapshotEditVals);
      if (cacheSnapshot) postCache.set(cacheKey, cacheSnapshot);
      setMutationError(err.message);
    } finally {
      setMutationLoadingPostId('');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    // ── Optimistic delete ─────────────────────────────────────────────────────
    const snapshotPosts = posts;
    setPosts((curr) => curr.filter((p) => p._id !== postId));

    const cacheKey = buildCacheKey(search, category, tags, page);
    const cacheSnapshot = postCache.get(cacheKey);
    if (cacheSnapshot) {
      postCache.set(cacheKey, {
        ...cacheSnapshot,
        data: { ...cacheSnapshot.data, data: (cacheSnapshot.data.data ?? []).filter((p) => p._id !== postId) },
      });
    }

    setMutationLoadingPostId(postId);
    setMutationError('');
    try {
      await deletePost(postId);
      onPostsChanged?.();
      clearCache();
      await doFetch(search, category, tags, page);
    } catch (err) {
      // ── Rollback ────────────────────────────────────────────────────────────
      setPosts(snapshotPosts);
      if (cacheSnapshot) postCache.set(cacheKey, cacheSnapshot);
      setMutationError(err.message);
    } finally {
      setMutationLoadingPostId('');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className="content-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <span className="eyebrow">Library</span>
          <h2 className="section-title mt-2 mb-1">Posts</h2>
          <p className="section-copy mb-0">Search and browse published content.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => doFetch(search, category, tags, page)}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* Filter panel */}
      <div className="filters-panel">
        <div className="filters-row">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search posts by title…"
          />
          <CategorySelect value={category} onChange={handleCategoryChange} />
        </div>

        <TagFilter tags={tags} presets={presetTags} onChange={handleTagsChange} />

        {hasActiveFilters && (
          <div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearAllFilters}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Mutation error */}
      {mutationError && (
        <div className="alert alert-danger" role="alert">{mutationError}</div>
      )}

      {/* Content area */}
      {loading ? (
        <div className="posts-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : posts.length === 0 ? (
        <div className="empty-state" role="status">
          {hasActiveFilters
            ? 'No posts match your filters — try adjusting your search or tags.'
            : 'No posts yet.'}
        </div>
      ) : (
        <>
          <div className="posts-grid animate-in">
            {/* Optimistic create — visible immediately while the API call is in flight */}
            {optimisticPost && page === 1 && (
              <article className="post-card post-card--pending" aria-label="Publishing…">
                <div className="post-body">
                  <div className="post-title-row">
                    <h3 className="post-title">{optimisticPost.title}</h3>
                    {optimisticPost.category && (
                      <span className="badge">{optimisticPost.category}</span>
                    )}
                  </div>
                  <p className="post-preview post-preview--muted">Publishing…</p>
                </div>
              </article>
            )}
            {posts.map((post) => {
              const isOwner = canManagePost(post);
              const isEditing = editingPostId === post._id && editValues !== null;
              const isMutating = mutationLoadingPostId === post._id;

              if (isEditing) {
                return (
                  <div key={post._id} className="post-card">
                    <div className="post-body">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleUpdatePost(post._id);
                        }}
                      >
                        <div className="form-group">
                          <label className="form-label" htmlFor={`title-${post._id}`}>Title</label>
                          <input
                            id={`title-${post._id}`}
                            className="form-control"
                            name="title"
                            value={editValues.title}
                            onChange={handleEditFieldChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor={`category-${post._id}`}>Category</label>
                          {categories.length > 0 ? (
                            <select
                              id={`category-${post._id}`}
                              className="form-select"
                              name="category"
                              value={editValues.category}
                              onChange={handleEditFieldChange}
                              required
                            >
                              {categories.map((cat) => (
                                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`category-${post._id}`}
                              className="form-control"
                              name="category"
                              value={editValues.category}
                              onChange={handleEditFieldChange}
                              required
                            />
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Tags</label>
                          <TagInput
                            tags={editValues.tags}
                            onChange={(newTags) =>
                              setEditValues((v) => ({ ...v, tags: newTags }))
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor={`cover-${post._id}`}>Cover URL</label>
                          <input
                            id={`cover-${post._id}`}
                            className="form-control"
                            name="cover"
                            value={editValues.cover}
                            onChange={handleEditFieldChange}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Read Time</label>
                          <div className="form-row">
                            <input
                              className="form-control"
                              min="1"
                              name="readTimeValue"
                              type="number"
                              value={editValues.readTimeValue}
                              onChange={handleEditFieldChange}
                              required
                            />
                            <select
                              className="form-select"
                              name="readTimeUnit"
                              value={editValues.readTimeUnit}
                              onChange={handleEditFieldChange}
                            >
                              <option value="min">min</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group mb-3">
                          <label className="form-label" htmlFor={`content-${post._id}`}>Content</label>
                          <textarea
                            id={`content-${post._id}`}
                            className="form-control"
                            name="content"
                            rows={4}
                            value={editValues.content}
                            onChange={handleEditFieldChange}
                            required
                          />
                        </div>

                        <div className="post-actions">
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isMutating}
                          >
                            {isMutating ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={cancelEditingPost}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              }

              return (
                <PostCard
                  key={post._id}
                  post={post}
                  isOwner={isOwner}
                  isMutating={isMutating}
                  onEdit={startEditingPost}
                  onDelete={handleDeletePost}
                  onTagClick={handleTagClick}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="pagination-info">Page {page} of {totalPages}</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PostList;
