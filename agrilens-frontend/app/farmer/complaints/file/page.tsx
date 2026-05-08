"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createComplaint,
  fetchAllAgents,
  uploadComplaintEvidence,
  type Agent,
} from "@/lib/complaints";

const MAX_FILES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type Step = "form" | "evidence" | "done";

export default function FileComplaintPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const [agentId, setAgentId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [complaintId, setComplaintId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const [step, setStep] = useState<Step>("form");

  useEffect(() => {
    fetchAllAgents()
      .then(setAgents)
      .finally(() => setAgentsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!agentId) { setFormError("Please select an agent."); return; }
    if (!subject.trim()) { setFormError("Subject is required."); return; }
    if (!description.trim()) { setFormError("Description is required."); return; }

    setSubmitting(true);
    try {
      const complaint = await createComplaint({ agentId, subject, description });
      setComplaintId(complaint._id);
      setStep("evidence");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const picked = Array.from(e.target.files ?? []);
    const valid: File[] = [];
    for (const f of picked) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError("Only JPEG, PNG, WebP images and PDFs are allowed.");
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setFileError(`"${f.name}" exceeds the 10 MB limit.`);
        return;
      }
      valid.push(f);
    }
    const merged = [...selectedFiles, ...valid].slice(0, MAX_FILES);
    setSelectedFiles(merged);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUploadEvidence = async () => {
    if (!complaintId) return;
    if (selectedFiles.length === 0) { setStep("done"); return; }
    setFileError("");
    setUploading(true);
    try {
      const result = await uploadComplaintEvidence(complaintId, selectedFiles);
      setUploadedUrls(result.evidenceUrls);
      setStep("done");
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const skipEvidence = () => setStep("done");

  if (step === "done") {
    return (
      <div className="agri-page" style={{ display: "flex", justifyContent: "center", paddingTop: "64px" }}>
        <div className="agri-card" style={{ maxWidth: "480px", width: "100%", padding: "40px 32px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 4px 20px rgba(22,163,74,0.15)" }}>
            <svg width="40" height="40" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#14532d", margin: "0 0 12px" }}>Complaint Submitted</h1>
          <p style={{ fontSize: "0.9rem", color: "#44403c", lineHeight: 1.5, margin: "0 0 32px" }}>
            Your complaint has been filed and is now under review.
            {uploadedUrls.length > 0 && ` ${uploadedUrls.length} evidence file(s) attached.`}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/farmer/complaints" className="agri-btn-primary" style={{ textDecoration: "none" }}>View My Complaints</Link>
            <Link href="/farmer" className="agri-btn-outline" style={{ textDecoration: "none" }}>Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "evidence") {
    return (
      <div className="agri-page" style={{ display: "flex", justifyContent: "center", paddingTop: "40px" }}>
        <div className="agri-card" style={{ maxWidth: "540px", width: "100%", padding: "32px" }}>
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#14532d", margin: "0 0 6px" }}>Attach Evidence</h1>
            <p style={{ fontSize: "0.85rem", color: "#78716c", margin: 0 }}>
              Optionally attach up to {MAX_FILES} files (images or PDFs, max 10 MB each).
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "100%", border: "2px dashed #bbf7d0", borderRadius: "16px", padding: "32px", textAlign: "center", background: "#f0fdf4", cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#dcfce7"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f0fdf4"}
          >
            <svg style={{ margin: "0 auto 12px" }} width="40" height="40" fill="none" stroke="#16a34a" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#14532d", margin: "0 0 4px" }}>Click to choose files</p>
            <p style={{ fontSize: "0.75rem", color: "#15803d", margin: 0 }}>JPEG, PNG, WebP, PDF · max 10 MB · up to 3 files</p>
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: "none" }} onChange={handleFileChange} />

          {selectedFiles.length > 0 && (
            <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 0", display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedFiles.map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #e7e5e4", borderRadius: "10px", padding: "10px 14px", fontSize: "0.85rem" }}>
                  <span style={{ color: "#44403c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "85%" }}>{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} style={{ background: "none", border: "none", color: "#a8a29e", cursor: "pointer", padding: "4px" }}>✕</button>
                </li>
              ))}
            </ul>
          )}

          {fileError && <p style={{ fontSize: "0.85rem", color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: "10px", marginTop: "16px", border: "1px solid #fecaca" }}>{fileError}</p>}

          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            <button className="agri-btn-primary" onClick={handleUploadEvidence} disabled={uploading} style={{ flex: 1, padding: "12px" }}>
              {uploading ? "Uploading…" : selectedFiles.length > 0 ? "Upload & Finish" : "Skip & Finish"}
            </button>
            <button className="agri-btn-outline" onClick={skipEvidence} disabled={uploading} style={{ padding: "12px 24px" }}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="agri-page" style={{ display: "flex", justifyContent: "center", paddingTop: "40px" }}>
      <div className="agri-card" style={{ maxWidth: "540px", width: "100%", padding: "32px" }}>
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1c1917", margin: "0 0 4px" }}>File a Complaint</h1>
            <p style={{ fontSize: "0.85rem", color: "#78716c", margin: 0 }}>Report an issue with an agricultural agent</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="agri-field">
            <label className="agri-label" htmlFor="agentId">Select Agent <span style={{ color: "#dc2626" }}>*</span></label>
            <select
              id="agentId"
              value={agentId}
              onChange={(e) => { setAgentId(e.target.value); setFormError(""); }}
              disabled={agentsLoading}
              className="agri-select"
            >
              <option value="">{agentsLoading ? "Loading agents…" : "Choose an agent"}</option>
              {agents.map((a) => (
                <option key={a.userId} value={a.userId}>{a.fullName || a.userId} {a.email ? `(${a.email})` : ""}</option>
              ))}
            </select>
            {agents.length === 0 && !agentsLoading && <p style={{ fontSize: "0.75rem", color: "#a8a29e", marginTop: "4px" }}>No active agents found.</p>}
          </div>

          <div className="agri-field">
            <label className="agri-label" htmlFor="subject">Subject <span style={{ color: "#dc2626" }}>*</span></label>
            <input
              id="subject"
              placeholder="Brief summary of the issue"
              value={subject}
              maxLength={120}
              onChange={(e) => { setSubject(e.target.value); setFormError(""); }}
              style={{ height: "44px", borderRadius: "10px", border: "1.5px solid #e7e5e4", padding: "0 14px", outline: "none", fontSize: "0.9rem", width: "100%", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#16a34a"}
              onBlur={(e) => e.target.style.borderColor = "#e7e5e4"}
            />
          </div>

          <div className="agri-field">
            <label className="agri-label" htmlFor="description">Description <span style={{ color: "#dc2626" }}>*</span></label>
            <textarea
              id="description"
              rows={5}
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFormError(""); }}
              style={{ borderRadius: "10px", border: "1.5px solid #e7e5e4", padding: "14px", outline: "none", fontSize: "0.9rem", width: "100%", resize: "vertical", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "#16a34a"}
              onBlur={(e) => e.target.style.borderColor = "#e7e5e4"}
            />
          </div>

          {formError && <p style={{ fontSize: "0.85rem", color: "#dc2626", background: "#fef2f2", padding: "10px", borderRadius: "10px", border: "1px solid #fecaca" }}>{formError}</p>}

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button type="submit" disabled={submitting} className="agri-btn-primary" style={{ flex: 1, padding: "12px" }}>
              {submitting ? "Submitting…" : "Submit Complaint"}
            </button>
            <Link href="/farmer/complaints" className="agri-btn-outline" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 24px", textDecoration: "none" }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
