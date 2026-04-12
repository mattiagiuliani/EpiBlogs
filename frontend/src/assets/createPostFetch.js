import { apiPaths, fetchJson } from "./api.js";

export const createPost = async (postData) => {
  return fetchJson(
    apiPaths.posts,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    },
    "Error creating post"
  );
};
