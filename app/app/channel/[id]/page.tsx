"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// type
type Post = {
  id: number;
  title: string;
  body: string;
};

export default function ChannelPage() {
  const params = useParams(); // ✅ correct way
  const channelId = Number(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`/api/posts?channelId=${channelId}`)
      .then((res) => res.json())
      .then((data: Post[]) => setPosts(data));
  }, [channelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, channelId }),
    });

    if (res.ok) {
      setTitle("");
      setBody("");

      const data: Post[] = await fetch(
        `/api/posts?channelId=${channelId}`
      ).then((res) => res.json());

      setPosts(data);
    } else {
      alert("Failed to create post");
    }
  };

 return (
  <div
    style={{
      minHeight: "100vh",
      backgroundColor: "#f5f7fb",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Channel {channelId}
      </h1>

      {/* CREATE POST CARD */}
      <div
        style={{
          backgroundColor: "black",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "30px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Create a Post</h2>

        <form onSubmit={handleSubmit}>
          {/* TITLE */}
          <label style={{ fontSize: "14px", color: "#555" }}>
            Post Title
          </label>
          <input
            placeholder="e.g. Why is my React state not updating?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "5px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              outline: "none",
            }}
          />

          {/* BODY */}
          <label style={{ fontSize: "14px", color: "#555" }}>
            Post Description
          </label>
          <textarea
            placeholder="Explain your problem clearly..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              height: "120px",
              marginTop: "5px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              outline: "none",
              resize: "none",
            }}
          />

          <button
            type="submit"
            style={{
              backgroundColor: "#6366f1",
              color: "white",
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Create Post
          </button>
        </form>
      </div>

      {/* POSTS */}
      <h2 style={{ marginBottom: "15px" }}>Posts</h2>

      {posts.length === 0 ? (
        <p style={{ color: "#777" }}>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            style={{
              backgroundColor: "black",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "15px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>{post.title}</h3>
            <p style={{ color: "#444", lineHeight: "1.5" }}>
              {post.body}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
);
}