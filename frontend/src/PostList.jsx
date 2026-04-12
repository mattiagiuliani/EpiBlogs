import { useEffect, useState } from "react";
import SearchPost from "./SearchPost.jsx";
import { apiPaths, deletePost, fetchJson, updatePost } from "./assets/api.js";

const DEFAULT_LIMIT = 20;

const getPreviewText = (content) => {
  if (typeof content !== "string") {
    return "";
  }

  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (plainText.length <= 140) {
    return plainText;
  }

  return `${plainText.slice(0, 137)}...`;
};

const normalizeId = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value.toString === "function") {
    return value.toString();
  }

  return "";
};

const buildEditablePostState = (post) => ({
  category: post.category ?? "",
  title: post.title ?? "",
  cover: post.cover ?? "",
  content: post.content ?? "",
  readTimeValue: post.readTime?.value ? String(post.readTime.value) : "1",
  readTimeUnit: post.readTime?.unit ?? "min",
});

const PostList = ({ currentUser, onPostsChanged, refreshToken }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingPostId, setEditingPostId] = useState("");
  const [editValues, setEditValues] = useState(null);
  const [mutationError, setMutationError] = useState("");
  const [mutationLoadingPostId, setMutationLoadingPostId] = useState("");

  const fetchPosts = async (search = "", targetPage = 1) => {
    setLoading(true);
    setError("");
    setSearchQuery(search);
    setPage(targetPage);

    try {
      const params = new URLSearchParams({
        search,
        page: String(targetPage),
        limit: String(DEFAULT_LIMIT),
      });
      const result = await fetchJson(
        `${apiPaths.posts}?${params.toString()}`,
        {},
        "Error fetching posts"
      );
      setPosts(result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
    } catch (err) {
      setPosts([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts("", 1);
  }, [refreshToken]);

  const authenticatedAuthorId = normalizeId(currentUser?._id);

  const canManagePost = (post) => {
    return authenticatedAuthorId !== "" && normalizeId(post.author) === authenticatedAuthorId;
  };

  const startEditingPost = (post) => {
    setMutationError("");
    setEditingPostId(post._id);
    setEditValues(buildEditablePostState(post));
  };

  const cancelEditingPost = () => {
    setEditingPostId("");
    setEditValues(null);
    setMutationError("");
  };

  const handleEditFieldChange = ({ target }) => {
    setEditValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }));
  };

  const handleUpdatePost = async (postId) => {
    if (!editValues) {
      return;
    }

    setMutationLoadingPostId(postId);
    setMutationError("");

    try {
      await updatePost(postId, {
        category: editValues.category,
        title: editValues.title,
        cover: editValues.cover,
        content: editValues.content,
        readTime: {
          value: Number(editValues.readTimeValue),
          unit: editValues.readTimeUnit,
        },
      });

      cancelEditingPost();
      onPostsChanged?.();
      await fetchPosts(searchQuery, page);
    } catch (err) {
      setMutationError(err.message);
    } finally {
      setMutationLoadingPostId("");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    setMutationLoadingPostId(postId);
    setMutationError("");

    try {
      await deletePost(postId);
      onPostsChanged?.();
      await fetchPosts(searchQuery, page);
    } catch (err) {
      setMutationError(err.message);
    } finally {
      setMutationLoadingPostId("");
    }
  };

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Library</span>
          <h2 className="section-title mt-2 mb-1">Posts</h2>
          <p className="section-copy mb-0">Search and browse published content.</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => fetchPosts(searchQuery, page)}
          disabled={loading}
          type="button"
        >
          Refresh
        </button>
      </div>

      <SearchPost onSearch={(query) => fetchPosts(query, 1)} />

      {mutationError ? (
        <div className="alert alert-danger" role="alert">{mutationError}</div>
      ) : null}

      {loading ? (
        <div className="section-state">
          <div className="spinner-sm" role="status" aria-label="Loading posts" />
          <span>Loading posts...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : posts.length === 0 ? (
        <div className="alert alert-info empty-state" role="status">No posts found</div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map((post) => {
              const isOwner = canManagePost(post);
              const isEditing = editingPostId === post._id && editValues;
              const isMutating = mutationLoadingPostId === post._id;

              return (
                <div className="post-card" key={post._id}>
                  {post.cover ? (
                    <div
                      className="post-cover"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(3, 10, 26, 0.15), rgba(3, 10, 26, 0.85)), url(${post.cover})`,
                      }}
                    />
                  ) : null}
                  <div className="post-body">
                    {isEditing ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
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
                          <input
                            id={`category-${post._id}`}
                            className="form-control"
                            name="category"
                            value={editValues.category}
                            onChange={handleEditFieldChange}
                            required
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
                            required
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
                          <button className="btn btn-primary btn-sm" disabled={isMutating} type="submit">
                            {isMutating ? "Saving..." : "Save"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={cancelEditingPost} type="button">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="post-title-row">
                          <h3 className="post-title">{post.title}</h3>
                          {post.category ? (
                            <span className="badge">{post.category}</span>
                          ) : null}
                        </div>
                        <p className="post-preview">{getPreviewText(post.content)}</p>
                        <div className="post-meta">
                          {post.readTime?.value ? (
                            <span>
                              {post.readTime.value} {post.readTime.unit}
                            </span>
                          ) : null}
                          {post.authorEmail ? <span>{post.authorEmail}</span> : null}
                        </div>
                        {isOwner ? (
                          <div className="post-actions">
                            <button
                              className="btn btn-outline btn-sm"
                              disabled={isMutating}
                              onClick={() => startEditingPost(post)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              disabled={isMutating}
                              onClick={() => handleDeletePost(post._id)}
                              type="button"
                            >
                              {isMutating ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <div className="pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchPosts(searchQuery, page - 1)}
                type="button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages || loading}
                onClick={() => fetchPosts(searchQuery, page + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default PostList;
