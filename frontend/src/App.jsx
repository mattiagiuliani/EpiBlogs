import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import AuthPage from "./AuthPage.jsx";
import CreatePost from "./Form.jsx";
import List from "./List.jsx";
import PostDetail from "./PostDetail.jsx";
import ProfilePage from "./ProfilePage.jsx";
import { getAuthorById } from "./assets/api.js";
import { useAuthSession } from "./hooks/useAuthSession.js";
import { getCurrentPath, navigateTo } from "./utils/navigation.js";

function App() {
  const [refreshToken, setRefreshToken] = useState(0);
  const [authorSummary, setAuthorSummary] = useState(null);
  // Optimistic create: holds the temp post that Form fires before the API call.
  // Cleared on success (real data arrives via refreshToken) or on rollback.
  const [pendingPost, setPendingPost] = useState(null);
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

  // Called by Form before the API request — show temp post immediately.
  const handleBeforeCreate = (tempPost) => {
    setPendingPost(tempPost);
  };

  // Called by Form after the API request resolves (success or failure).
  // newPost === null means rollback; tempId is always provided so we can clear.
  const handlePostCreated = (newPost, _tempId) => {
    setPendingPost(null); // Remove optimistic placeholder
    if (newPost) {
      setRefreshToken((currentValue) => currentValue + 1);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (!currentUser?._id) {
      setAuthorSummary(null);
      return () => {
        isMounted = false;
      };
    }

    const loadAuthorSummary = async () => {
      try {
        const author = await getAuthorById(currentUser._id);
        if (!isMounted) return;
        setAuthorSummary(author);
      } catch {
        if (!isMounted) return;
        setAuthorSummary(null);
      }
    };

    loadAuthorSummary();

    return () => {
      isMounted = false;
    };
  }, [currentUser?._id]);

  const handleProfileUpdated = (updatedAuthor) => {
    setAuthorSummary(updatedAuthor ?? null);
  };

  const getUserDisplayName = () => {
    const fullName = `${authorSummary?.firstName ?? ""} ${authorSummary?.lastName ?? ""}`.trim();
    if (fullName) return fullName;

    const email = currentUser?.email ?? "";
    return email || "Authenticated author";
  };

  const getUserAvatar = () => {
    if (typeof authorSummary?.avatar !== "string") return "";
    return authorSummary.avatar.trim();
  };

  const getUserInitials = () => {
    const first = authorSummary?.firstName?.[0] ?? "";
    const last = authorSummary?.lastName?.[0] ?? "";
    const initials = `${first}${last}`.trim();

    if (initials) return initials.toUpperCase();

    const emailInitial = currentUser?.email?.[0] ?? "A";
    return emailInitial.toUpperCase();
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
      <Routes>
        <Route
          path="/post/:postId"
          element={
            <PostDetail currentUser={currentUser} onLogout={handleLogout} />
          }
        />
        <Route
          path="/profile"
          element={
            <ProfilePage
              currentUser={currentUser}
              onLogout={handleLogout}
              onNavigate={handleNavigate}
              onProfileUpdated={handleProfileUpdated}
            />
          }
        />
        <Route
          path="/"
          element={
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
                      <div className="account-avatar" aria-hidden="true">
                        {getUserAvatar() ? (
                          <img src={getUserAvatar()} alt="" />
                        ) : (
                          <span>{getUserInitials()}</span>
                        )}
                      </div>
                      <div className="account-summary">
                        <strong>{getUserDisplayName()}</strong>
                        <small>{currentUser.email}</small>
                      </div>
                      <div className="account-actions">
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleNavigate("/profile")}
                          type="button"
                        >
                          Profile
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={handleLogout}
                          type="button"
                        >
                          Logout
                        </button>
                      </div>
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
                  <CreatePost
                    onCreated={handlePostCreated}
                    onBeforeCreate={handleBeforeCreate}
                    currentUser={currentUser}
                  />
                </div>
                <div>
                  <List
                    currentUser={currentUser}
                    onPostsChanged={handlePostCreated}
                    refreshToken={refreshToken}
                    optimisticPost={pendingPost}
                  />
                </div>
              </div>
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <div className="app-glow app-glow-left" aria-hidden="true" />
      <div className="app-glow app-glow-right" aria-hidden="true" />
    </div>
  );
}

export default App;
