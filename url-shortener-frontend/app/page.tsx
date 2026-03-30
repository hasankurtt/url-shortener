"use client";

import { useState, useEffect } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://short.hasankurt.com";

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const mono = (
  size: number,
  color: string,
  extra?: React.CSSProperties
): React.CSSProperties => ({
  fontFamily: "'DM Mono', monospace",
  fontSize: `${size}px`,
  color: `var(--${color})`,
  ...extra,
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const hasProtocol = url.startsWith("http://") || url.startsWith("https://");

  useEffect(() => {
    const path = window.location.pathname;
    if (path !== "/" && path !== "") {
      const code = path.replace(/^\//, "");
      window.location.replace(`https://api.short.hasankurt.com/${code}`);
    }
  }, []);

  const handleShorten = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setShortUrl("");

    try {
      const res = await fetch(`${API_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeUrl(url) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setShortUrl(data.short_url);
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleShorten();
  };

  const features = [
    { title: "Serverless", desc: "Lambda + API Gateway" },
    { title: "Private", desc: "Zero tracking" },
    { title: "Fast", desc: "CloudFront edge" },
  ];

  return (
    <main className="min-h-dvh flex flex-col">
      {/* ── Header ── */}
      <header
        className="fade-up fade-up-1 flex items-center justify-between px-5 sm:px-8"
        style={{
          height: "52px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          <span
            style={mono(11, "text-secondary", { letterSpacing: "0.06em" })}
          >
            short.hasankurt.com
          </span>

          <div className="flex items-center gap-1.5">
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "var(--green)",
                display: "inline-block",
              }}
            />
            <span
              style={mono(10, "green", {
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              })}
            >
              operational
            </span>
          </div>
        </div>

        <a
          href="https://hasankurt.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-block"
          style={{
            ...mono(11, "text-muted", { letterSpacing: "0.04em" }),
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          hasankurt.com
        </a>
      </header>

      {/* ── Content ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 sm:px-6 py-12 sm:py-20">
        <div className="w-full max-w-[480px] text-center sm:text-left">
          {/* Label */}
          <div className="fade-up fade-up-1 flex items-center justify-center sm:justify-start gap-2 mb-5 sm:mb-6">
            <span
              style={mono(10, "text-muted", {
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              })}
            >
              URL Shortener
            </span>
            <span className="cursor" />
          </div>

          {/* Heading */}
          <h1
            className="fade-up fade-up-2"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "1rem",
            }}
          >
            Shorten.
            <br />
            <span style={{ color: "var(--text-secondary)" }}>
              Share faster.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="fade-up fade-up-2 mx-auto sm:mx-0"
            style={{
              ...mono(12, "text-secondary", { lineHeight: "1.8" }),
              marginBottom: "2rem",
              maxWidth: "360px",
            }}
          >
            Serverless. Built on AWS Lambda + DynamoDB.
            <br />
            No tracking. No ads. No nonsense.
          </p>

          {/* Input */}
          <div
            className="fade-up fade-up-3 input-wrapper"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "5px 5px 5px 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              textAlign: "left",
            }}
          >
            {!hasProtocol && (
              <span
                className="prefix-text"
                style={mono(12, "text-muted", { flexShrink: 0 })}
              >
                https://
              </span>
            )}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="your-long-url.com/goes/here"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px",
                color: "var(--text-primary)",
                caretColor: "var(--text-secondary)",
                padding: "12px 4px",
                minWidth: 0,
              }}
            />
            <button
              onClick={handleShorten}
              disabled={loading || !url.trim()}
              style={{
                background:
                  loading || !url.trim()
                    ? "var(--border)"
                    : "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "8px",
                padding: "10px 22px",
                fontFamily: "'Syne', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                opacity: loading || !url.trim() ? 0.35 : 1,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                flexShrink: 0,
              }}
            >
              {loading ? "..." : "Shorten"}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                ...mono(11, "error"),
                marginTop: "12px",
                padding: "11px 14px",
                background: "var(--error-bg)",
                border: "1px solid var(--error-border)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                textAlign: "left",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 4.5v4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          {/* Result */}
          {shortUrl && (
            <div
              className="fade-up fade-up-1 result-box"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "12px",
                textAlign: "left",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={mono(9, "text-muted", {
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                  })}
                >
                  Shortened URL
                </div>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...mono(13, "text-primary", { letterSpacing: "0.01em" }),
                    textDecoration: "none",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.textDecoration = "underline")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.textDecoration = "none")
                  }
                >
                  {shortUrl.replace("https://", "")}
                </a>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  background: copied
                    ? "rgba(74,222,128,0.08)"
                    : "transparent",
                  color: copied ? "var(--green)" : "var(--text-secondary)",
                  border: `1px solid ${copied ? "var(--green-dim)" : "var(--border-hover)"}`,
                  borderRadius: "7px",
                  padding: "8px 16px",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {copied ? "copied" : "copy"}
              </button>
            </div>
          )}

          {/* Features */}
          <div className="fade-up fade-up-4 features-grid mt-8 sm:mt-10">
            {features.map((f) => (
              <div key={f.title} className="feature-cell">
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    marginBottom: "3px",
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={mono(10, "text-secondary", {
                    letterSpacing: "0.02em",
                  })}
                >
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="fade-up fade-up-5 px-5 sm:px-8 py-5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="footer-inner flex items-center justify-between"
          style={mono(10, "text-muted", { letterSpacing: "0.03em" })}
        >
          <span>
            Built with AWS Lambda / API Gateway / DynamoDB / CloudFront /
            Terraform
          </span>
          <span>&copy; 2026 Hasan Kurt</span>
        </div>
      </footer>
    </main>
  );
}