"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.short.hasankurt.com";

export default function RedirectClient() {
  useEffect(() => {
    const code = window.location.pathname.replace(/^\//, "");
    if (!code) return;
    window.location.replace(`${API_URL}/${code}`);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        fontFamily: "'DM Mono', monospace",
        fontSize: "12px",
        color: "var(--text-secondary)",
        letterSpacing: "0.05em",
      }}
    >
      redirecting...
    </main>
  );
}