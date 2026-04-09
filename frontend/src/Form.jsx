import { createPost } from "./assets/createPostFetch.js";
import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";

const CreatePost = ({ onCreated, currentUser }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    };

    try {
      const data = await createPost(postData);
      e.target.reset();
      onCreated?.(data);
      setSuccessMessage("Post created successfully.");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg app-panel create-post-card">
      <Card.Body className="p-4 p-xl-5">
        <div className="mb-4">
          <span className="eyebrow">Publishing</span>
          <h2 className="h3 mb-2 mt-2">Create a polished post</h2>
          <p className="text-secondary mb-0">
            Fill in the essentials and publish directly to the dashboard.
          </p>
        </div>

        {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}
        {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control name="category" placeholder="Tech, News, Lifestyle..." required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control name="title" placeholder="Write a strong title" required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Cover URL</Form.Label>
            <Form.Control name="cover" placeholder="https://example.com/image.jpg" required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Read Time</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                name="readTimeValue"
                type="number"
                min="1"
                placeholder="Value"
                required
              />
              <Form.Select name="readTimeUnit" defaultValue="min" required>
                <option value="min">min</option>
              </Form.Select>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Author</Form.Label>
            <Form.Control
              value={`${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() || currentUser?.email || "Authenticated author"}
              disabled
              readOnly
            />
            <Form.Text className="text-secondary">
              New posts are now created only under your authenticated author profile.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="content"
              placeholder="Write the post content"
              required
            />
          </Form.Group>

          <Button type="submit" variant="dark" className="w-100 app-button" disabled={isSubmitting || !currentUser?._id}>
            {isSubmitting ? "Publishing..." : "Create Post"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePost;
