import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { apiPaths, fetchJson } from "./assets/api.js";

const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuthors = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(apiPaths.authors, {}, "Error fetching authors");
      setAuthors(data);
    } catch (err) {
      setAuthors([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return (
    <section className="content-section">
      <div className="section-header">
        <div>
          <span className="eyebrow">People</span>
          <h2 className="h3 mb-1 mt-2">Authors</h2>
          <p className="text-secondary mb-0">Browse and manage registered authors.</p>
        </div>
        <Button variant="outline-dark" onClick={fetchAuthors} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary section-state">
          <Spinner animation="border" size="sm" />
          <span>Loading authors...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : authors.length === 0 ? (
        <Alert variant="light" className="border empty-state">
          No authors found
        </Alert>
      ) : (
        <Row className="g-3">
          {authors.map((author) => (
            <Col md={6} key={author._id}>
              <Card className="h-100 border-0 shadow-sm author-card">
                <Card.Body>
                  <div className="author-header">
                    <div className="author-avatar">
                      {author.avatar ? (
                        <img src={author.avatar} alt={`${author.firstName} ${author.lastName || ""}`.trim()} />
                      ) : (
                        <span>
                          {`${author.firstName?.[0] || ""}${author.lastName?.[0] || ""}`.trim() || "AU"}
                        </span>
                      )}
                    </div>
                    <div>
                      <Card.Title className="mb-1">
                        {author.firstName} {author.lastName}
                      </Card.Title>
                      {author.profile ? (
                        <p className="small text-secondary mb-0">{author.profile}</p>
                      ) : null}
                    </div>
                  </div>
                  <Card.Text className="text-secondary mb-1">
                    {author.email}
                  </Card.Text>
                  {author.birthDate ? (
                    <small className="text-muted d-block">
                      Born: {new Date(author.birthDate).toLocaleDateString()}
                    </small>
                  ) : null}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </section>
  );
};

export default AuthorList;
