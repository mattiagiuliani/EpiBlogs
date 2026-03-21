import { createPost } from "./assets/createPostFetch.js";
import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";

const CreatePost = ({ onCreated }) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const formData = new FormData(e.target);
    const postData = {
      category: formData.get("category"),
      title: formData.get("title"),
      cover: formData.get("cover"),
      readTime: {
        value: Number(formData.get("readTimeValue")),
        unit: formData.get("readTimeUnit"),
      },
      author: formData.get("author"),
      content: formData.get("content"),
    };

    try {
      const data = await createPost(postData);
      e.target.reset();
      onCreated?.(data);
      setSuccessMessage("Post created successfully.");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="mb-4">
          <h2 className="h4 mb-1">Create Post</h2>
          <p className="text-secondary mb-0">Compile every field</p>
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
              <Form.Control
                name="readTimeUnit"
                placeholder="minutes"
                required
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Author ID</Form.Label>
            <Form.Control name="author" placeholder="Mongo ObjectId" required />
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

          <Button type="submit" variant="dark" className="w-100">
            Create Post
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePost;
