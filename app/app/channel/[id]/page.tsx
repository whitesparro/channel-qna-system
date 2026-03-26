"use client";

import { useEffect, useState } from "react";
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

// 🔥 Tree type (no more "any")
type ReplyNode = Reply & {
  children: ReplyNode[];
};

export default function ChannelPage() {
  const params = useParams();
  const channelId = Number(params.id);

  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [repliesMap, setRepliesMap] = useState<Record<number, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  // FETCH REPLIES
  const fetchReplies = async (postId: number): Promise<void> => {
    const data: Reply[] = await fetch(
      `/api/replies?postId=${postId}`
    ).then((res) => res.json());

    setRepliesMap((prev) => ({
      ...prev,
      [postId]: data,
    }));
  };

  // FETCH POSTS
  useEffect(() => {
    fetch(`/api/posts?channelId=${channelId}`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        setPosts(data);
        data.forEach((post) => {
          void fetchReplies(post.id);
        });
      });
  }, [channelId]);

  // CREATE POST
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
      data.forEach((post) => {
        void fetchReplies(post.id);
      });
    }
  };

  // CREATE TOP-LEVEL REPLY
  const handleReplySubmit = async (postId: number): Promise<void> => {
    const content = replyInputs[postId];
    if (!content) return;

    await fetch("/api/replies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: content, postId }),
    });

    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    void fetchReplies(postId);
  };

  // 🔥 BUILD TREE (typed)
  const buildReplyTree = (replies: Reply[]): ReplyNode[] => {
    const map: Record<number, ReplyNode> = {};
    const roots: ReplyNode[] = [];

    replies.forEach((r) => {
      map[r.id] = { ...r, children: [] };
    });

    replies.forEach((r) => {
      if (r.parentReplyId) {
        map[r.parentReplyId]?.children.push(map[r.id]);
      } else {
        roots.push(map[r.id]);
      }
    });

    return roots;
  };

  // 🔥 RENDER TREE (typed)
  const renderReplies = (
    replies: ReplyNode[],
    level = 0
  ): React.ReactNode => {
    return replies.map((reply) => (
      <div
        key={reply.id}
        style={{
          marginLeft: level * 20,
          backgroundColor: "#2a2a2e",
          padding: "8px",
          borderRadius: "6px",
          marginBottom: "6px",
        }}
      >
        <div>{reply.body}</div>

        <button
          onClick={() =>
            setReplyInputs((prev) => ({
              ...prev,
              [reply.id]: prev[reply.id] || "",
            }))
          }
          style={{
            fontSize: "12px",
            marginTop: "5px",
            background: "transparent",
            color: "#6366f1",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reply
        </button>

        {replyInputs[reply.id] !== undefined && (
          <div style={{ marginTop: "5px" }}>
            <input
              placeholder="Reply to this..."
              value={replyInputs[reply.id]}
              onChange={(e) =>
                setReplyInputs((prev) => ({
                  ...prev,
                  [reply.id]: e.target.value,
                }))
              }
              style={{ width: "100%", padding: "6px", marginBottom: "5px" }}
            />

            <button
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

                setReplyInputs((prev) => ({
                  ...prev,
                  [reply.id]: "",
                }));

                void fetchReplies(reply.postId);
              }}
              style={{
                fontSize: "12px",
                backgroundColor: "#6366f1",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Submit
            </button>
          </div>
        )}

        {reply.children.length > 0 &&
          renderReplies(reply.children, level + 1)}
      </div>
    ));
  };

  return (
    <div style={{ padding: "40px", background: "#131315", color: "white" }}>
      <h1>Channel {channelId}</h1>

      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="submit">Create</button>
      </form>

      {posts.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>

          {repliesMap[post.id] &&
            renderReplies(buildReplyTree(repliesMap[post.id]))}

          <input
            value={replyInputs[post.id] || ""}
            onChange={(e) =>
              setReplyInputs((prev) => ({
                ...prev,
                [post.id]: e.target.value,
              }))
            }
          />

          <button onClick={() => handleReplySubmit(post.id)}>
            Reply
          </button>
        </div>
      ))}
    </div>
  );
}