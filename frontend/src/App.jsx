import { useState } from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import AuthPage from "./AuthPage.jsx";
import CreatePost from "./Form.jsx";
import List from "./List.jsx";
import { useAuthSession } from "./hooks/useAuthSession.js";

const getCurrentPath = () => window.location.pathname || "/";

const navigateTo = (path, replace = false) => {
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

function App() {
  const [refreshToken, setRefreshToken] = useState(0);
  const {
    authError,
    authSuccess,
    currentUser,
    handleGoogleLogin,
    handleLogin,
    handleLogout,
    handleNavigate,
    handleRegister,
    isBootstrapping,
    isSubmittingAuth,
    pathname,
  } = useAuthSession({ navigateTo, getCurrentPath });

  const handlePostCreated = () => {
    setRefreshToken((currentValue) => currentValue + 1);
  };

  if (isBootstrapping) {
    return (
      <div className="app-shell centered-shell">
        <div className="loading-panel">
          <Spinner animation="border" />
          <span>Loading your session...</span>
        </div>
      </div>
    );
  }

  const isRegisterPage = pathname === "/register";
  const isAuthenticated = Boolean(currentUser);

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        {isRegisterPage ? (
          <AuthPage
            key="register"
            mode="register"
            onSubmit={handleRegister}
            onNavigate={handleNavigate}
            onGoogleLogin={handleGoogleLogin}
            isSubmitting={isSubmittingAuth}
            errorMessage={authError}
            successMessage={authSuccess}
          />
        ) : (
          <AuthPage
            key="login"
            mode="login"
            onSubmit={handleLogin}
            onNavigate={handleNavigate}
            onGoogleLogin={handleGoogleLogin}
            isSubmitting={isSubmittingAuth}
            errorMessage={authError}
            successMessage={authSuccess}
          />
        )}
        <div className="app-glow app-glow-left" />
        <div className="app-glow app-glow-right" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Container className="py-5">
        <Row className="justify-content-center mb-4">
          <Col lg={10}>
            <div className="hero-panel">
              <div className="dashboard-topbar">
                <div>
                  <span className="eyebrow">Editorial Control Room</span>
                  <h1 className="hero-title">EpiBlogs Dashboard</h1>
                  <p className="hero-copy mb-0">
                    Publish new stories, scan the content library, and keep your author roster in sync from one place.
                  </p>
                </div>
                <div className="account-badge">
                  <div>
                    <strong>{currentUser.firstName} {currentUser.lastName || ""}</strong>
                    <div className="small text-secondary">{currentUser.email}</div>
                  </div>
                  <Button variant="outline-dark" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </div>

              <Alert variant="light" className="border dashboard-note">
                Session active through access token stored in localStorage.
              </Alert>
            </div>
          </Col>
        </Row>

        <Row className="g-4 align-items-start">
          <Col lg={4}>
            <CreatePost onCreated={handlePostCreated} currentUser={currentUser} />
          </Col>
          <Col lg={8}>
            <List refreshToken={refreshToken} />
          </Col>
        </Row>
      </Container>
      <div className="app-glow app-glow-left" />
      <div className="app-glow app-glow-right" />
    </div>
  );
}

export default App;
