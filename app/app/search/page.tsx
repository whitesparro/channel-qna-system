"use client";

import { useState } from "react";
import Link from "next/link";

type Post = { id: number; title: string; body: string; author?: { displayName: string }; channel?: { name: string }; score?: number };
type Reply = { id: number; body: string; author?: { displayName: string }; post?: { id: number; title: string } };
type UserStat = { id: number; displayName: string; _count: { posts: number } };

const TYPES = [
  { value: "content", label: "🔍 Search Content" },
  { value: "author", label: "👤 By Author" },
  { value: "most", label: "🏆 Most Active Users" },
  { value: "least", label: "📉 Least Active Users" },
  { value: "top", label: "⬆ Highest Rated Posts" },
  { value: "bottom", label: "⬇ Lowest Rated Posts" },
];

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0c0c0f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" },
  nav: { background: "#111", borderBottom: "1px solid #222", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 },
  container: { maxWidth: 780, margin: "0 auto", padding: "32px 24px" },
  card: { background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: "16px 20px", marginBottom: 10 },
  input: { width: "100%", padding: 12, background: "#111", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 16, boxSizing: "border-box" as const },
  btn: { background: "#7c6af7", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 15 },
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("content");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ posts?: Post[]; replies?: Reply[]; users?: UserStat[]; total?: number } | null>(null);

  const search = async (p = 1) => {
    setLoading(true);
    setPage(p);
    const params = new URLSearchParams({ type, page: String(p) });
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  const needsQuery = type === "content" || type === "author";

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/" style={{ color: "#7c6af7", textDecoration: "none", fontWeight: 700 }}>📡 Channel Q&A</Link>
        <span style={{ color: "#555" }}>/ Search</span>
      </nav>

      <div style={S.container}>
        <h1 style={{ marginBottom: 24 }}>Search</h1>

        {/* TYPE SELECTOR */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => { setType(t.value); setResults(null); }}
              style={{ background: type === t.value ? "#7c6af7" : "#1a1a24", color: type === t.value ? "#fff" : "#aaa", border: "1px solid", borderColor: type === t.value ? "#7c6af7" : "#333", padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* QUERY INPUT */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={needsQuery ? "Enter search query..." : "Optional keyword filter..."}
            onKeyDown={(e) => e.key === "Enter" && search(1)}
            style={S.input}
          />
          <button onClick={() => search(1)} style={S.btn} disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {/* RESULTS */}
        {loading && <p style={{ color: "#555", textAlign: "center" }}>Searching...</p>}

        {results && !loading && (
          <>
            {/* User stats */}
            {results.users && (
              <>
                <h3 style={{ color: "#888", marginBottom: 10 }}>{results.users.length} users</h3>
                {results.users.length === 0 && <p style={{ color: "#555" }}>No users found.</p>}
                {results.users.map((u, i) => (
                  <div key={u.id} style={S.card}>
                    <span style={{ color: "#f7a76c", marginRight: 10 }}>#{i + 1}</span>
                    <b style={{ color: "#fff" }}>{u.displayName}</b>
                    <span style={{ color: "#555", marginLeft: 12 }}>{u._count.posts} posts</span>
                  </div>
                ))}
              </>
            )}

            {/* Posts */}
            {results.posts && (
              <>
                <h3 style={{ color: "#888", marginBottom: 10 }}>{results.posts.length} posts {results.total ? `(${results.total} total)` : ""}</h3>
                {results.posts.length === 0 && <p style={{ color: "#555" }}>No posts found.</p>}
                {results.posts.map((p) => (
                  <div key={p.id} style={S.card}>
                    <Link href={`/channel/${0}`} style={{ textDecoration: "none" }}>
                      <h4 style={{ margin: "0 0 6px", color: "#7c6af7" }}>{p.title}</h4>
                    </Link>
                    <p style={{ color: "#999", margin: "0 0 8px", fontSize: 13, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{p.body}</p>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#555" }}>
                      {p.author && <span>by {p.author.displayName}</span>}
                      {p.channel && <span>in #{p.channel.name}</span>}
                      {p.score !== undefined && <span style={{ color: p.score >= 0 ? "#6af77c" : "#f76c6c" }}>score: {p.score > 0 ? "+" : ""}{p.score}</span>}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Replies */}
            {results.replies && results.replies.length > 0 && (
              <>
                <h3 style={{ color: "#888", marginTop: 20, marginBottom: 10 }}>Replies ({results.replies.length})</h3>
                {results.replies.map((r) => (
                  <div key={r.id} style={{ ...S.card, borderLeft: "3px solid #333" }}>
                    <p style={{ margin: "0 0 6px", color: "#ccc", fontSize: 14 }}>{r.body.slice(0, 200)}{r.body.length > 200 ? "..." : ""}</p>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#555" }}>
                      {r.author && <span>by {r.author.displayName}</span>}
                      {r.post && <span>on &quot;{r.post.title}&quot;</span>}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Pagination */}
            {results.total && results.total > 10 && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
                <button onClick={() => search(page - 1)} disabled={page <= 1}
                  style={{ ...S.btn, background: page <= 1 ? "#222" : "#7c6af7", opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ color: "#555", alignSelf: "center" }}>Page {page}</span>
                <button onClick={() => search(page + 1)} disabled={results.posts!.length < 10}
                  style={{ ...S.btn, background: results.posts!.length < 10 ? "#222" : "#7c6af7", opacity: results.posts!.length < 10 ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </>
        )}

        {!results && !loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#444" }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <p>Select a search type and enter a query to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
