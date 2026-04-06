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

type ReplyNode = Reply & { children: ReplyNode[] };

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  // 🔐 GET USER
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // 🔁 FETCH REPLIES
  const fetchReplies = useCallback(async (postId: number) => {
    const res = await fetch(`/api/replies?postId=${postId}`, {
      credentials: "include",
    });

    const data = await res.json();

    setRepliesMap((p) => ({
      ...p,
      [postId]: Array.isArray(data) ? data : [],
    }));
  }, []);

  // 🔁 FETCH POSTS
  const refreshPosts = useCallback(async () => {
    const res = await fetch(`/api/posts?channelId=${channelId}`, {
      credentials: "include",
    });

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

  // ➕ CREATE POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Login required");
      return;
    }

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

  // 💬 CREATE REPLY
  const handleReplySubmit = async (postId: number) => {
    const content = replyInputs[postId];
    if (!content?.trim()) return;

    const res = await fetch("/api/replies", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content, postId }),
    });

    if (res.ok) {
      setReplyInputs((p) => ({ ...p, [postId]: "" }));
      fetchReplies(postId);
    }
  };

  // 🗑 DELETE POST
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Delete this post?")) return;

    await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });

    refreshPosts();
  };

  // 🗑 DELETE REPLY
  const handleDeleteReply = async (replyId: number, postId: number) => {
    if (!confirm("Delete this reply?")) return;

    await fetch(`/api/replies/${replyId}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchReplies(postId);
  };

  // 🌳 TREE
  const buildTree = (replies: Reply[]): ReplyNode[] => {
    const map: Record<number, ReplyNode> = {};
    const roots: ReplyNode[] = [];

    replies.forEach((r) => (map[r.id] = { ...r, children: [] }));

    replies.forEach((r) => {
      if (r.parentReplyId) {
        map[r.parentReplyId]?.children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });

    return roots;
  };

  const renderReplies = (nodes: ReplyNode[]) =>
    nodes.map((r) => (
      <div key={r.id} style={{ marginLeft: 20 }}>
        <p>{r.body}</p>
        <small>{r.author?.displayName}</small>

        {user?.role === "ADMIN" && (
          <button onClick={() => handleDeleteReply(r.id, r.postId)}>
            Delete
          </button>
        )}

        {r.children.length > 0 && renderReplies(r.children)}
      </div>
    ));

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Channel #{channelId}</h2>

        <div>
          {user ? (
            <>
              👋 {user.displayName}
              <button
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
              <a href="/login">Login</a> |{" "}
              <a href="/signup">Signup</a>
            </>
          )}
        </div>
      </div>

      {!user && <p style={{ color: "red" }}>Login required to post</p>}

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button>Post</button>
      </form>

      {/* POSTS */}
      {posts.map((post) => {
        const tree = repliesMap[post.id]
          ? buildTree(repliesMap[post.id])
          : [];

        return (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
            <small>{post.author?.displayName}</small>

            {user?.role === "ADMIN" && (
              <button onClick={() => handleDeletePost(post.id)}>
                Delete
              </button>
            )}

            {renderReplies(tree)}

            <input
              placeholder="Reply"
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
            />
          </div>
        );
      })}
    </div>
  );
}