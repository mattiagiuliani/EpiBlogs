export const publicPaths = ["/login", "/register", "/auth/callback"];

export const isPublicPath = (pathname) => publicPaths.includes(pathname);

export const isAuthCallbackPath = (pathname) => pathname === "/auth/callback";

export const getGoogleCallbackParams = (search) => {
  const params = new URLSearchParams(search);

  return {
    code: params.get("code"),
    error: params.get("error"),
  };
};

export const getGoogleAuthErrorMessage = () =>
  "Google login could not be completed. Please try again.";
