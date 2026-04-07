"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type User = { id?: number; displayName: string; role: string };
type Attachment = { id: number; path: string; mimeType: string };
type Reply = {
  id: number;
  body: string;
  postId: number;
  parentReplyId: number | null;
  author?: { displayName: string };
  votes?: { value: number }[];
  attachments?: Attachment[];
  createdAt?: string;
};
type Post = {
  id: number;
  title: string;
  body: string;
  authorId?: number | null;
  author?: { displayName: string };
  votes?: { value: number }[];
  attachments?: Attachment[];
  createdAt?: string;
};

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0c0c0f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" },
  nav: { background: "#111", borderBottom: "1px solid #222", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  container: { maxWidth: 820, margin: "0 auto", padding: "24px" },
  card: { background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: 20, marginBottom: 16 },
  input: { width: "100%", padding: 10, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", marginBottom: 10, boxSizing: "border-box" as const },
  btn: { background: "#7c6af7", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontWeight: 600 },
  btnSm: { background: "none", border: "1px solid #444", color: "#aaa", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  voteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 6px" },
};

function VoteBar({ targetId, targetType, currentUser }: { targetId: number; targetType: "post" | "reply"; currentUser: User | null }) {
  const [score, setScore] = useState(0);
  const [userVote, setUserVote] = useState(0);

  useEffect(() => {
    fetch(`/api/votes?${targetType}Id=${targetId}`)
      .then((r) => r.json())
      .then((d) => setScore(d.score ?? 0));
  }, [targetId, targetType]);

  const vote = async (value: number) => {
    if (!currentUser) return alert("Login to vote");
    const newVal = userVote === value ? 0 : value;
    const res = await fetch("/api/votes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [`${targetType}Id`]: targetId, value: newVal }),
    });
    if (res.ok) {
      setScore((s) => s + newVal - userVote);
      setUserVote(newVal);
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <button style={{ ...S.voteBtn, color: userVote === 1 ? "#6af77c" : "#555" }} onClick={() => vote(1)} title="Upvote">▲</button>
      <span style={{ color: score > 0 ? "#6af77c" : score < 0 ? "#f76c6c" : "#666", fontSize: 13, minWidth: 20, textAlign: "center" }}>{score}</span>
      <button style={{ ...S.voteBtn, color: userVote === -1 ? "#f76c6c" : "#555" }} onClick={() => vote(-1)} title="Downvote">▼</button>
    </span>
  );
}

function ReplyTree({ replies, postId, depth, currentUser, onDelete, onReply }: {
  replies: Reply[]; postId: number; depth: number; currentUser: User | null;
  onDelete: (id: number) => void; onReply: (parentReplyId: number | null) => void;
}) {
  const roots = replies.filter((r) => r.parentReplyId === null || !replies.find((x) => x.id === r.parentReplyId));
  const topLevel = depth === 0 ? replies.filter((r) => r.parentReplyId === null) : replies;

  return (
    <>
      {topLevel.map((r) => {
        const children = replies.filter((c) => c.parentReplyId === r.id);
        return (
          <div key={r.id} style={{ marginLeft: depth * 20, borderLeft: depth > 0 ? "2px solid #2a2a3a" : "none", paddingLeft: depth > 0 ? 14 : 0, marginBottom: 10 }}>
            <div style={{ background: depth % 2 === 0 ? "#1a1a24" : "#16161f", border: "1px solid #222", borderRadius: 8, padding: "12px 14px" }}>
              <p style={{ margin: "0 0 8px", color: "#ddd", whiteSpace: "pre-wrap" }}>{r.body}</p>
              {r.attachments && r.attachments.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {r.attachments.map((a) => (
                    <img key={a.id} src={a.path} alt="attachment" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 6, border: "1px solid #333" }} />
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <small style={{ color: "#555" }}>by {r.author?.displayName ?? "unknown"}</small>
                <VoteBar targetId={r.id} targetType="reply" currentUser={currentUser} />
                <button style={S.btnSm} onClick={() => onReply(r.id)}>↩ Reply</button>
                {currentUser?.role === "ADMIN" && (
                  <button style={{ ...S.btnSm, color: "#f87" }} onClick={() => onDelete(r.id)}>Delete</button>
                )}
              </div>
            </div>
            {children.length > 0 && (
              <ReplyTree replies={children} postId={postId} depth={depth + 1} currentUser={currentUser} onDelete={onDelete} onReply={onReply} />
            )}
          </div>
        );
      })}
    </>
  );
}

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [channel, setChannel] = useState<{ name: string; description?: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()).then(setUser);
    fetch(`/api/channels`).then((r) => r.json()).then((chs) => {
      const ch = Array.isArray(chs) ? chs.find((c: { id: number }) => c.id === channelId) : null;
      if (ch) setChannel(ch);
    });
  }, [channelId]);

  const fetchReplies = useCallback(async (postId: number) => {
    const res = await fetch(`/api/replies?postId=${postId}`);
    const data = await res.json();
    setRepliesMap((prev) => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
  }, []);

  const refreshPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/posts?channelId=${channelId}`);
    const data = await res.json();
    const safe = Array.isArray(data) ? data : [];
    setPosts(safe);
    safe.forEach((p: Post) => fetchReplies(p.id));
    setLoading(false);
  }, [channelId, fetchReplies]);

  useEffect(() => { refreshPosts(); }, [refreshPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError("");
    if (!user) return setPostError("You must be logged in to post.");
    if (!title.trim()) return setPostError("Title is required.");
    setPosting(true);

    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, channelId }),
    });

    if (res.ok) {
      const newPost = await res.json();
      if (uploadFile) {
        const fd = new FormData();
        fd.append("file", uploadFile);
        fd.append("postId", String(newPost.id));
        await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
        setUploadFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
      setTitle("");
      setBody("");
      refreshPosts();
    } else {
      const d = await res.json();
      setPostError(d.error || "Failed to post");
    }
    setPosting(false);
  };

  const handleReplySubmit = async (postId: number) => {
    const content = replyInputs[postId];
    if (!content?.trim()) return;
    if (!user) return alert("Login to reply");

    const res = await fetch("/api/replies", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content, postId, parentReplyId: replyTarget[postId] ?? null }),
    });

    if (res.ok) {
      setReplyInputs((p) => ({ ...p, [postId]: "" }));
      setReplyTarget((p) => ({ ...p, [postId]: null }));
      fetchReplies(postId);
    }
  };

  const safeJson = async (res: Response) => {
    try { return await res.json(); } catch { return {}; }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/posts/${postId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      await refreshPosts();
    } else {
      const d = await safeJson(res);
      alert(d.error || `Failed to delete post (${res.status})`);
    }
  };

  const handleDeleteReply = async (replyId: number, postId: number) => {
    if (!confirm("Delete this reply?")) return;
    const res = await fetch(`/api/replies/${replyId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      fetchReplies(postId);
    } else {
      const d = await safeJson(res);
      alert(d.error || `Failed to delete reply (${res.status})`);
    }
  };

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/" style={{ color: "#7c6af7", textDecoration: "none", fontWeight: 700 }}>Channel Q&A</Link>
          {channel && <span style={{ color: "#555" }}>/ <span style={{ color: "#ddd" }}>#{channel.name}</span></span>}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/search" style={{ color: "#aaa", textDecoration: "none", fontSize: 14 }}>Search</Link>
          {user ? (
            <>
              <span style={{ color: "#888", fontSize: 14 }}><b style={{ color: "#e8e8f0" }}>{user.displayName}</b> {user.role === "ADMIN" && <span style={{ color: "#f7a76c", fontSize: 12 }}>[ADMIN]</span>}</span>
              <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); location.reload(); }}
                style={{ ...S.btnSm }}>Logout</button>
            </>
          ) : (
            <Link href="/login" style={{ color: "#7c6af7", textDecoration: "none" }}>Login</Link>
          )}
        </div>
      </nav>

      <div style={S.container}>
        {channel && (
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 26 }}>#{channel.name}</h1>
            {channel.description && <p style={{ color: "#888", margin: 0 }}>{channel.description}</p>}
          </div>
        )}

        {/* CREATE POST */}
        <div style={{ ...S.card, borderColor: "#2a2a3a" }}>
          <h3 style={{ margin: "0 0 14px", color: "#fff" }}>Ask a Question</h3>
          {!user && <p style={{ color: "#888", margin: 0 }}>Please <Link href="/login" style={{ color: "#7c6af7" }}>login</Link> to post.</p>}
          {user && (
            <form onSubmit={handleSubmit}>
              {postError && <p style={{ color: "#f87", marginBottom: 8 }}>{postError}</p>}
              <label style={{ color: "#aaa", fontSize: 13, display: "block", marginBottom: 4 }}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your question title" maxLength={200} style={S.input} />
              <label style={{ color: "#aaa", fontSize: 13, display: "block", marginBottom: 4 }}>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="More detail..." rows={4} maxLength={5000}
                style={{ ...S.input, resize: "vertical" as const }} />
              <label style={{ color: "#aaa", fontSize: 13, display: "block", marginBottom: 4 }}>Screenshot (PNG/JPEG/WebP, max 5MB)</label>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                style={{ marginBottom: 12, color: "#aaa" }} />
              <button type="submit" style={S.btn} disabled={posting}>{posting ? "Posting..." : "Post Question"}</button>
            </form>
          )}
        </div>

        {/* POSTS */}
        {loading ? (
          <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading posts...</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <p>No posts yet. Be the first to ask a question!</p>
          </div>
        ) : (
          posts.map((post) => {
            const allReplies = repliesMap[post.id] || [];
            return (
              <div key={post.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 8px", color: "#fff" }}>{post.title}</h3>
                    {post.body && <p style={{ color: "#ccc", margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{post.body}</p>}
                    {post.attachments && post.attachments.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {post.attachments.map((a) => (
                          <img key={a.id} src={a.path} alt="screenshot" style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8, border: "1px solid #333" }} />
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                      <small style={{ color: "#555" }}>by {post.author?.displayName ?? "unknown"}</small>
                      <VoteBar targetId={post.id} targetType="post" currentUser={user} />
                      {(user?.role === "ADMIN" || (user?.id && post.authorId === user.id)) && (
                        <button style={{ ...S.btnSm, color: "#f87" }} onClick={() => handleDeletePost(post.id)}>Delete Post</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* REPLIES TREE */}
                {allReplies.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <ReplyTree
                      replies={allReplies}
                      postId={post.id}
                      depth={0}
                      currentUser={user}
                      onDelete={(replyId) => handleDeleteReply(replyId, post.id)}
                      onReply={(parentReplyId) => setReplyTarget((p) => ({ ...p, [post.id]: parentReplyId }))}
                    />
                  </div>
                )}

                {/* REPLY INPUT */}
                {user && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #222", paddingTop: 14 }}>
                    {replyTarget[post.id] && (
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                        Replying to reply #{replyTarget[post.id]}
                        <button onClick={() => setReplyTarget((p) => ({ ...p, [post.id]: null }))}
                          style={{ background: "none", border: "none", color: "#f87", cursor: "pointer", marginLeft: 6 }}>x</button>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        placeholder={replyTarget[post.id] ? "Write a nested reply..." : "Write a reply..."}
                        value={replyInputs[post.id] || ""}
                        onChange={(e) => setReplyInputs((p) => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReplySubmit(post.id); } }}
                        style={{ ...S.input, margin: 0, flex: 1 }}
                      />
                      <button onClick={() => handleReplySubmit(post.id)} style={S.btn}>Reply</button>
                    </div>
                  </div>
                )}
                {!user && (
                  <p style={{ color: "#555", fontSize: 13, marginTop: 10 }}>
                    <Link href="/login" style={{ color: "#7c6af7" }}>Login</Link> to reply
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
