const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const TOKEN_STORAGE_KEY = "epiblogs.accessToken";
export const UNAUTHORIZED_EVENT = "epiblogs:unauthorized";

const buildUrl = (path) => `${API_BASE_URL}${path}`;

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const buildHeaders = (headers = {}, includeAuth = true) => {
  const normalizedHeaders = new Headers(headers);
  const token = includeAuth ? getStoredToken() : null;

  if (token) {
    normalizedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return normalizedHeaders;
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
    headers: buildHeaders(options.headers, options.includeAuth !== false),
  });

  if (!res.ok) {
    if (res.status === 401 && options.includeAuth !== false) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new Error(await getApiErrorMessage(res, fallbackMessage));
  }

  return res.json();
};

export const login = async (credentials) => {
  return fetchJson(
    "/login",
    {
      method: "POST",
      includeAuth: false,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    },
    "Login failed"
  );
};

export const register = async (payload) => {
  return fetchJson(
    "/authors",
    {
      method: "POST",
      includeAuth: false,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    "Registration failed"
  );
};

export const getMe = async () => {
  return fetchJson("/me", {}, "Unable to load the authenticated user");
};

export const apiPaths = {
  register: "/authors",
  login: "/login",
  me: "/me",
  authors: "/api/v1/authors",
  posts: "/api/v1/posts",
};
