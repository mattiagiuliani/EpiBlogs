import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { client } from "./api/client.js";
import { usePostComments } from "./hooks/usePostComments.js";
import { usePostLikes } from "./hooks/usePostLikes.js";
import PostCover from "./PostCover.jsx";

const PostDetail = ({ currentUser, onLogout }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loadedPostId, setLoadedPostId] = useState(null);
  const [error, setError] = useState("");

  const { comments, loading: commentsLoading, error: commentsError, submitting, addComment } =
    usePostComments(postId, currentUser);

  const { count: likesCount, likedByMe, toggling, toggle } =
    usePostLikes(postId, currentUser);

  const textareaRef = useRef(null);
  const loading = loadedPostId !== postId && !error;

  useEffect(() => {
    let active = true;

    client
      .get(`/posts/${postId}`, "Error loading post")
      .then((data) => {
        if (!active) return;
        setPost(data);
        setError("");
        setLoadedPostId(postId);
      })
      .catch((err) => {
        if (!active) return;
        setPost(null);
        setError(err.message);
        setLoadedPostId(postId);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  if (loading) {
    return (
      <div className="app-shell centered-shell">
        <div className="glass-card loading-panel">
          <div className="spinner" role="status" aria-label="Loading" />
          <span>Loading post…</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app-shell centered-shell">
        <div className="glass-card loading-panel">
          <p className="alert alert-danger">{error || "Post not found."}</p>
          <button className="btn btn-outline" onClick={() => navigate("/")}>
            ← Back to feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        {/* Top bar */}
        <div className="glass-card hero-panel animate-in" style={{ marginBottom: "1.5rem" }}>
          <div className="dashboard-topbar">
            <button className="btn btn-ghost" onClick={() => navigate("/")}>
              ← Back
            </button>
            {onLogout && (
              <button className="btn btn-outline" onClick={onLogout} type="button">
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Post full content */}
        <article className="glass-card app-panel animate-in">
          <PostCover
            cover={post.cover}
            title={post.title}
            category={post.category}
            style={{
              height: "260px",
              marginBottom: "1.5rem",
            }}
          />

          <div className="post-body">
            <div className="post-title-row">
              <h1 className="hero-title">{post.title}</h1>
              {post.category && <span className="badge">{post.category}</span>}
            </div>

            <div className="post-meta" style={{ marginBottom: "1rem" }}>
              {post.readTime?.value && (
                <span>{post.readTime.value}&nbsp;{post.readTime.unit} read</span>
              )}
              {post.authorEmail && <span>by {post.authorEmail}</span>}
              <button
                type="button"
                aria-label={likedByMe ? "Unlike post" : "Like post"}
                aria-pressed={likedByMe}
                disabled={!currentUser || toggling}
                onClick={toggle}
                style={{
                  background: "none",
                  border: "none",
                  cursor: currentUser ? "pointer" : "default",
                  fontSize: "1rem",
                  opacity: !currentUser ? 0.5 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: 0,
                }}
              >
                <span aria-hidden="true">{likedByMe ? "❤️" : "🤍"}</span>
                <span>{likesCount}</span>
              </button>
            </div>

            {post.tags?.length > 0 && (
              <div className="post-tags" style={{ marginBottom: "1.5rem" }}>
                {post.tags.map((tag) => (
                  <span key={tag} className="post-tag">#{tag}</span>
                ))}
              </div>
            )}

            <div
              className="post-content"
              style={{ lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* ── Comments ─────────────────────────────────────────────────── */}
        <section className="glass-card app-panel animate-in" style={{ marginTop: "1.5rem" }} aria-label="Comments">
          <h2 className="hero-title" style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>
            Comments
          </h2>

          {/* Skeleton while loading */}
          {commentsLoading && (
            <div aria-busy="true" aria-label="Loading comments">
              {[1, 2, 3].map((n) => (
                <div key={n} className="comment-skeleton" style={{ marginBottom: "0.75rem" }}>
                  <div className="skeleton-line" style={{ width: "30%", height: "0.75rem", marginBottom: "0.4rem" }} />
                  <div className="skeleton-line" style={{ width: "80%", height: "0.75rem" }} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {commentsError && !commentsLoading && (
            <p className="alert alert-danger">{commentsError}</p>
          )}

          {/* List */}
          {!commentsLoading && !commentsError && (
            <ul className="comment-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {comments.length === 0 && (
                <li style={{ opacity: 0.6 }}>No comments yet. Be the first!</li>
              )}
              {comments.map((c) => (
                <li key={c._id} className="comment-item" style={{ marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,.08)", paddingBottom: "0.75rem" }}>
                  <div className="comment-meta" style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "0.25rem" }}>
                    <span>{c.author?.email ?? c.author?._id ?? "Anonymous"}</span>
                    {" · "}
                    <time dateTime={c.createdAt}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                    </time>
                    {c._id?.startsWith?.("temp-") && <em> (saving…)</em>}
                  </div>
                  <p style={{ margin: 0 }}>{c.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {/* Add-comment form — visible only when authenticated */}
          {currentUser && (
            <form
              style={{ marginTop: "1.25rem" }}
              onSubmit={async (e) => {
                e.preventDefault();
                const text = textareaRef.current?.value ?? "";
                await addComment(text);
                if (textareaRef.current) textareaRef.current.value = "";
              }}
            >
              <label htmlFor="new-comment" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                Add a comment
              </label>
              <textarea
                id="new-comment"
                ref={textareaRef}
                rows={3}
                placeholder="Write your comment…"
                disabled={submitting}
                required
                style={{ width: "100%", resize: "vertical" }}
              />
              {commentsError && submitting === false && (
                <p className="alert alert-danger" style={{ marginTop: "0.5rem" }}>{commentsError}</p>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ marginTop: "0.75rem" }}
              >
                {submitting ? "Posting…" : "Post comment"}
              </button>
            </form>
          )}
        </section>
      </div>

      <div className="app-glow app-glow-left" aria-hidden="true" />
      <div className="app-glow app-glow-right" aria-hidden="true" />
    </div>
  );
};

export default PostDetail;
