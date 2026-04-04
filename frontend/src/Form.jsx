import { createPost } from "./assets/createPostFetch.js";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Spinner } from "react-bootstrap";
import { apiPaths, fetchJson } from "./assets/api.js";

const CreatePost = ({ onCreated, currentUser }) => {
  const [authors, setAuthors] = useState([]);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");

  useEffect(() => {
    const loadAuthors = async () => {
      setAuthorsLoading(true);
      setAuthorsError("");

      try {
        const data = await fetchJson(apiPaths.authors, {}, "Error fetching authors");
        setAuthors(data);
        const defaultAuthor = data.find((author) => author._id === currentUser?._id) ?? data[0];
        setSelectedAuthorId(defaultAuthor?._id ?? "");
      } catch (err) {
        setAuthors([]);
        setAuthorsError(err.message);
        setSelectedAuthorId("");
      } finally {
        setAuthorsLoading(false);
      }
    };

    loadAuthors();
  }, [currentUser?._id]);

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
      author: selectedAuthorId || formData.get("author"),
      content: formData.get("content"),
    };

    try {
      const data = await createPost(postData);
      e.target.reset();
      setSelectedAuthorId(currentUser?._id ?? authors[0]?._id ?? "");
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
        {authorsError ? <Alert variant="warning">{authorsError}</Alert> : null}

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
            <Form.Select
              name="author"
              value={selectedAuthorId}
              onChange={(event) => setSelectedAuthorId(event.target.value)}
              disabled={authorsLoading || authors.length === 0}
              required
            >
              <option value="">
                {authorsLoading ? "Loading authors..." : "Select an author"}
              </option>
              {authors.map((author) => (
                <option key={author._id} value={author._id}>
                  {author.firstName} {author.lastName ? author.lastName : ""} - {author.email}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-secondary">
              {authorsLoading ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner animation="border" size="sm" />
                  Loading available authors
                </span>
              ) : authors.length > 0 ? (
                "Authors are loaded from the backend, so you can pick a valid profile directly."
              ) : (
                "Create at least one author in the backend before publishing a post."
              )}
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

          <Button type="submit" variant="dark" className="w-100 app-button" disabled={isSubmitting || authorsLoading || authors.length === 0}>
            {isSubmitting ? "Publishing..." : "Create Post"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreatePost;
