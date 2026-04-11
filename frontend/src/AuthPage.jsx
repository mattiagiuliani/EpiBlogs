import { useState } from "react";

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

const AuthPage = ({
  mode,
  onSubmit,
  onNavigate,
  onGoogleLogin,
  isSubmitting,
  errorMessage,
  successMessage,
}) => {
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
      <div className="glass-card auth-card">
        <div className="auth-header">
          <span className="eyebrow">{isLogin ? "Access" : "Join"}</span>
          <h1 className="auth-title">
            {isLogin ? "Sign in to EpiBlogs" : "Create your account"}
          </h1>
          <p className="auth-copy">
            {isLogin
              ? "Use your access credentials to enter the editorial dashboard."
              : "Register a new author profile, then sign in and start working from the dashboard."}
          </p>
        </div>

        {errorMessage ? (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  className="form-control"
                  name="firstName"
                  value={formValues.firstName}
                  onChange={handleChange}
                  placeholder="Mario"
                  required
                  autoComplete="given-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  className="form-control"
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleChange}
                  placeholder="Rossi"
                  autoComplete="family-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile">
                  Profile
                </label>
                <input
                  id="profile"
                  className="form-control"
                  name="profile"
                  value={formValues.profile}
                  onChange={handleChange}
                  placeholder="Editor, writer, contributor..."
                />
              </div>
            </>
          ) : null}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="form-control"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="form-control"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              minLength={6}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>

        {isLogin ? (
          <>
            <div className="auth-divider">
              <span>or continue with</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-block google-auth-button"
              onClick={onGoogleLogin}
              disabled={isSubmitting}
            >
              <span className="google-auth-icon" aria-hidden="true">G</span>
              <span>Login with Google</span>
            </button>
          </>
        ) : null}

        <div className="auth-switch">
          <span>{isLogin ? "Need an account?" : "Already registered?"}</span>
          <button
            type="button"
            className="btn btn-link"
            onClick={() => onNavigate(isLogin ? "/register" : "/login")}
          >
            {isLogin ? "Create one" : "Go to login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
