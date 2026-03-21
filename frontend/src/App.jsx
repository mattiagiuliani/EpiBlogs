import { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import CreatePost from "./Form.jsx";
import List from "./List.jsx";

function App() {
  const [refreshToken, setRefreshToken] = useState(0);

  const handlePostCreated = () => {
    setRefreshToken((currentValue) => currentValue + 1);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-4">
        <Col lg={10}>
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold text-dark mb-2">EpiBlogs Dashboard</h1>
            <p className="text-secondary mb-0">
              Create new posts and manage your content.
            </p>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={4}>
          <CreatePost onCreated={handlePostCreated} />
        </Col>
        <Col lg={8}>
          <List refreshToken={refreshToken} />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
