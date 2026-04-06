"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signup = async () => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, password }),
    });

    if (res.ok) router.push("/channel/1");
    else alert("Signup failed");
  };

  return (
    <div>
      <h2>Signup</h2>
      <input onChange={(e) => setDisplayName(e.target.value)} />
      <input type="password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={signup}>Signup</button>
    </div>
  );
}