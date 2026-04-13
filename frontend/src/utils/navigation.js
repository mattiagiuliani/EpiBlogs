export const getCurrentPath = () => {
  if (typeof window === "undefined") return "/";

  return window.location.pathname.replace(/\/+$/, "") || "/";
};

export const navigateTo = (path, replace = false) => {
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
