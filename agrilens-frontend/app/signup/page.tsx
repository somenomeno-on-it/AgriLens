"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthSession, type AuthRole } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const inputStyle: React.CSSProperties = {
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
};

function StyledInput({
  id, type = "text", value, onChange, required, placeholder,
}: {
  id: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; placeholder?: string;
}) {
  return (
    <input
      id={id} type={type} value={value} onChange={onChange}
      required={required} placeholder={placeholder} style={inputStyle}
      onFocus={(e) => { e.target.style.borderColor = "#16a34a"; e.target.style.boxShadow = "0 0 0 3px rgba(22,163,74,0.12)"; }}
      onBlur={(e) => { e.target.style.borderColor = "#bbf7d0"; e.target.style.boxShadow = "none"; }}
    />
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AuthRole>("farmer");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role, phone, address }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) { setError(payload?.message || "Signup failed"); return; }
      saveAuthSession(payload.token, payload.user);
      if (payload.user?.role === "admin") router.push("/admin/dashboard");
      else if (payload.user?.role === "agent") router.push("/agent/dashboard");
      else if (payload.user?.role === "customer") router.push("/customer/profile");
      else router.push("/farmer");
    } catch {
      setError("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const roleDesc: Record<string, string> = {
    farmer: "List and sell your produce directly to customers",
    agent: "Review and approve farmer produce listings",
    customer: "Browse and order fresh produce from local farmers",
  };

  return (
    <div className="agri-auth-bg" style={{ alignItems: "flex-start", paddingTop: "40px", paddingBottom: "40px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", marginBottom: "14px", boxShadow: "0 4px 16px rgba(22,163,74,0.30)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
              <path d="M12 6v6l4 2" /><path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, background: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em", margin: 0 }}>AgriLens</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "6px", fontWeight: 500 }}>Join Bangladesh&apos;s agriculture platform</p>
        </div>

        <div style={{ background: "#fff", borderRadius: "24px", border: "1.5px solid #dcfce7", boxShadow: "0 8px 40px rgba(22,163,74,0.10), 0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", padding: "24px 32px 20px", borderBottom: "1.5px solid #dcfce7" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#14532d", margin: 0 }}>Create your account</h2>
            <p style={{ fontSize: "0.83rem", color: "#15803d", marginTop: "4px" }}>Fill in your details to get started</p>
          </div>

          <div style={{ padding: "28px 32px" }}>
            <form style={{ display: "flex", flexDirection: "column", gap: "16px" }} onSubmit={onSubmit}>
              <div className="agri-field">
                <label className="agri-label" htmlFor="fullName">Full Name</label>
                <StyledInput id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahim Uddin" />
              </div>
              <div className="agri-field">
                <label className="agri-label" htmlFor="email">Email address</label>
                <StyledInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
              <div className="agri-field">
                <label className="agri-label" htmlFor="password">Password</label>
                <StyledInput id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Choose a strong password" />
              </div>
              <div className="agri-field">
                <label className="agri-label" htmlFor="role">I am a</label>
                <select id="role" className="agri-select" value={role} onChange={(e) => setRole(e.target.value as AuthRole)}>
                  <option value="farmer">Farmer</option>
                  <option value="agent">Agent</option>
                  <option value="customer">Customer</option>
                </select>
                <div style={{ marginTop: "6px", padding: "6px 12px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.76rem", color: "#15803d", fontWeight: 500 }}>
                  {roleDesc[role]}
                </div>
              </div>
              {role === "farmer" && (
                <>
                  <div className="agri-field">
                    <label className="agri-label" htmlFor="phone">Phone Number</label>
                    <StyledInput id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 01711-000000" />
                  </div>
                  <div className="agri-field">
                    <label className="agri-label" htmlFor="address">Address</label>
                    <StyledInput id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Village, Upazila, District" />
                  </div>
                </>
              )}
              {role === "customer" && (
                <div className="agri-field">
                  <label className="agri-label" htmlFor="customer-phone">Phone Number (optional)</label>
                  <StyledInput id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 01711-000000" />
                </div>
              )}
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#fef2f2", border: "1.5px solid #fecaca", color: "#dc2626", fontSize: "0.83rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}
              <button id="signup-submit-btn" type="submit" disabled={loading} className="agri-btn-primary" style={{ width: "100%", padding: "12px", marginTop: "4px" }}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>

          <div style={{ padding: "16px 32px 24px", textAlign: "center", fontSize: "0.83rem", color: "#6b7280", borderTop: "1px solid #f0fdf4" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
