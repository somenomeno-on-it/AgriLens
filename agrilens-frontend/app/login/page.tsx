"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuthSession } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="agri-auth-bg">
          <div style={{ width: "100%", maxWidth: "440px" }}>
            <div className="agri-skeleton" style={{ height: "480px", borderRadius: "24px" }} />
          </div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.message || "Login failed");
        return;
      }

      saveAuthSession(payload.token, payload.user);
      const nextPath = searchParams.get("next");
      if (nextPath && nextPath.startsWith("/")) {
        router.push(nextPath);
        return;
      }
      const role = payload?.user?.role;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "agent") {
        router.push("/agent/dashboard");
      } else if (role === "customer") {
        router.push("/customer/profile");
      } else {
        router.push("/farmer");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agri-auth-bg">
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Brand area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              marginBottom: "16px",
              boxShadow: "0 4px 16px rgba(22,163,74,0.30)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
              <path d="M12 6v6l4 2" />
              <path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            AgriLens
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "6px", fontWeight: 500 }}>
            Bangladesh Agriculture Platform
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            border: "1.5px solid #dcfce7",
            boxShadow: "0 8px 40px rgba(22,163,74,0.10), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Card header accent */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              padding: "24px 32px 20px",
              borderBottom: "1.5px solid #dcfce7",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#14532d", margin: 0 }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: "0.83rem", color: "#15803d", marginTop: "4px" }}>
              Welcome back — enter your credentials below
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: "28px 32px" }}>
            <form style={{ display: "flex", flexDirection: "column", gap: "18px" }} onSubmit={onSubmit}>
              <div className="agri-field">
                <label className="agri-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    height: "44px",
                    width: "100%",
                    borderRadius: "10px",
                    border: "1.5px solid #bbf7d0",
                    padding: "0 14px",
                    fontSize: "0.9rem",
                    color: "#1c1917",
                    outline: "none",
                    background: "#fff",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#16a34a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#bbf7d0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div className="agri-field">
                <label className="agri-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    height: "44px",
                    width: "100%",
                    borderRadius: "10px",
                    border: "1.5px solid #bbf7d0",
                    padding: "0 14px",
                    fontSize: "0.9rem",
                    color: "#1c1917",
                    outline: "none",
                    background: "#fff",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#16a34a";
                    e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#bbf7d0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    color: "#dc2626",
                    fontSize: "0.83rem",
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="agri-btn-primary"
                style={{ width: "100%", marginTop: "4px", padding: "12px" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "24px 0",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#dcfce7" }} />
              <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "#dcfce7" }} />
            </div>

            {/* Guest link */}
            <Link
              href="/guest/map"
              style={{
                display: "block",
                textAlign: "center",
                padding: "11px",
                borderRadius: "10px",
                border: "1.5px solid #bbf7d0",
                color: "#15803d",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                background: "#f0fdf4",
                transition: "all 0.15s ease",
              }}
            >
              Continue as Guest (View Map)
            </Link>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 32px 24px",
              textAlign: "center",
              fontSize: "0.83rem",
              color: "#6b7280",
              borderTop: "1px solid #f0fdf4",
            }}
          >
            No account yet?{" "}
            <Link
              href="/signup"
              style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}
            >
              Create one for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
