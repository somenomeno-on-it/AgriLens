"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  // ---- agent list ----
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // ---- form state ----
  const [agentId, setAgentId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- created complaint id (used for evidence upload) ----
  const [complaintId, setComplaintId] = useState<string | null>(null);

  // ---- evidence upload ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // ---- wizard step ----
  const [step, setStep] = useState<Step>("form");

  useEffect(() => {
    fetchAllAgents()
      .then(setAgents)
      .finally(() => setAgentsLoading(false));
  }, []);

  // ---- form submit ----
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

  // ---- file picker ----
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

  // ---- evidence upload ----
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

  // =========================================================
  // RENDER
  // =========================================================

  if (step === "done") {
    return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col items-center">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          {/* success icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-800">Complaint Submitted</h1>
          <p className="text-sm text-zinc-500">
            Your complaint has been filed and is now under review.
            {uploadedUrls.length > 0 && ` ${uploadedUrls.length} evidence file(s) attached.`}
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/farmer/complaints">View My Complaints</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/farmer">Back to Dashboard</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "evidence") {
    return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col items-center">
        <Card className="max-w-lg w-full p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">Attach Evidence</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Optionally attach up to {MAX_FILES} files (images or PDFs, max 10 MB each).
            </p>
          </div>

          {/* drop zone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl p-6 text-center hover:bg-zinc-50 transition-colors"
          >
            <svg className="mx-auto w-10 h-10 text-zinc-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium">Click to choose files</p>
            <p className="text-xs text-zinc-400 mt-1">JPEG, PNG, WebP, PDF · max 10 MB · up to 3 files</p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* selected files list */}
          {selectedFiles.length > 0 && (
            <ul className="space-y-2">
              {selectedFiles.map((f, i) => (
                <li key={i} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2 text-sm border">
                  <span className="truncate max-w-[80%] text-zinc-700">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-zinc-400 hover:text-red-500 transition-colors ml-2 shrink-0"
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {fileError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{fileError}</p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUploadEvidence}
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Uploading…" : selectedFiles.length > 0 ? "Upload & Finish" : "Skip & Finish"}
            </Button>
            <Button variant="outline" onClick={skipEvidence} disabled={uploading}>
              Skip
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- step === "form" ----
  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col items-center">
      <Card className="max-w-lg w-full p-8 space-y-6">
        {/* header */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">File a Complaint</h1>
            <p className="text-xs text-zinc-500">Report an issue with an agricultural agent</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* agent selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700" htmlFor="agentId">
              Select Agent <span className="text-red-500">*</span>
            </label>
            <select
              id="agentId"
              value={agentId}
              onChange={(e) => { setAgentId(e.target.value); setFormError(""); }}
              disabled={agentsLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {agentsLoading ? "Loading agents…" : "Choose an agent"}
              </option>
              {agents.map((a) => (
                <option key={a.userId} value={a.userId}>
                  {a.fullName || a.userId}
                  {a.email ? ` (${a.email})` : ""}
                </option>
              ))}
            </select>
            {agents.length === 0 && !agentsLoading && (
              <p className="text-xs text-zinc-400">No active agents found.</p>
            )}
          </div>

          {/* subject */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700" htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </label>
            <Input
              id="subject"
              placeholder="Brief summary of the issue"
              value={subject}
              maxLength={120}
              onChange={(e) => { setSubject(e.target.value); setFormError(""); }}
            />
          </div>

          {/* description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-zinc-700" htmlFor="description">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setFormError(""); }}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Submitting…" : "Submit Complaint"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/farmer/complaints">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
