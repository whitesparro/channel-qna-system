"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// TYPES
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

type ReplyNode = Reply & {
  children: ReplyNode[];
};

// ─── Inline styles as a style tag ────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0c0c0f;
    --surface:   #13131a;
    --surface2:  #1a1a24;
    --surface3:  #22222f;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.12);
    --accent:    #7c6aff;
    --accent2:   #a78bfa;
    --text:      #e8e8f0;
    --muted:     #6b6b80;
    --danger:    #ff6b6b;
    --radius:    14px;
    --radius-sm: 8px;
  }

  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

  .channel-wrap {
    min-height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,106,255,0.12) 0%, transparent 60%);
  }

  /* ── Header ── */
  .channel-header {
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    background: rgba(12,12,15,0.75);
    border-bottom: 1px solid var(--border);
    padding: 0 clamp(20px, 5vw, 64px);
    height: 60px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .channel-header-tag {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent2);
    background: rgba(124,106,255,0.12);
    border: 1px solid rgba(124,106,255,0.25);
    border-radius: 100px;
    padding: 3px 10px;
  }

  .channel-header-title {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }

  /* ── Layout ── */
  .channel-content {
    max-width: 780px;
    margin: 0 auto;
    padding: clamp(24px, 4vw, 48px) clamp(16px, 4vw, 32px);
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* ── New Post Card ── */
  .new-post-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    padding: 24px;
    transition: border-color 0.2s;
  }
  .new-post-card:focus-within {
    border-color: rgba(124,106,255,0.4);
  }

  .new-post-card h2 {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 4px;
    display: block;
  }

  .input-base {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    resize: none;
  }
  .input-base::placeholder { color: var(--muted); }
  .input-base:focus {
    border-color: rgba(124,106,255,0.5);
    background: var(--surface3);
  }

  textarea.input-base { min-height: 90px; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: none;
    border-radius: var(--radius-sm);
    padding: 9px 18px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 0 0 0 rgba(124,106,255,0);
  }
  .btn-primary:hover {
    background: #6b5ae8;
    box-shadow: 0 4px 20px rgba(124,106,255,0.35);
  }
  .btn-primary:active { transform: scale(0.97); }

  .btn-ghost {
    background: transparent;
    color: var(--accent2);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }
  .btn-ghost:hover {
    color: #fff;
    background: rgba(124,106,255,0.15);
  }

  .btn-sm {
    display: inline-flex;
    align-items: center;
    background: var(--accent);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-sm:hover { background: #6b5ae8; }

  /* ── Post card ── */
  .post-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .post-card:hover { border-color: var(--border2); }

  .post-card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
  }

  .post-number {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 6px;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.08em;
  }

  .post-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.3;
    margin-bottom: 8px;
  }

  .post-body {
    font-size: 14px;
    color: #b0b0c0;
    line-height: 1.65;
    font-weight: 300;
  }

  .post-card-replies {
    padding: 0 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Reply box at bottom of post ── */
  .post-reply-bar {
    padding: 14px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    align-items: center;
    background: var(--surface2);
  }
  .post-reply-bar .input-base {
    flex: 1;
    background: var(--surface3);
    margin: 0;
    padding: 8px 12px;
  }

  /* ── Reply thread ── */
  .reply-thread {
    display: flex;
    margin-top: 12px;
  }

  .thread-line-col {
    width: 18px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 4px;
  }

  .thread-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(124,106,255,0.5);
    flex-shrink: 0;
  }

  .thread-line {
    width: 1.5px;
    flex: 1;
    background: rgba(124,106,255,0.2);
    margin-top: 4px;
  }

  .reply-content {
    flex: 1;
    margin-left: 10px;
  }

  .reply-bubble {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    transition: border-color 0.15s;
  }
  .reply-bubble:hover { border-color: var(--border2); }

  .reply-body {
    font-size: 13.5px;
    color: #c8c8d8;
    line-height: 1.6;
    margin-bottom: 6px;
  }

  .reply-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reply-inline-form {
    margin-top: 10px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .reply-inline-form .input-base {
    flex: 1;
    padding: 7px 11px;
    font-size: 13px;
  }

  .reply-children {
    margin-top: 2px;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
    font-size: 14px;
    border: 1px dashed var(--border2);
    border-radius: var(--radius);
  }
  .empty-state svg { margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 13px; }
`;

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  const fetchReplies = useCallback(async (postId: number): Promise<void> => {
    const data: Reply[] = await fetch(`/api/replies?postId=${postId}`).then(
      (res) => res.json()
    );
    setRepliesMap((prev) => ({ ...prev, [postId]: data }));
  }, []);

  const refreshPosts = useCallback(async () => {
    const data: Post[] = await fetch(`/api/posts?channelId=${channelId}`).then(
      (res) => res.json()
    );
    setPosts(data);
    data.forEach((post) => void fetchReplies(post.id));
  }, [channelId, fetchReplies]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPosts();
  }, [refreshPosts]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, channelId }),
    });
    if (res.ok) {
      setTitle("");
      setBody("");
      await refreshPosts();
    }
    setSubmitting(false);
  };

  const handleReplySubmit = async (postId: number): Promise<void> => {
    const content = replyInputs[postId];
    if (!content?.trim()) return;
    await fetch("/api/replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content, postId }),
    });
    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    void fetchReplies(postId);
  };

  const buildReplyTree = (replies: Reply[]): ReplyNode[] => {
    const map: Record<number, ReplyNode> = {};
    const roots: ReplyNode[] = [];
    replies.forEach((r) => (map[r.id] = { ...r, children: [] }));
    replies.forEach((r) => {
      if (r.parentReplyId) map[r.parentReplyId]?.children.push(map[r.id]);
      else roots.push(map[r.id]);
    });
    return roots;
  };

  const renderReplies = (replies: ReplyNode[]): React.ReactNode => {
    return replies.map((reply) => (
      <div key={reply.id} className="reply-thread">
        {/* Thread line */}
        <div className="thread-line-col">
          <div className="thread-dot" />
          {(reply.children.length > 0 || replyInputs[reply.id] !== undefined) && (
            <div className="thread-line" />
          )}
        </div>

        {/* Content */}
        <div className="reply-content">
          <div className="reply-bubble">
            <p className="reply-body">{reply.body}</p>
            <div className="reply-actions">
              <button
                className="btn-ghost"
                onClick={() =>
                  setReplyInputs((prev) => ({
                    ...prev,
                    [reply.id]: prev[reply.id] ?? "",
                  }))
                }
              >
                ↩ Reply
              </button>
            </div>
          </div>

          {/* Nested reply input */}
          {replyInputs[reply.id] !== undefined && (
            <div className="reply-inline-form">
              <input
                className="input-base"
                placeholder="Write a reply…"
                value={replyInputs[reply.id]}
                onChange={(e) =>
                  setReplyInputs((prev) => ({
                    ...prev,
                    [reply.id]: e.target.value,
                  }))
                }
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    await fetch("/api/replies", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        body: replyInputs[reply.id],
                        postId: reply.postId,
                        parentReplyId: reply.id,
                      }),
                    });
                    setReplyInputs((prev) => ({ ...prev, [reply.id]: "" }));
                    void fetchReplies(reply.postId);
                  }
                }}
              />
              <button
                className="btn-sm"
                onClick={async () => {
                  await fetch("/api/replies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      body: replyInputs[reply.id],
                      postId: reply.postId,
                      parentReplyId: reply.id,
                    }),
                  });
                  setReplyInputs((prev) => ({ ...prev, [reply.id]: "" }));
                  void fetchReplies(reply.postId);
                }}
              >
                Send
              </button>
            </div>
          )}

          {/* Children */}
          {reply.children.length > 0 && (
            <div className="reply-children">
              {renderReplies(reply.children)}
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <>
      <style>{globalStyles}</style>

      <div className="channel-wrap">
        {/* Header */}
        <header className="channel-header">
          <span className="channel-header-tag">Channel</span>
          <span className="channel-header-title">#{channelId}</span>
        </header>

        <main className="channel-content">
          {/* New post card */}
          <div className="new-post-card">
            <h2>New Post</h2>
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <div>
                  <label className="field-label">Title</label>
                  <input
                    className="input-base"
                    placeholder="What's on your mind?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Body (optional)</label>
                  <textarea
                    className="input-base"
                    placeholder="Add more context…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Posting…" : "Post"}
              </button>
            </form>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div className="empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>No posts yet — be the first to start a conversation.</p>
            </div>
          ) : (
            posts.map((post, i) => {
              const replyTree = repliesMap[post.id]
                ? buildReplyTree(repliesMap[post.id])
                : [];

              return (
                <div key={post.id} className="post-card">
                  {/* Post header */}
                  <div className="post-card-header">
                    <div className="post-number">Post #{i + 1}</div>
                    <h3 className="post-title">{post.title}</h3>
                    {post.body && <p className="post-body">{post.body}</p>}
                  </div>

                  {/* Replies */}
                  {replyTree.length > 0 && (
                    <div className="post-card-replies">
                      {renderReplies(replyTree)}
                    </div>
                  )}

                  {/* Reply bar */}
                  <div className="post-reply-bar">
                    <input
                      className="input-base"
                      placeholder="Write a reply… (Enter to send)"
                      value={replyInputs[post.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleReplySubmit(post.id);
                        }
                      }}
                    />
                    <button
                      className="btn-sm"
                      onClick={() => void handleReplySubmit(post.id)}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}