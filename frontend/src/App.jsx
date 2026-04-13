import { useState } from "react";
import AuthPage from "./AuthPage.jsx";
import CreatePost from "./Form.jsx";
import List from "./List.jsx";
import { useAuthSession } from "./hooks/useAuthSession.js";
import { getCurrentPath, navigateTo } from "./utils/navigation.js";

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

  const getUserDisplayName = () => {
    const email = currentUser?.email ?? "";

    return email || "Authenticated author";
  };

  if (isBootstrapping) {
    return (
      <div className="app-shell centered-shell">
        <div className="glass-card loading-panel">
          <div className="spinner" role="status" aria-label="Loading" />
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
        <div className="app-glow app-glow-left" aria-hidden="true" />
        <div className="app-glow app-glow-right" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-container">
        {/* Hero header */}
        <div className="hero-row">
          <div className="glass-card hero-panel animate-in">
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
                  <strong>{getUserDisplayName()}</strong>
                  <small>{currentUser.email}</small>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="alert alert-info dashboard-note" role="status">
              Session active through secure HttpOnly cookie.
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="main-grid">
          <div>
            <CreatePost onCreated={handlePostCreated} currentUser={currentUser} />
          </div>
          <div>
            <List
              currentUser={currentUser}
              onPostsChanged={handlePostCreated}
              refreshToken={refreshToken}
            />
          </div>
        </div>
      </div>

      <div className="app-glow app-glow-left" aria-hidden="true" />
      <div className="app-glow app-glow-right" aria-hidden="true" />
    </div>
  );
}

export default App;
