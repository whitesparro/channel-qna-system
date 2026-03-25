"use client";

import { useEffect, useState } from "react";

// ✅ Define Post type
type Post = {
  id: number;
  title: string;
  body: string;
};

export default function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`/api/posts?channelId=${params.id}`)
      .then((res) => res.json())
      .then((data: Post[]) => setPosts(data));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        channelId: Number(params.id),
      }),
    });

    if (res.ok) {
      setTitle("");
      setBody("");

      // refresh posts
      const data: Post[] = await fetch(
        `/api/posts?channelId=${params.id}`
      ).then((res) => res.json());

      setPosts(data);
    } else {
      alert("Failed to create post");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Channel {params.id}</h1>

      {/* CREATE POST FORM */}
      <h2>Create Post</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "300px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <textarea
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ width: "300px", height: "100px" }}
          />
        </div>

        <button type="submit">Create Post</button>
      </form>

      {/* POSTS LIST */}
      <h2>Posts</h2>

      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ marginBottom: "20px" }}>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </div>
        ))
      )}
    </div>
  );
}