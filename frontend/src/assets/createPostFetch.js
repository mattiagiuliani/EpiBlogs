 export const createPost = async (postData) => {
  const res = await fetch("http://localhost:3000/api/v1/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  if (!res.ok) {
    throw new Error("Error creating post");
  }

  return await res.json();
};
