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
    <div style={{ padding: "20px" }}>
      <h1>Channel {channelId}</h1>

      <h2>Create Post</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br />

        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <br />

        <button type="submit">Create Post</button>
      </form>

      <h2>Posts</h2>

      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </div>
        ))
      )}
    </div>
  );
}