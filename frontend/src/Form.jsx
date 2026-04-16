import { createPost } from "./assets/createPostFetch.js";
import { listCategories } from "./assets/api.js";
import TagInput from "./TagInput.jsx";
import { useEffect, useState } from "react";

const CreatePost = ({ onCreated, onBeforeCreate, currentUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const postData = {
      category: formData.get("category"),
      title: formData.get("title"),
      cover: formData.get("cover"),
      readTime: {
        value: Number(formData.get("readTimeValue")),
        unit: formData.get("readTimeUnit"),
      },
      author: currentUser?._id,
      content: formData.get("content"),
      tags,
    };

    // Optimistic create: show the post in the list immediately before the
    // API responds. A temporary ID is used as a placeholder.
    const tempId = `temp_${Date.now()}`;
    onBeforeCreate?.({ ...postData, _id: tempId, authorEmail: currentUser?.email });

    try {
      const data = await createPost(postData);
      e.target.reset();
      setTags([]);
      onCreated?.(data, tempId);
      setSuccessMessage("Post created successfully.");
    } catch (err) {
      onCreated?.(null, tempId); // signal rollback to parent
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card app-panel create-post-card">
      <div className="mb-4">
        <span className="eyebrow">Publishing</span>
        <h2 className="section-title mt-2 mb-1">Create a post</h2>
        <p className="section-copy mb-0">
          Fill in the essentials and publish directly to the dashboard.
        </p>
      </div>

      {successMessage ? (
        <div className="alert alert-success" role="status">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="post-category">
            Category
          </label>
          {categories.length > 0 ? (
            <select
              id="post-category"
              className="form-select"
              name="category"
              defaultValue="web-development"
              required
            >
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="post-category"
              className="form-control"
              name="category"
              placeholder="Web Development"
              defaultValue="Web Development"
              required
            />
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-title">
            Title
          </label>
          <input
            id="post-title"
            className="form-control"
            name="title"
            placeholder="Write a strong title"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-cover">
            Cover URL
          </label>
          <input
            id="post-cover"
            className="form-control"
            name="cover"
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Read Time</label>
          <div className="form-row">
            <input
              className="form-control"
              name="readTimeValue"
              type="number"
              min="1"
              placeholder="Value"
              required
            />
            <select
              className="form-select"
              name="readTimeUnit"
              defaultValue="min"
              required
            >
              <option value="min">min</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="post-author">
            Author
          </label>
          <input
            id="post-author"
            className="form-control"
            value={
              `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() ||
              currentUser?.email ||
              "Authenticated author"
            }
            disabled
            readOnly
          />
          <span className="form-text">
            Posts are created under your authenticated author profile.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div className="form-group mb-4">
          <label className="form-label" htmlFor="post-content">
            Content
          </label>
          <textarea
            id="post-content"
            className="form-control"
            rows={5}
            name="content"
            placeholder="Write the post content"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isSubmitting || !currentUser?._id}
        >
          {isSubmitting ? "Publishing..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
