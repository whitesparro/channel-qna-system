"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Channel = {
  id: number;
  name: string;
  description?: string;
  creator?: { displayName: string };
  _count?: { posts: number };
};

type User = { displayName: string; role: string } | null;

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [user, setUser] = useState<User>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchChannels = async () => {
    const res = await fetch("/api/channels");
    const data = await res.json();
    setChannels(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const userRes = await fetch("/api/auth/me", { credentials: "include" });
      const userData = await userRes.json();
      setUser(userData);
      await fetchChannels();
    };
    initialize();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Channel name is required"); return; }
    const res = await fetch("/api/channels", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to create channel"); return; }
    setName("");
    setDesc("");
    setCreating(false);
    setLoading(true);
    fetchChannels();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c0f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: "#111", borderBottom: "1px solid #222", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#7c6af7" }}>Channel Q&A</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/search" style={{ color: "#aaa", textDecoration: "none" }}>Search</Link>
          {user ? (
            <>
              <span style={{ color: "#888" }}><b style={{ color: "#e8e8f0" }}>{user.displayName}</b></span>
              {user.role === "ADMIN" && <Link href="/admin" style={{ color: "#f7a76c", textDecoration: "none" }}>Admin</Link>}
              <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); location.reload(); }}
                style={{ background: "none", border: "1px solid #444", color: "#aaa", padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: "#7c6af7", textDecoration: "none" }}>Login</Link>
              <Link href="/signup" style={{ background: "#7c6af7", color: "#fff", textDecoration: "none", padding: "6px 16px", borderRadius: 6 }}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "48px 24px 32px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, color: "#fff" }}>Programming Q&A</h1>
        <p style={{ color: "#888", marginTop: 10, fontSize: 16 }}>Browse channels, ask questions, share knowledge.</p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 48px" }}>
        {/* CREATE CHANNEL */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Channels</h2>
          {user && (
            <button onClick={() => setCreating(!creating)}
              style={{ background: "#7c6af7", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
              + New Channel
            </button>
          )}
          {!user && <Link href="/login" style={{ color: "#7c6af7" }}>Login to create channels</Link>}
        </div>

        {creating && (
          <form onSubmit={handleCreate} style={{ background: "#1a1a24", border: "1px solid #333", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff" }}>Create Channel</h3>
            {error && <p style={{ color: "#f87", marginBottom: 10 }}>{error}</p>}
            <label style={{ display: "block", marginBottom: 4, color: "#aaa", fontSize: 13 }}>Channel name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50}
              placeholder="e.g. javascript"
              style={{ width: "100%", padding: 10, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", marginBottom: 12, boxSizing: "border-box" }} />
            <label style={{ display: "block", marginBottom: 4, color: "#aaa", fontSize: 13 }}>Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description"
              style={{ width: "100%", padding: 10, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", marginBottom: 12, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={{ background: "#7c6af7", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Create</button>
              <button type="button" onClick={() => { setCreating(false); setError(""); }}
                style={{ background: "none", border: "1px solid #444", color: "#aaa", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        )}

        {/* CHANNEL LIST */}
        {loading ? (
          <p style={{ color: "#555", textAlign: "center", padding: 40 }}>Loading channels...</p>
        ) : channels.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#555" }}>
            <p>No channels yet. Be the first to create one!</p>
          </div>
        ) : (
          channels.map((ch) => (
            <Link key={ch.id} href={`/channel/${ch.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: "18px 22px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c6af7")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#fff", fontSize: 17 }}>#{ch.name}</span>
                  <span style={{ color: "#555", fontSize: 13 }}>{ch._count?.posts ?? 0} posts</span>
                </div>
                {ch.description && <p style={{ color: "#888", margin: "6px 0 0", fontSize: 14 }}>{ch.description}</p>}
                {ch.creator && <small style={{ color: "#555" }}>created by {ch.creator.displayName}</small>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
