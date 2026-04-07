"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: number;
  displayName: string;
  role: string;
  _count?: { posts: number; replies: number };
};
type Channel = { id: number; name: string; description?: string; _count?: { posts: number } };

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0c0c0f", color: "#e8e8f0", fontFamily: "system-ui, sans-serif" },
  nav: { background: "#111", borderBottom: "1px solid #222", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 },
  container: { maxWidth: 900, margin: "0 auto", padding: "32px 24px" },
  card: { background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: "16px 20px", marginBottom: 10 },
  statCard: { background: "#1a1a24", border: "1px solid #222", borderRadius: 10, padding: "20px 24px", flex: 1, textAlign: "center" as const },
  btn: { background: "#7c6af7", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 },
  btnDanger: { background: "#8b1a1a", color: "#ffa", border: "1px solid #c33", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  btnPromote: { background: "#1a3a1a", color: "#6af77c", border: "1px solid #2a5a2a", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  btnDemote: { background: "#3a3a1a", color: "#f7e76c", border: "1px solid #5a5a2a", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  input: { width: "100%", padding: "9px 12px", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", marginBottom: 10, boxSizing: "border-box" as const, fontSize: 14 },
  section: { marginBottom: 44 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
};

function tagStyle(isAdmin: boolean): React.CSSProperties {
  return {
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
    background: isAdmin ? "#2a1a00" : "#111",
    color: isAdmin ? "#f7a76c" : "#555",
    border: isAdmin ? "1px solid #5a3a00" : "1px solid #222",
    marginLeft: 8,
  };
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div style={{ background: "#3a1515", border: "1px solid #c33", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#faa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#faa", cursor: "pointer", fontSize: 16 }}>×</button>
    </div>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "channels">("overview");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const safeJson = async (res: Response) => {
    try { return await res.json(); } catch { return {}; }
  };

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, channelsRes] = await Promise.all([
      fetch("/api/admin/users", { credentials: "include" }),
      fetch("/api/channels"),
    ]);
    if (!usersRes.ok) { setError("Failed to load admin data"); setLoading(false); return; }
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
        if (u?.role === "ADMIN") fetchData();
        else setLoading(false);
      });
  }, []);

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? Their posts/replies will be anonymized.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) fetchData();
    else { const d = await safeJson(res); setError(d.error || "Failed to delete user"); }
  };

  const changeRole = async (id: number, name: string, newRole: "ADMIN" | "USER") => {
    const verb = newRole === "ADMIN" ? "Promote" : "Demote";
    if (!confirm(`${verb} "${name}" to ${newRole}?`)) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    if (res.ok) fetchData();
    else { const d = await safeJson(res); setError(d.error || `Failed to ${verb.toLowerCase()} user`); }
  };

  const deleteChannel = async (id: number, name: string) => {
    if (!confirm(`Delete "#${name}" and ALL its posts? This cannot be undone.`)) return;
    const res = await fetch(`/api/channels/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) fetchData();
    else { const d = await safeJson(res); setError(d.error || "Failed to delete channel"); }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return setError("Channel name is required");
    setCreatingChannel(true);
    const res = await fetch("/api/channels", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newChannelName.trim(), description: newChannelDesc.trim() }),
    });
    if (res.ok) { setNewChannelName(""); setNewChannelDesc(""); fetchData(); }
    else { const d = await safeJson(res); setError(d.error || "Failed to create channel"); }
    setCreatingChannel(false);
  };

  if (!loading && !currentUser) {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", padding: 80 }}>
          <p>Please <Link href="/login" style={{ color: "#7c6af7" }}>login</Link> first.</p>
        </div>
      </div>
    );
  }

  if (!loading && currentUser && currentUser.role !== "ADMIN") {
    return (
      <div style={S.page}>
        <div style={{ textAlign: "center", padding: 80 }}>
          <h2 style={{ color: "#f87" }}>Access Denied</h2>
          <p style={{ color: "#888" }}>Admin access required.</p>
          <Link href="/" style={{ color: "#7c6af7" }}>← Go Home</Link>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.displayName.toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalPosts = channels.reduce((sum, ch) => sum + (ch._count?.posts ?? 0), 0);
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, border: "none",
    background: activeTab === tab ? "#7c6af7" : "none",
    color: activeTab === tab ? "#fff" : "#888",
  });

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link href="/" style={{ color: "#7c6af7", textDecoration: "none", fontWeight: 700 }}>Channel Q&A</Link>
        <span style={{ color: "#555" }}>/ <span style={{ color: "#f7a76c" }}>Admin Panel</span></span>
        <span style={{ flex: 1 }} />
        <span style={{ color: "#888", fontSize: 13 }}>
          Signed in as <b style={{ color: "#f7a76c" }}>{currentUser?.displayName}</b>
        </span>
      </nav>

      <div style={S.container}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 4px" }}>Admin Panel</h1>
          <p style={{ color: "#888", margin: 0 }}>Manage users, channels, and site content.</p>
        </div>

        {error && <ErrorBanner msg={error} onClose={() => setError("")} />}

        <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#111", borderRadius: 8, padding: 4, width: "fit-content" }}>
          <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>Overview</button>
          <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>
            Users {!loading && <span style={{ fontSize: 11, opacity: 0.7 }}>({users.length})</span>}
          </button>
          <button style={tabStyle("channels")} onClick={() => setActiveTab("channels")}>
            Channels {!loading && <span style={{ fontSize: 11, opacity: 0.7 }}>({channels.length})</span>}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#555" }}>Loading...</p>
        ) : (
          <>
            {activeTab === "overview" && (
              <div style={S.section}>
                <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
                  <div style={S.statCard}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#7c6af7" }}>{users.length}</div>
                    <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Total Users</div>
                  </div>
                  <div style={S.statCard}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#f7a76c" }}>{adminCount}</div>
                    <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Admins</div>
                  </div>
                  <div style={S.statCard}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#6af77c" }}>{channels.length}</div>
                    <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Channels</div>
                  </div>
                  <div style={S.statCard}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#6acdf7" }}>{totalPosts}</div>
                    <div style={{ color: "#888", fontSize: 14, marginTop: 4 }}>Total Posts</div>
                  </div>
                </div>

                <h2 style={{ fontSize: 18, marginBottom: 14 }}>Quick Actions</h2>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
                  <button style={S.btn} onClick={() => setActiveTab("users")}>Manage Users →</button>
                  <button style={S.btn} onClick={() => setActiveTab("channels")}>Manage Channels →</button>
                </div>

                <h2 style={{ fontSize: 18, marginBottom: 14 }}>Top Channels by Posts</h2>
                {[...channels]
                  .sort((a, b) => (b._count?.posts ?? 0) - (a._count?.posts ?? 0))
                  .slice(0, 5)
                  .map((ch) => (
                    <div key={ch.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <b style={{ color: "#fff" }}>#{ch.name}</b>
                        {ch.description && <span style={{ color: "#666", marginLeft: 10, fontSize: 13 }}>{ch.description}</span>}
                      </div>
                      <span style={{ color: "#6acdf7", fontSize: 14, fontWeight: 700 }}>{ch._count?.posts ?? 0} posts</span>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "users" && (
              <div style={S.section}>
                <div style={S.sectionHeader}>
                  <h2 style={{ fontSize: 20, margin: 0 }}>Users ({users.length})</h2>
                </div>
                <input
                  placeholder="Search users by name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ ...S.input, marginBottom: 16, maxWidth: 320 }}
                />
                {filteredUsers.length === 0 && <p style={{ color: "#555" }}>No users match your search.</p>}
                {filteredUsers.map((u) => (
                  <div key={u.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <b style={{ color: "#fff" }}>{u.displayName}</b>
                      <span style={tagStyle(u.role === "ADMIN")}>{u.role}</span>
                      <span style={{ color: "#555", fontSize: 12, marginLeft: 10 }}>
                        {u._count?.posts ?? 0} posts · {u._count?.replies ?? 0} replies
                      </span>
                      {u.id === currentUser?.id && (
                        <span style={{ color: "#7c6af7", fontSize: 11, marginLeft: 8 }}>(you)</span>
                      )}
                    </div>
                    {u.id !== currentUser?.id && (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        {u.role === "USER" ? (
                          <button style={S.btnPromote} onClick={() => changeRole(u.id, u.displayName, "ADMIN")}>
                            Promote to Admin
                          </button>
                        ) : (
                          <button style={S.btnDemote} onClick={() => changeRole(u.id, u.displayName, "USER")}>
                            Demote to User
                          </button>
                        )}
                        <button style={S.btnDanger} onClick={() => deleteUser(u.id, u.displayName)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "channels" && (
              <div style={S.section}>
                <div style={{ ...S.card, borderColor: "#2a2a3a", marginBottom: 24 }}>
                  <h3 style={{ margin: "0 0 14px", color: "#fff", fontSize: 16 }}>Create New Channel</h3>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input
                      placeholder="channel-name"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      onKeyDown={(e) => { if (e.key === "Enter") createChannel(); }}
                      style={{ ...S.input, margin: 0, flex: "1 1 180px" }}
                    />
                    <input
                      placeholder="Description (optional)"
                      value={newChannelDesc}
                      onChange={(e) => setNewChannelDesc(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") createChannel(); }}
                      style={{ ...S.input, margin: 0, flex: "2 1 260px" }}
                    />
                    <button
                      style={{ ...S.btn, alignSelf: "center", whiteSpace: "nowrap" as const }}
                      onClick={createChannel}
                      disabled={creatingChannel}
                    >
                      {creatingChannel ? "Creating..." : "+ Create Channel"}
                    </button>
                  </div>
                </div>

                <div style={S.sectionHeader}>
                  <h2 style={{ fontSize: 20, margin: 0 }}>All Channels ({channels.length})</h2>
                </div>
                {channels.length === 0 && <p style={{ color: "#555" }}>No channels yet.</p>}
                {channels.map((ch) => (
                  <div key={ch.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <b style={{ color: "#fff" }}>#{ch.name}</b>
                      {ch.description && <span style={{ color: "#666", marginLeft: 10, fontSize: 13 }}>{ch.description}</span>}
                      <span style={{ marginLeft: 10, fontSize: 12, color: "#555" }}>{ch._count?.posts ?? 0} posts</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        href={`/channel/${ch.id}`}
                        style={{ color: "#7c6af7", fontSize: 13, textDecoration: "none", padding: "5px 10px", border: "1px solid #3a3a5a", borderRadius: 4 }}
                      >
                        View
                      </Link>
                      <button style={S.btnDanger} onClick={() => deleteChannel(ch.id, ch.name)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
