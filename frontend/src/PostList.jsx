import { useEffect, useState } from "react";
import { Alert, Badge, Card, Col, Row, Spinner } from "react-bootstrap";
import SearchPost from "./SearchPost.jsx";

const PostList = ({ refreshToken }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = async (search = "") => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/posts?search=${encodeURIComponent(search)}`
      );

      if (!res.ok) {
        throw new Error("Error fetching posts");
      }

      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setPosts([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshToken]);

  return (
    <section>
      <div className="mb-3">
        <h2 className="h3 mb-1">Posts</h2>
        <p className="text-secondary mb-0">Search and browse published content.</p>
      </div>

      <SearchPost onSearch={fetchPosts} />

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <Spinner animation="border" size="sm" />
          <span>Loading posts...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : posts.length === 0 ? (
        <Alert variant="light" className="border">
          No posts found
        </Alert>
      ) : (
        <Row className="g-3">
          {posts.map((post) => (
            <Col md={6} key={post._id}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">{post.title}</Card.Title>
                    {post.category ? <Badge bg="dark">{post.category}</Badge> : null}
                  </div>
                  <Card.Text className="text-secondary">
                    {post.content}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
};

export default PostList;
