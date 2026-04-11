import { useEffect, useState } from "react";
import SearchPost from "./SearchPost.jsx";
import { apiPaths, fetchJson } from "./assets/api.js";

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

const PostList = ({ refreshToken }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = async (search = "", targetPage = 1) => {
    setLoading(true);
    setError("");
    setSearchQuery(search);
    setPage(targetPage);

    try {
      const params = new URLSearchParams({
        search: encodeURIComponent(search),
        page: targetPage,
        limit: DEFAULT_LIMIT,
      });
      const result = await fetchJson(
        `${apiPaths.posts}?${params}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

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

      <SearchPost onSearch={(q) => fetchPosts(q, 1)} />

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
            {posts.map((post) => (
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
                </div>
              </div>
            ))}
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
