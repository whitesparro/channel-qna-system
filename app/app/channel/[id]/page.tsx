"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// TYPES
type User = {
  displayName: string;
  role: string;
};

type Post = {
  id: number;
  title: string;
  body: string;
  author?: {
    displayName: string;
  };
};

type Reply = {
  id: number;
  body: string;
  postId: number;
  parentReplyId: number | null;
  author?: {
    displayName: string;
  };
};

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});

  // GET USER
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then(setUser);
  }, []);

  // FETCH REPLIES
  const fetchReplies = useCallback(async (postId: number) => {
    const res = await fetch(`/api/replies?postId=${postId}`);
    const data = await res.json();

    setRepliesMap((prev) => ({
      ...prev,
      [postId]: Array.isArray(data) ? data : [],
    }));
  }, []);

  // FETCH POSTS
  const refreshPosts = useCallback(async () => {
    const res = await fetch(`/api/posts?channelId=${channelId}`);
    const data = await res.json();

    const safe = Array.isArray(data) ? data : [];
    setPosts(safe);

    safe.forEach((p) => fetchReplies(p.id));
  }, [channelId, fetchReplies]);

  useEffect(() => {
  let mounted = true;

  const load = async () => {
    if (!mounted) return;
    await refreshPosts();
  };

  load();

  return () => {
    mounted = false;
  };
}, [refreshPosts]);

  // CREATE POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return alert("Login required");

    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, channelId }),
    });

    if (res.ok) {
      setTitle("");
      setBody("");
      refreshPosts();
    } else {
      alert("Post failed");
    }
  };

  // CREATE REPLY
  const handleReplySubmit = async (postId: number) => {
    const content = replyInputs[postId];
    if (!content) return;

    await fetch("/api/replies", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content, postId }),
    });

    setReplyInputs((p) => ({ ...p, [postId]: "" }));
    fetchReplies(postId);
  };

  // DELETE POST (ADMIN)
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Delete this post?")) return;

    await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });

    refreshPosts();
  };

  // DELETE REPLY (ADMIN)
  const handleDeleteReply = async (replyId: number, postId: number) => {
    if (!confirm("Delete this reply?")) return;

    await fetch(`/api/replies/${replyId}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchReplies(postId);
  };

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "auto", color: "white" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <h2>Channel #{channelId}</h2>

        <div>
          {user ? (
            <>
              👋 <b>{user.displayName}</b> ({user.role})
              <button
                style={{ marginLeft: 10 }}
                onClick={async () => {
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  location.reload();
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <a href="/login">Login</a> | <a href="/signup">Signup</a>
            </>
          )}
        </div>
      </div>

      {/* CREATE POST */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 40 }}>
        <input
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }}
        />
        <textarea
          placeholder="Post body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 10 }}
        />
        <button disabled={!user}>Post</button>
      </form>

      {/* POSTS */}
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #333",
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <small>by {post.author?.displayName}</small>

          {/* ADMIN DELETE */}
          {user?.role === "ADMIN" && (
            <div>
              <button
                style={{ color: "red", marginTop: 10 }}
                onClick={() => handleDeletePost(post.id)}
              >
                Delete Post
              </button>
            </div>
          )}

          {/* REPLIES */}
          <div style={{ marginTop: 15 }}>
            {repliesMap[post.id]?.map((r) => (
              <div key={r.id} style={{ marginLeft: 20, marginBottom: 10 }}>
                <p>{r.body}</p>
                <small>{r.author?.displayName}</small>

                {user?.role === "ADMIN" && (
                  <button
                    style={{ marginLeft: 10, color: "red" }}
                    onClick={() => handleDeleteReply(r.id, post.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* REPLY INPUT */}
          <input
            placeholder="Write a reply..."
            value={replyInputs[post.id] || ""}
            onChange={(e) =>
              setReplyInputs((p) => ({
                ...p,
                [post.id]: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleReplySubmit(post.id);
              }
            }}
            style={{ marginTop: 10, width: "100%", padding: 8 }}
          />
        </div>
      ))}
    </div>
  );
}