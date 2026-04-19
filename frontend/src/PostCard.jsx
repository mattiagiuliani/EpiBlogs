import { useNavigate } from "react-router";
import PostCover from "./PostCover.jsx";

const getPreviewText = (content) => {
  if (typeof content !== 'string') return '';
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > 140 ? `${plain.slice(0, 137)}…` : plain;
};

/**
 * Read-only post card used in the posts grid.
 * The inline edit form lives in PostList so it can share edit state centrally.
 *
 * Props:
 *   post         object    post document from the API
 *   isOwner      bool      whether the current user owns this post
 *   isMutating   bool      a delete/save is in flight for this card
 *   onEdit       fn(post)  called when the user clicks Edit
 *   onDelete     fn(id)    called when the user clicks Delete
 *   onTagClick   fn(tag)   called when the user clicks a tag
 */
const PostCard = ({ post, isOwner, isMutating, onEdit, onDelete, onTagClick }) => {
  const navigate = useNavigate();

  return (
  <article
    className="post-card"
    onClick={() => navigate(`/post/${post._id}`)}
    style={{ cursor: "pointer" }}
  >
    <PostCover cover={post.cover} title={post.title} category={post.category} />

    <div className="post-body">
      <div className="post-title-row">
        <h3 className="post-title">{post.title}</h3>
        {post.category && <span className="badge">{post.category}</span>}
      </div>

      <p className="post-preview">{getPreviewText(post.content)}</p>

      {post.tags?.length > 0 && (
        <div className="post-tags" aria-label="Tags">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="post-tag"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="post-meta">
        {post.readTime?.value && (
          <span>{post.readTime.value}&nbsp;{post.readTime.unit}</span>
        )}
        {post.authorEmail && <span>{post.authorEmail}</span>}
      </div>

      {isOwner && (
        <div className="post-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={isMutating}
            onClick={(e) => { e.stopPropagation(); onEdit(post); }}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={isMutating}
            onClick={(e) => { e.stopPropagation(); onDelete(post._id); }}
          >
            {isMutating ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  </article>
  );
};

export default PostCard;
