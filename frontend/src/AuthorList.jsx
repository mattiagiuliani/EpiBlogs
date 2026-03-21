import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Row, Spinner } from "react-bootstrap";

const AuthorList = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuthors = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/v1/authors");

      if (!res.ok) {
        throw new Error("Error fetching authors");
      }

      const data = await res.json();
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
    <section>
      <div className="mb-3 d-flex justify-content-between align-items-start gap-3">
        <div>
          <h2 className="h3 mb-1">Authors</h2>
          <p className="text-secondary mb-0">Browse and manage registered authors.</p>
        </div>
        <Button variant="outline-dark" onClick={fetchAuthors} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="d-flex align-items-center gap-2 text-secondary">
          <Spinner animation="border" size="sm" />
          <span>Loading authors...</span>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : authors.length === 0 ? (
        <Alert variant="light" className="border">
          No authors found
        </Alert>
      ) : (
        <Row className="g-3">
          {authors.map((author) => (
            <Col md={6} key={author._id}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <Card.Title>
                    {author.firstName} {author.lastName}
                  </Card.Title>
                  <Card.Text className="text-secondary mb-1">
                    {author.email}
                  </Card.Text>
                  {author.birthDate ? (
                    <small className="text-muted">
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
