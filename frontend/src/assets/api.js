const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
export const UNAUTHORIZED_EVENT = "epiblogs:unauthorized";

const buildUrl = (path) => `${API_BASE_URL}${path}`;
export const buildFrontendUrl = (path) => `${FRONTEND_BASE_URL}${path}`;

const buildHeaders = (headers = {}, includeContentType = false) => {
  const normalized = new Headers(headers);

  if (includeContentType && !normalized.has("Content-Type")) {
    normalized.set("Content-Type", "application/json");
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
    headers: buildHeaders(options.headers),
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
  return fetchJson(
    "/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Registration failed"
  );
};

export const getMe = async () => {
  return fetchJson("/me", {}, "Unable to load the authenticated user");
};

export const logoutApi = async () => {
  return fetchJson(
    "/logout",
    { method: "POST" },
    "Logout failed"
  );
};

export const getGoogleLoginUrl = () => buildUrl("/auth/google");

export const exchangeGoogleAuthCode = async (code) => {
  return fetchJson(
    "/auth/google/exchange-code",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    },
    "Unable to complete Google login"
  );
};

export const apiPaths = {
  register: "/authors",
  login: "/login",
  logout: "/logout",
  me: "/me",
  googleLogin: "/auth/google",
  googleExchange: "/auth/google/exchange-code",
  googleCallback: buildFrontendUrl("/auth/callback"),
  authors: "/api/v1/authors",
  posts: "/api/v1/posts",
};
