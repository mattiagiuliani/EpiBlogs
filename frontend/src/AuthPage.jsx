import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";

const initialValuesByMode = {
  login: {
    email: "",
    password: "",
  },
  register: {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    profile: "",
  },
};

const AuthPage = ({ mode, onSubmit, onNavigate, isSubmitting, errorMessage, successMessage }) => {
  const [formValues, setFormValues] = useState(initialValuesByMode[mode]);

  const isLogin = mode === "login";

  const handleChange = ({ target }) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [target.name]: target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const didSucceed = await onSubmit(formValues);

    if (didSucceed) {
      setFormValues(initialValuesByMode[mode]);
    }
  };

  return (
    <div className="auth-shell">
      <Card className="border-0 shadow-lg auth-card">
        <Card.Body className="p-4 p-xl-5">
          <div className="mb-4">
            <span className="eyebrow">{isLogin ? "Access" : "Join"}</span>
            <h1 className="auth-title">{isLogin ? "Sign in to EpiBlogs" : "Create your account"}</h1>
            <p className="auth-copy mb-0">
              {isLogin
                ? "Use your access token flow to enter the editorial dashboard."
                : "Register a new author profile, then sign in and start working from the dashboard."}
            </p>
          </div>

          {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
          {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

          <Form onSubmit={handleSubmit}>
            {!isLogin ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>First name</Form.Label>
                  <Form.Control
                    name="firstName"
                    value={formValues.firstName}
                    onChange={handleChange}
                    placeholder="Mario"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control
                    name="lastName"
                    value={formValues.lastName}
                    onChange={handleChange}
                    placeholder="Rossi"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Profile</Form.Label>
                  <Form.Control
                    name="profile"
                    value={formValues.profile}
                    onChange={handleChange}
                    placeholder="Editor, writer, contributor..."
                  />
                </Form.Group>
              </>
            ) : null}

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                type="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                name="password"
                type="password"
                value={formValues.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </Form.Group>

            <Button type="submit" variant="dark" className="w-100 app-button" disabled={isSubmitting}>
              {isSubmitting
                ? (isLogin ? "Signing in..." : "Creating account...")
                : (isLogin ? "Login" : "Register")}
            </Button>
          </Form>

          <div className="auth-switch">
            <span>{isLogin ? "Need an account?" : "Already registered?"}</span>
            <Button
              variant="link"
              className="p-0 auth-link-button"
              onClick={() => onNavigate(isLogin ? "/register" : "/login")}
            >
              {isLogin ? "Create one" : "Go to login"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AuthPage;
