"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import NavShell from "../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep, bgRowAlt,
  textPrimary, textBody, textSubtle, textSecondary, textMuted, textLabel, textDim,
  accentTeal, accentBlue, accentGreen, accentRed,
  borderCard, borderInput, colorBorderInput, colorBorderRow,
  btnPrimary, btnDisabled, btnGhost, inputStyle, selectStyle,
} from "../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STEPS = ["Upload", "Review & Confirm", "Extracted"];

function StepIndicator({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? accentGreen : active ? textPrimary : "rgba(255,255,255,0.12)",
                color: done ? "#1a3a1a" : active ? bgPrimary : "rgba(255,255,255,0.4)",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? textPrimary : textLabel, fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 1, background: i < current ? accentGreen : "rgba(255,255,255,0.12)", margin: "0 4px", marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IngestPage() {
  const { user, authHeaders } = useUser();
  const router = useRouter();
  const fileRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [preSelectedSchemaId, setPreSelectedSchemaId] = useState("");

  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedSchemaId, setSelectedSchemaId] = useState("");
  const [selectedSchemaFields, setSelectedSchemaFields] = useState([]);
  const [label, setLabel] = useState("");
  const [schemaLocked, setSchemaLocked] = useState(false);

  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const loadingIntervalRef = useRef(null);

  const [error, setError] = useState("");

  // doc preview
  const [docHtml, setDocHtml] = useState(null);
  const [docPreviewLoading, setDocPreviewLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/schemas/`)
      .then((r) => r.json())
      .then((all) => setSchemas(all.filter((s) => s.created_by === user.id)))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!file) { setDocHtml(null); return; }
    if (!file.name.endsWith(".docx")) { setDocHtml(null); return; }
    setDocPreviewLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result });
        setDocHtml(result.value);
      } catch { setDocHtml(null); }
      setDocPreviewLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  useEffect(() => {
    if (!selectedSchemaId) { setSelectedSchemaFields([]); return; }
    fetch(`${API}/schemas/${selectedSchemaId}/fields`)
      .then((r) => r.json())
      .then(setSelectedSchemaFields)
      .catch(() => setSelectedSchemaFields([]));
  }, [selectedSchemaId]);

  useEffect(() => {
    if (!preSelectedSchemaId) return;
    fetch(`${API}/schemas/${preSelectedSchemaId}/fields`)
      .then((r) => r.json())
      .then(setSelectedSchemaFields)
      .catch(() => {});
  }, [preSelectedSchemaId]);

  if (!user) { router.push("/login"); return null; }

  const handleUpload = async () => {
    if (!file) return;
    setMatching(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      if (preSelectedSchemaId) {
        const res = await fetch(`${API}/ingest/prepare`, { method: "POST", headers: authHeaders(), body: form });
        if (!res.ok) { const e = await res.json(); setError(e.detail || "Failed to read document."); setMatching(false); return; }
        const result = await res.json();
        setMatchResult({ document_text: result.document_text, filename: result.filename, matched_schema_id: preSelectedSchemaId, confidence: 100, reason: "Schema manually selected.", suggested_fields: [] });
        setSelectedSchemaId(preSelectedSchemaId);
        setSchemaLocked(true);
        setLabel(file.name.replace(/\.[^.]+$/, ""));
        setStep(1);
      } else {
        const res = await fetch(`${API}/ingest/match`, { method: "POST", headers: authHeaders(), body: form });
        if (!res.ok) { const e = await res.json(); setError(e.detail || "Failed to analyse document."); setMatching(false); return; }
        const result = await res.json();
        setMatchResult(result);
        setSelectedSchemaId(result.matched_schema_id || "");
        setSchemaLocked(false);
        setLabel(file.name.replace(/\.[^.]+$/, ""));
        setStep(1);
      }
    } catch { setError("Could not reach the server."); }
    setMatching(false);
  };

  const LOADING_STAGES = [
    "Reading document…",
    "Identifying structure…",
    "Locating field values…",
    "Cross-referencing clauses…",
    "Extracting data…",
    "Validating output…",
    "Almost there…",
  ];

  const handleExtract = async () => {
    if (!selectedSchemaId || !label.trim()) return;
    setExtracting(true);
    setLoadingStage(0);
    setError("");

    let stage = 0;
    loadingIntervalRef.current = setInterval(() => {
      stage = Math.min(stage + 1, LOADING_STAGES.length - 1);
      setLoadingStage(stage);
    }, 1800);

    const form = new FormData();
    form.append("schema_id", selectedSchemaId);
    form.append("label", label.trim());
    form.append("document_text", matchResult.document_text);
    try {
      const res = await fetch(`${API}/ingest/extract`, { method: "POST", headers: authHeaders(), body: form });
      clearInterval(loadingIntervalRef.current);
      if (!res.ok) { const e = await res.json(); setError(e.detail || "Extraction failed."); setExtracting(false); return; }
      const result = await res.json();
      setExtractResult(result);
      setStep(2);
    } catch {
      clearInterval(loadingIntervalRef.current);
      setError("Could not reach the server.");
    }
    setExtracting(false);
  };

  const resetAll = () => {
    setStep(0); setFile(null); setMatchResult(null); setExtractResult(null);
    setLabel(""); setError(""); setDocHtml(null);
    setSelectedSchemaId(""); setSelectedSchemaFields([]);
    setPreSelectedSchemaId(""); setSchemaLocked(false);
  };

  const fieldLabelMap = Object.fromEntries(selectedSchemaFields.map((f) => [f.name, f.label]));

  return (
    <NavShell active="Ingest">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: textPrimary, letterSpacing: -0.3 }}>Ingest Document</div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>Upload a document and we'll match it to a schema and extract the data.</div>
        </div>

        <StepIndicator current={step} />

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>

          {/* ── LEFT: step controls ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Step 0 — Upload */}
            {step === 0 && (
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "20px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Upload Document</div>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${file ? accentTeal : "rgba(255,255,255,0.2)"}`, borderRadius: 2,
                    padding: "28px 16px", textAlign: "center", cursor: "pointer",
                    background: file ? "rgba(0,191,179,0.06)" : "rgba(255,255,255,0.03)", marginBottom: 14, transition: "all 0.15s",
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                >
                  <input ref={fileRef} type="file" accept=".docx,.txt,.md" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
                  {file ? (
                    <>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary }}>{file.name}</div>
                      <div style={{ fontSize: 10, color: textMuted, marginTop: 3 }}>{(file.size / 1024).toFixed(1)} KB</div>
                      <div style={{ fontSize: 10, color: accentTeal, marginTop: 6 }}>Click to change</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>↑</div>
                      <div style={{ fontSize: 12, color: textSecondary }}>Drop a file here or click to browse</div>
                      <div style={{ fontSize: 10, color: textLabel, marginTop: 3 }}>Supports .docx, .txt</div>
                    </>
                  )}
                </div>

                <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 6 }}>
                    Already know the schema? <span style={{ fontWeight: 400, color: textLabel }}>(optional)</span>
                  </div>
                  <select
                    value={preSelectedSchemaId}
                    onChange={(e) => setPreSelectedSchemaId(e.target.value)}
                    style={{ ...selectStyle, width: "100%", padding: "6px 10px", fontSize: 12 }}
                  >
                    <option value="">Let the AI decide →</option>
                    {schemas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div style={{ fontSize: 10, color: textLabel, marginTop: 5 }}>
                    {preSelectedSchemaId ? "Skips matching — extracts directly." : "Leave blank to auto-match."}
                  </div>
                </div>

                {error && <div style={{ padding: "10px 12px", background: "#fdecea", border: "1px solid #ef9a9a", borderRadius: 2, fontSize: 11, color: "#c62828", marginBottom: 10 }}>{error}</div>}

                <button onClick={handleUpload} disabled={!file || matching}
                  style={{ ...(!file || matching ? btnDisabled : btnPrimary), width: "100%", padding: "9px", fontSize: 12 }}>
                  {matching ? (preSelectedSchemaId ? "Reading document…" : "Analysing document…") : (preSelectedSchemaId ? "Continue →" : "Analyse Document →")}
                </button>
              </div>
            )}

            {/* Step 1 — Review & Confirm */}
            {step === 1 && matchResult && (
              <>
                {!schemaLocked ? (
                  matchResult.matched_schema_id ? (
                    <div style={{ padding: "12px 14px", background: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32", marginBottom: 3 }}>Schema match — {matchResult.confidence}% confidence</div>
                      <div style={{ fontSize: 11, color: "#4caf50" }}>{matchResult.reason}</div>
                    </div>
                  ) : (
                    <div style={{ padding: "12px 14px", background: "#fff3e0", border: "1px solid #f0a500", borderRadius: 2 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#b87800", marginBottom: 3 }}>No matching schema found</div>
                      <div style={{ fontSize: 11, color: "#b87800", marginBottom: matchResult.suggested_fields?.length ? 8 : 0 }}>{matchResult.reason}</div>
                      {matchResult.suggested_fields?.length > 0 && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#b87800", marginBottom: 5 }}>Suggested fields:</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                            {matchResult.suggested_fields.map((f) => (
                              <span key={f.name} style={{ padding: "2px 7px", background: "#fff8e1", border: "1px solid #f0a500", borderRadius: 2, fontSize: 10, color: "#7a5500" }}>
                                {f.label} <span style={{ opacity: 0.6 }}>({f.field_type})</span>
                              </span>
                            ))}
                          </div>
                          <span style={{ fontSize: 10, color: "#b87800", cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/schema-builder/new")}>
                            Create a schema for this document type →
                          </span>
                        </>
                      )}
                    </div>
                  )
                ) : (
                  <div style={{ padding: "12px 14px", background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1565c0", marginBottom: 3 }}>Schema pre-selected</div>
                    <div style={{ fontSize: 11, color: "#5b9bd5" }}>Skipped automatic matching — extracting directly into the selected schema.</div>
                  </div>
                )}

                <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Confirm Settings</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>Entry label</div>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Acme Corp — Contract 2026"
                      style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>Schema</div>
                    {schemaLocked ? (
                      <div style={{ padding: "7px 10px", fontSize: 12, border: borderInput, borderRadius: 2, background: "rgba(255,255,255,0.05)", color: textBody }}>
                        {schemas.find((s) => s.id === selectedSchemaId)?.name || "Selected schema"}
                        <span style={{ fontSize: 10, color: textLabel, marginLeft: 6 }}>
                          (<span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setSchemaLocked(false); setSelectedSchemaId(""); }}>change</span>)
                        </span>
                      </div>
                    ) : (
                      <>
                        <select value={selectedSchemaId} onChange={(e) => setSelectedSchemaId(e.target.value)}
                          style={{ ...selectStyle, width: "100%", padding: "7px 10px", fontSize: 12 }}>
                          <option value="">Select a schema…</option>
                          {schemas.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}{s.id === matchResult.matched_schema_id ? ` — ${matchResult.confidence}% match` : ""}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: 10, color: textLabel, marginTop: 4 }}>
                          No schema?{" "}
                          <span style={{ color: accentBlue, cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/schema-builder/new")}>Create one →</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {error && <div style={{ padding: "10px 12px", background: "#fdecea", border: "1px solid #ef9a9a", borderRadius: 2, fontSize: 11, color: "#c62828" }}>{error}</div>}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setStep(0); setMatchResult(null); setFile(null); setError(""); setSchemaLocked(false); }}
                    disabled={extracting}
                    style={{ ...btnGhost, padding: "8px 14px", fontSize: 12, opacity: extracting ? 0.4 : 1 }}>
                    ← Back
                  </button>
                  <button onClick={handleExtract} disabled={!selectedSchemaId || !label.trim() || extracting}
                    style={{ ...(!selectedSchemaId || !label.trim() || extracting ? btnDisabled : btnPrimary), flex: 1, padding: "8px", fontSize: 12 }}>
                    {extracting ? LOADING_STAGES[loadingStage] : "Extract & Add to Queue →"}
                  </button>
                </div>

                {/* Loading bar */}
                {extracting && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        background: `linear-gradient(90deg, ${bgPrimary}, ${accentTeal}, ${bgPrimary})`,
                        backgroundSize: "200% 100%",
                        borderRadius: 2,
                        animation: "shimmer 1.4s infinite linear",
                        width: `${Math.round(((loadingStage + 1) / LOADING_STAGES.length) * 85) + 5}%`,
                        transition: "width 1.6s ease",
                      }} />
                    </div>
                    <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
                    <div style={{ fontSize: 10, color: textLabel, marginTop: 4, textAlign: "center" }}>
                      Analysing your document…
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2 — Success */}
            {step === 2 && extractResult && (
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "20px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(129,199,132,0.15)", border: `1px solid ${accentGreen}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, color: accentGreen }}>✓</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: accentGreen }}>Extraction complete</div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                      {extractResult.fields_found} of {extractResult.fields_total} fields found — entry added to queue for review.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => router.push(`/queue/${extractResult.data_instance_id}`)}
                    style={{ ...btnPrimary, width: "100%", padding: "9px", fontSize: 12 }}>
                    Review & Validate in Queue →
                  </button>
                  <button onClick={resetAll}
                    style={{ ...btnGhost, width: "100%", padding: "8px", fontSize: 12 }}>
                    Ingest Another Document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: doc preview + fields/extraction panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Document preview */}
            <div style={{ background: bgCard, border: borderCard, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ background: bgDeep, padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>Document Preview</span>
                {file && <span style={{ fontSize: 10, color: textMuted }}>{file.name}</span>}
              </div>
              <div style={{ padding: "16px", maxHeight: 380, overflowY: "auto" }}>
                {!file && <div style={{ fontSize: 12, color: textDim, textAlign: "center", padding: "32px 0" }}>No document uploaded yet.</div>}
                {file && docPreviewLoading && <div style={{ fontSize: 12, color: textMuted, textAlign: "center", padding: "32px 0" }}>Loading preview…</div>}
                {file && !docPreviewLoading && !docHtml && <div style={{ fontSize: 12, color: textDim, textAlign: "center", padding: "32px 0" }}>Preview unavailable.</div>}
                {docHtml && <div style={{ fontSize: 11, lineHeight: 1.7, color: textBody }} dangerouslySetInnerHTML={{ __html: docHtml }} />}
              </div>
            </div>

            {/* Bottom-right panel */}
            <div style={{ background: bgCard, border: borderCard, borderRadius: 2, overflow: "hidden" }}>

              {/* ── Extracted values (step 2) ── */}
              {step === 2 && extractResult ? (
                <>
                  <div style={{ background: bgDeep, padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>Extracted Values</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#4caf50" }}>
                      {extractResult.fields_found} / {extractResult.fields_total} found
                    </span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    <div style={{ display: "flex", gap: 8, padding: "5px 14px", background: bgDeep, borderBottom: `1px solid ${colorBorderRow}` }}>
                      <span style={{ flex: 1.2, fontSize: 10, fontWeight: 600, color: textLabel, textTransform: "uppercase" }}>Field</span>
                      <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: textLabel, textTransform: "uppercase" }}>Extracted Value</span>
                      <span style={{ width: 24 }} />
                    </div>
                    {Object.entries(extractResult.extracted_values || {}).map(([name, value], i) => {
                      const found = value !== null && value !== undefined && value !== "";
                      return (
                        <div key={name} style={{ display: "flex", gap: 8, padding: "8px 14px", alignItems: "center", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard }}>
                          <div style={{ flex: 1.2 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: textBody }}>{fieldLabelMap[name] || name}</div>
                            <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{name}</div>
                          </div>
                          <div style={{ flex: 2 }}>
                            {found
                              ? <span style={{ fontSize: 12, color: textPrimary, fontWeight: 500 }}>{String(value)}</span>
                              : <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>not found</span>
                            }
                          </div>
                          <div style={{ width: 24, textAlign: "right" }}>
                            <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 5px", borderRadius: 2, background: found ? "#e8f5e9" : "#fafafa", color: found ? "#2e7d32" : "#bbb", border: `1px solid ${found ? "#66bb6a" : "#e0e0e0"}` }}>
                              {found ? "✓" : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* ── Schema fields preview (steps 0 & 1) ── */
                <>
                  <div style={{ background: bgDeep, padding: "6px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>
                      Fields to Extract
                      {selectedSchemaFields.length > 0 && <span style={{ color: textLabel, fontWeight: 400 }}> — {selectedSchemaFields.length} fields</span>}
                    </span>
                  </div>

                  {!selectedSchemaId && (
                    <div style={{ padding: "20px 14px", fontSize: 12, color: textDim, textAlign: "center" }}>
                      Select a schema to preview which fields will be extracted.
                    </div>
                  )}

                  {selectedSchemaFields.length > 0 && (
                    <>
                      <div style={{ padding: "8px 14px", background: "rgba(144,202,249,0.08)", borderBottom: "1px solid rgba(144,202,249,0.15)" }}>
                        <span style={{ fontSize: 10, color: accentBlue }}>
                          Adding a <strong>description</strong> or <strong>extraction hint</strong> to each field improves accuracy on niche documents.
                        </span>
                      </div>
                      <div style={{ maxHeight: 280, overflowY: "auto" }}>
                        <div style={{ display: "flex", gap: 8, padding: "5px 14px", background: bgDeep, borderBottom: `1px solid ${colorBorderRow}` }}>
                          <span style={{ flex: 1.2, fontSize: 10, fontWeight: 600, color: textLabel, textTransform: "uppercase" }}>Field</span>
                          <span style={{ flex: 0.7, fontSize: 10, fontWeight: 600, color: textLabel, textTransform: "uppercase" }}>Type</span>
                          <span style={{ flex: 2, fontSize: 10, fontWeight: 600, color: textLabel, textTransform: "uppercase" }}>Description / Hint</span>
                        </div>
                        {selectedSchemaFields.map((f, i) => (
                          <div key={f.id} style={{ display: "flex", gap: 8, padding: "8px 14px", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard }}>
                            <div style={{ flex: 1.2 }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: textPrimary }}>{f.label}</div>
                              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{f.name}</div>
                            </div>
                            <div style={{ flex: 0.7 }}>
                              <span style={{ fontSize: 10, color: textSecondary, background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 2 }}>{f.field_type}</span>
                              {f.required && <span style={{ fontSize: 9, color: accentRed, marginLeft: 4 }}>*</span>}
                            </div>
                            <div style={{ flex: 2 }}>
                              {f.description && <div style={{ fontSize: 10, color: textSecondary, lineHeight: 1.4 }}>{f.description}</div>}
                              {f.extraction_hint && <div style={{ fontSize: 10, color: accentBlue, marginTop: f.description ? 3 : 0, lineHeight: 1.4 }}>Hint: {f.extraction_hint}</div>}
                              {!f.description && !f.extraction_hint && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>—</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavShell>
  );
}
