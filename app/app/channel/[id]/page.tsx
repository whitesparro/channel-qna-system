"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// types
type Post = {
  id: number;
  title: string;
  body: string;
};

type Reply = {
  id: number;
  body: string;
  postId: number;
  parentReplyId: number | null;
};

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // 🔥 NEW STATE
  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

 
  // 🔥 FETCH REPLIES
  const fetchReplies = async (postId: number) => {
    const data: Reply[] = await fetch(
      `/api/replies?postId=${postId}`
    ).then((res) => res.json());

    setRepliesMap((prev) => ({
      ...prev,
      [postId]: data,
    }));
  };
 
  
  useEffect(() => {
    fetch(`/api/posts?channelId=${channelId}`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        setPosts(data);

        // 🔥 load replies for each post
        data.forEach((post) => fetchReplies(post.id));
      });
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
      data.forEach((post) => fetchReplies(post.id));
    } else {
      alert("Failed to create post");
    }
  };

  // 🔥 CREATE REPLY
  const handleReplySubmit = async (postId: number) => {
    const content = replyInputs[postId];
    if (!content) return;

    const res = await fetch("/api/replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: content,
        postId,
      }),
    });

    if (res.ok) {
      setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
      fetchReplies(postId);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#131315",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
          Channel {channelId}
        </h1>

        {/* CREATE POST */}
        <div
          style={{
            backgroundColor: "#1e1e22",
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "30px",
          }}
        >
          <h2>Create a Post</h2>

          <form onSubmit={handleSubmit}>
            <input
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#2a2a2e",
                color: "white",
              }}
            />

            <textarea
              placeholder="Write your post..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                width: "100%",
                height: "100px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#2a2a2e",
                color: "white",
              }}
            />

            <button
              type="submit"
              style={{
                marginTop: "10px",
                backgroundColor: "#6366f1",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Create Post
            </button>
          </form>
        </div>

        {/* POSTS */}
        <h2>Posts</h2>

        {posts.length === 0 ? (
          <p style={{ color: "#aaa" }}>No posts yet</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                backgroundColor: "#1e1e22",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h3>{post.title}</h3>
              <p style={{ color: "#ccc" }}>{post.body}</p>

              {/* 🔥 REPLIES */}
              <div style={{ marginTop: "15px" }}>
                <h4 style={{ fontSize: "14px" }}>Replies</h4>

                {repliesMap[post.id]?.length ? (
                  repliesMap[post.id].map((reply) => (
                    <div
                      key={reply.id}
                      style={{
                        backgroundColor: "#2a2a2e",
                        padding: "8px",
                        borderRadius: "6px",
                        marginBottom: "5px",
                        fontSize: "14px",
                      }}
                    >
                      {reply.body}
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#888", fontSize: "13px" }}>
                    No replies yet
                  </p>
                )}

                {/* 🔥 ADD REPLY */}
                <input
                  placeholder="Write a reply..."
                  value={replyInputs[post.id] || ""}
                  onChange={(e) =>
                    setReplyInputs((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    backgroundColor: "#2a2a2e",
                    color: "white",
                  }}
                />

                <button
                  onClick={() => handleReplySubmit(post.id)}
                  style={{
                    marginTop: "5px",
                    backgroundColor: "#6366f1",
                    color: "white",
                    padding: "6px 10px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}