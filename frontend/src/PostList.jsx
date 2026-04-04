import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import SearchPost from "./SearchPost.jsx";
import { apiPaths, fetchJson } from "./assets/api.js";

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

  const fetchPosts = async (search = "") => {
    setLoading(true);
    setError("");
    setSearchQuery(search);

    try {
      const data = await fetchJson(
        `${apiPaths.posts}?search=${encodeURIComponent(search)}`,
        {},
        "Error fetching posts"
      );
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
    <section className="content-section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Library</span>
          <h2 className="h3 mb-1 mt-2">Posts</h2>
          <p className="text-secondary mb-0">Search and browse published content.</p>
        </div>
        <Button variant="outline-dark" onClick={() => fetchPosts(searchQuery)} disabled={loading}>
          Refresh
        </Button>
      </div>

      <SearchPost onSearch={fetchPosts} />

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary section-state">
          <Spinner animation="border" size="sm" />
          <span>Loading posts...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : posts.length === 0 ? (
        <Alert variant="light" className="border empty-state">
          No posts found
        </Alert>
      ) : (
        <Row className="g-3">
          {posts.map((post) => (
            <Col md={6} key={post._id}>
              <Card className="h-100 border-0 shadow-sm post-card">
                {post.cover ? (
                  <div
                    className="post-cover"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(12, 21, 38, 0.15), rgba(12, 21, 38, 0.85)), url(${post.cover})` }}
                  />
                ) : null}
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">{post.title}</Card.Title>
                    {post.category ? <Badge bg="dark">{post.category}</Badge> : null}
                  </div>
                  <Card.Text className="text-secondary">
                    {getPreviewText(post.content)}
                  </Card.Text>
                  <div className="post-meta">
                    {post.readTime?.value ? (
                      <span>{post.readTime.value} {post.readTime.unit}</span>
                    ) : null}
                    {post.authorEmail ? <span>{post.authorEmail}</span> : null}
                  </div>
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
