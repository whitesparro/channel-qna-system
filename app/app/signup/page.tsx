"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) { setError("Username is required."); return; }
    if (displayName.length < 2) { setError("Username must be at least 2 characters."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/");
    else {
      const d = await res.json();
      setError(d.error || "Signup failed.");
    }
  };

  const S: Record<string, React.CSSProperties> = {
    page: { minHeight: "100vh", background: "#0c0c0f", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" },
    box: { background: "#1a1a24", border: "1px solid #222", borderRadius: 14, padding: "40px 36px", width: "100%", maxWidth: 400 },
    input: { width: "100%", padding: 12, background: "#111", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 15, boxSizing: "border-box" as const, marginBottom: 16 },
    btn: { width: "100%", background: "#7c6af7", color: "#fff", border: "none", padding: 13, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" },
    label: { display: "block", color: "#aaa", fontSize: 13, marginBottom: 6 },
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <h2 style={{ margin: "0 0 6px", color: "#fff", textAlign: "center" }}>Create account</h2>
        <p style={{ color: "#888", textAlign: "center", marginBottom: 28, marginTop: 0 }}>Join Channel Q&A</p>

        {error && <div style={{ background: "#3a1515", border: "1px solid #c33", borderRadius: 8, padding: "10px 14px", color: "#faa", marginBottom: 16 }}>{error}</div>}

        <form onSubmit={signup}>
          <label style={S.label} htmlFor="displayName">Username</label>
          <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Choose a username" maxLength={30} autoComplete="username" style={S.input} />

          <label style={S.label} htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters" autoComplete="new-password" style={S.input} />

          <button type="submit" style={S.btn} disabled={loading}>{loading ? "Creating account..." : "Sign Up"}</button>
        </form>

        <p style={{ textAlign: "center", color: "#666", marginTop: 20, fontSize: 14 }}>
          Already have an account? <Link href="/login" style={{ color: "#7c6af7" }}>Sign in</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 6 }}>
          <Link href="/" style={{ color: "#555", fontSize: 13 }}>← Back to channels</Link>
        </p>
      </div>
    </div>
  );
}
