import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0f",
        color: "#e8e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1>Channel Q&A System</h1>
      <p>Ask questions. Share knowledge. Learn together.</p>

      <Link href="/channel/1">Enter App →</Link>
    </div>
  );
}