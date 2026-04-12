const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const UNAUTHORIZED_EVENT = "epiblogs:unauthorized";
const AUTH_TOKEN_STORAGE_KEY = "epiblogs.authToken";

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

export const getStoredAuthToken = () => {
  return getStorage()?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "";
};

export const storeAuthToken = (token) => {
  const normalizedToken = typeof token === "string" ? token.trim() : "";

  if (!normalizedToken) {
    getStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return "";
  }

  getStorage()?.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);
  return normalizedToken;
};

export const clearStoredAuthToken = () => {
  getStorage()?.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export const normalizeAuthenticatedUser = (user) => {
  const id = typeof user?._id === "string"
    ? user._id
    : typeof user?._id?.toString === "function"
      ? user._id.toString()
      : "";
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";

  if (!id || !email) {
    return null;
  }

  return { _id: id, email };
};

const buildHeaders = (headers = {}, includeContentType = false) => {
  const normalized = new Headers(headers);
  const token = getStoredAuthToken();

  if (includeContentType && !normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json");
  }

  if (token && !normalized.has("Authorization")) {
    normalized.set("Authorization", `Bearer ${token}`);
  }

  return normalized;
};

const getApiErrorMessage = async (res, fallbackMessage) => {
  try {
    const data = await res.json();

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((error) => error.message).join(", ");
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore non-JSON error responses and fall back to a generic message.
  }

  return fallbackMessage;
};

export const fetchJson = async (path, options = {}, fallbackMessage = "Request failed") => {
  const res = await fetch(buildUrl(path), {
    ...options,
    // Ensures the auth cookie is sent on every request and written on responses.
    credentials: "include",
    headers: buildHeaders(options.headers, options.body && !(options.body instanceof FormData)),
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new Error(await getApiErrorMessage(res, fallbackMessage));
  }

  return res.json();
};

export const login = async (credentials) => {
  const response = await fetchJson(
    "/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    "Login failed"
  );

  storeAuthToken(response.token);
  return {
    ...response,
    author: normalizeAuthenticatedUser(response.author),
  };
};

export const register = async (payload) => {
  return fetchJson(
    "/authors",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Registration failed"
  );
};

export const getMe = async () => {
  const response = await fetchJson("/me", {}, "Unable to load the authenticated user");
  return normalizeAuthenticatedUser(response);
};

export const logoutApi = async () => {
  const response = await fetchJson(
    "/logout",
    { method: "POST" },
    "Logout failed"
  );

  clearStoredAuthToken();
  return response;
};

export const getGoogleLoginUrl = () => buildUrl("/auth/google");

export const exchangeGoogleAuthCode = async (code) => {
  const response = await fetchJson(
    "/auth/google/exchange-code",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    "Unable to complete Google login"
  );

  storeAuthToken(response.token);
  return {
    ...response,
    author: normalizeAuthenticatedUser(response.author),
  };
};

export const updatePost = async (postId, payload) => {
  return fetchJson(
    `${apiPaths.posts}/${postId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Error updating post"
  );
};

export const deletePost = async (postId) => {
  return fetchJson(
    `${apiPaths.posts}/${postId}`,
    { method: "DELETE" },
    "Error deleting post"
  );
};

export const updateComment = async ({ postId, commentId, comment }) => {
  return fetchJson(
    `${apiPaths.posts}/${postId}/comments/${commentId}`,
    {
      method: "PUT",
      body: JSON.stringify({ comment }),
    },
    "Error updating comment"
  );
};

export const deleteComment = async ({ postId, commentId }) => {
  return fetchJson(
    `${apiPaths.posts}/${postId}/comments/${commentId}`,
    { method: "DELETE" },
    "Error deleting comment"
  );
};

export const apiPaths = {
  register: "/authors",
  login: "/login",
  logout: "/logout",
  me: "/me",
  googleLogin: "/auth/google",
  googleExchange: "/auth/google/exchange-code",
  authors: "/api/v1/authors",
  posts: "/api/v1/posts",
};
