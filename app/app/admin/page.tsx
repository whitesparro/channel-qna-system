"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = { id: number; displayName: string; role: string };
type Channel = { id: number; name: string; description?: string; _count?: { posts: number } };

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0c0c0f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" },
  nav: { background: "#111", borderBottom: "1px solid #222", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 },
  container: { maxWidth: 820, margin: "0 auto", padding: "32px 24px" },
  card: { background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: "16px 20px", marginBottom: 10 },
  btnDanger: { background: "#8b1a1a", color: "#ffa", border: "1px solid #c33", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  section: { marginBottom: 40 },
};

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, channelsRes] = await Promise.all([
      fetch("/api/admin/users", { credentials: "include" }),
      fetch("/api/channels"),
    ]);
    const usersData = await usersRes.json();
    const channelsData = await channelsRes.json();
    setUsers(Array.isArray(usersData) ? usersData : []);
    setChannels(Array.isArray(channelsData) ? channelsData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((u) => {
        setCurrentUser(u);
        if (u?.role === "ADMIN") {
          fetchData();
        } else {
          setLoading(false);
        }
      });
  }, []);

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) fetchData();
    else { const d = await res.json(); setError(d.error || "Failed"); }
  };

  const deleteChannel = async (id: number, name: string) => {
    if (!confirm(`Delete channel "#${name}" and ALL its posts? This cannot be undone.`)) return;
    const res = await fetch(`/api/channels/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) fetchData();
    else { const d = await res.json(); setError(d.error || "Failed"); }
  };

  if (!currentUser && !loading) {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", padding: 80 }}>
          <p>Please <Link href="/login" style={{ color: "#7c6af7" }}>login</Link> first.</p>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.role !== "ADMIN") {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", padding: 80 }}>
          <h2 style={{ color: "#f87" }}>Access Denied</h2>
          <p style={{ color: "#888" }}>You must be an admin to view this page.</p>
          <Link href="/" style={{ color: "#7c6af7" }}>← Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/" style={{ color: "#7c6af7", textDecoration: "none", fontWeight: 700 }}>📡 Channel Q&A</Link>
        <span style={{ color: "#555" }}>/ <span style={{ color: "#f7a76c" }}>⚙ Admin Panel</span></span>
      </nav>

      <div style={S.container}>
        <h1 style={{ marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ color: "#888", marginBottom: 32 }}>Manage users, channels, and content.</p>

        {error && (
          <div style={{ background: "#3a1515", border: "1px solid #c33", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#faa" }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#faa", cursor: "pointer", marginLeft: 10 }}>✕</button>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#555" }}>Loading...</p>
        ) : (
          <>
            {/* USERS */}
            <div style={S.section}>
              <h2 style={{ marginBottom: 14, fontSize: 20 }}>Users ({users.length})</h2>
              {users.map((u) => (
                <div key={u.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b style={{ color: "#fff" }}>{u.displayName}</b>
                    <span style={{ marginLeft: 10, fontSize: 12, color: u.role === "ADMIN" ? "#f7a76c" : "#555", background: "#111", padding: "2px 8px", borderRadius: 10 }}>
                      {u.role}
                    </span>
                  </div>
                  {u.id !== currentUser?.id && (
                    <button style={S.btnDanger} onClick={() => deleteUser(u.id, u.displayName)}>
                      Remove User
                    </button>
                  )}
                  {u.id === currentUser?.id && (
                    <span style={{ color: "#555", fontSize: 12 }}>(you)</span>
                  )}
                </div>
              ))}
            </div>

            {/* CHANNELS */}
            <div style={S.section}>
              <h2 style={{ marginBottom: 14, fontSize: 20 }}>Channels ({channels.length})</h2>
              {channels.map((ch) => (
                <div key={ch.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b style={{ color: "#fff" }}>#{ch.name}</b>
                    {ch.description && <span style={{ color: "#666", marginLeft: 10, fontSize: 13 }}>{ch.description}</span>}
                    <span style={{ marginLeft: 10, fontSize: 12, color: "#555" }}>{ch._count?.posts ?? 0} posts</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link href={`/channel/${ch.id}`} style={{ color: "#7c6af7", fontSize: 13, textDecoration: "none" }}>View</Link>
                    <button style={S.btnDanger} onClick={() => deleteChannel(ch.id, ch.name)}>
                      Delete Channel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
