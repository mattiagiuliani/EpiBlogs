import { useEffect, useState } from "react";
import {
  clearStoredToken,
  getMe,
  getStoredToken,
  login,
  register,
  setStoredToken,
  UNAUTHORIZED_EVENT,
} from "../assets/api.js";

const publicPaths = ["/login", "/register"];

export const useAuthSession = ({ navigateTo, getCurrentPath }) => {
  const [pathname, setPathname] = useState(getCurrentPath);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  useEffect(() => {
    const syncPathname = () => setPathname(getCurrentPath());

    window.addEventListener("popstate", syncPathname);
    return () => window.removeEventListener("popstate", syncPathname);
  }, [getCurrentPath]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError("Your session has expired. Please log in again.");
      setAuthSuccess("");
      navigateTo("/login", true);
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigateTo]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        setCurrentUser(null);
        setIsBootstrapping(false);

        if (!publicPaths.includes(getCurrentPath())) {
          navigateTo("/login", true);
        }
        return;
      }

      try {
        const user = await getMe();
        setCurrentUser(user);

        if (publicPaths.includes(getCurrentPath())) {
          navigateTo("/", true);
        }
      } catch {
        clearStoredToken();
        setCurrentUser(null);
        navigateTo("/login", true);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapAuth();
  }, [getCurrentPath, navigateTo]);

  useEffect(() => {
    if (!isBootstrapping && currentUser && publicPaths.includes(pathname)) {
      navigateTo("/", true);
    }
  }, [currentUser, isBootstrapping, navigateTo, pathname]);

  const handleNavigate = (path) => {
    setAuthError("");
    setAuthSuccess("");
    navigateTo(path);
  };

  const handleRegister = async (formValues) => {
    setIsSubmittingAuth(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      await register(formValues);
      setAuthSuccess("Registration completed. You can now sign in.");
      navigateTo("/login", true);
      return true;
    } catch (error) {
      setAuthError(error.message);
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogin = async (formValues) => {
    setIsSubmittingAuth(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const response = await login(formValues);
      setStoredToken(response.token);

      const user = response.author ?? await getMe();
      setCurrentUser(user);
      navigateTo("/", true);
      return true;
    } catch (error) {
      clearStoredToken();
      setCurrentUser(null);
      setAuthError(error.message);
      return false;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setCurrentUser(null);
    setAuthError("");
    setAuthSuccess("");
    navigateTo("/login", true);
  };

  return {
    authError,
    authSuccess,
    currentUser,
    handleLogin,
    handleLogout,
    handleNavigate,
    handleRegister,
    isBootstrapping,
    isSubmittingAuth,
    pathname,
  };
};
