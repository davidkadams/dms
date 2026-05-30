"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep, bgRowAlt,
  textPrimary, textBody, textSecondary, textMuted, textLabel, textDim,
  accentBlue, accentRed,
  borderCard, colorBorderInput, colorBorderRow,
  btnPrimary, btnDisabled, btnGhost, selectStyle,
} from "../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_MAP = {
  pending:            { label: "Pending",      bg: "#fff3e0", color: "#b87800", border: "#f0a500" },
  pending_validation: { label: "Needs Review", bg: "#ede7f6", color: "#5e35b1", border: "#9575cd" },
  validated:          { label: "Validated",    bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  processed:          { label: "Processed",    bg: "#e8f5e9", color: "#2e7d32", border: "#66bb6a" },
  failed:             { label: "Failed",       bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{ display: "inline-block", padding: "3px 9px", fontSize: 11, fontWeight: 600, borderRadius: 2, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: `1px solid ${colorBorderRow}` }}>
      <span style={{ width: 130, fontSize: 11, color: textLabel, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: textPrimary }}>{value}</span>
    </div>
  );
}

export default function DataInstanceDetailPage() {
  const { user, authHeaders } = useUser();
  const router = useRouter();
  const { instanceId } = useParams();

  const [instance, setInstance] = useState(null);
  const [schema, setSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);

  // generation state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/data-instances/${instanceId}`).then((r) => r.json()),
    ]).then(async ([inst]) => {
      setInstance(inst);
      setUsers({ [user.id]: user.name });
      const [sc, f, tmpl] = await Promise.all([
        fetch(`${API}/schemas/${inst.schema_id}`).then((r) => r.json()),
        fetch(`${API}/schemas/${inst.schema_id}/fields`).then((r) => r.json()),
        fetch(`${API}/templates/?schema_id=${inst.schema_id}`).then((r) => r.json()),
      ]);
      setSchema(sc);
      setFields(f);
      const activeTemplates = tmpl.filter((t) => t.status === "active");
      setTemplates(activeTemplates);
      const defaultTmpl = activeTemplates.find((t) => t.is_default);
      if (defaultTmpl) setSelectedTemplate(defaultTmpl.id);
      else if (activeTemplates.length === 1) setSelectedTemplate(activeTemplates[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router, instanceId]);

  const handleValidate = async () => {
    setValidating(true);
    const res = await fetch(`${API}/data-instances/${instanceId}/validate`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    const updated = await res.json();
    setInstance(updated);
    setValidating(false);
    setConfirmValidate(false);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setGenerateError("");
    setGeneratedDoc(null);
    try {
      const res = await fetch(`${API}/documents/generate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ template_id: selectedTemplate, data_instance_id: instanceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setGenerateError(Array.isArray(err.detail) ? err.detail.map((e) => e.msg).join(", ") : (err.detail || "Generation failed."));
        setGenerating(false);
        return;
      }
      const doc = await res.json();
      setGeneratedDoc({ ...doc, download_url: `${API}/documents/${doc.id}/download` });
      setInstance((prev) => ({ ...prev, status: "processed" }));
    } catch {
      setGenerateError("Could not reach the server.");
    }
    setGenerating(false);
  };

  const fieldMap = Object.fromEntries(fields.map((f) => [f.id, f]));
  const canValidate = instance && !["validated", "processed"].includes(instance.status);
  const isSelfValidating = instance && user && instance.created_by === user.id;

  if (!user) return null;

  return (
    <NavShell active="Queue">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 720 }}>
        <div
          style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push("/queue")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
        >
          ← Queue
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: textMuted }}>Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 500, color: textPrimary, marginBottom: 6 }}>{instance.label}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusBadge status={instance.status} />
                  <span style={{ fontSize: 11, color: textLabel }}>
                    {instance.source === "manual" ? "Manual entry" : "Extracted"}
                  </span>
                </div>
              </div>

              {canValidate && !confirmValidate && (
                <button
                  onClick={() => setConfirmValidate(true)}
                  style={{ ...btnPrimary, padding: "8px 18px", fontSize: 12 }}
                >
                  ✓ Validate Entry
                </button>
              )}
            </div>

            {/* Validation confirmation */}
            {confirmValidate && (
              <div style={{ marginBottom: 20, padding: "14px 16px", background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 2 }}>
                <div style={{ fontSize: 12, color: "#1565c0", marginBottom: 10, fontWeight: 500 }}>
                  Confirm validation — this marks the data as reviewed and correct.
                </div>
                <div style={{ fontSize: 11, color: "#1565c0", marginBottom: 12 }}>
                  Signing off as <strong>{user.name}</strong>
                  {isSelfValidating && <span style={{ marginLeft: 6, opacity: 0.7 }}>(self-validating)</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleValidate}
                    disabled={validating}
                    style={{ ...(validating ? btnDisabled : btnPrimary), padding: "6px 16px", fontSize: 12 }}
                  >
                    {validating ? "Validating..." : "Confirm →"}
                  </button>
                  <button
                    onClick={() => setConfirmValidate(false)}
                    style={{ ...btnGhost, padding: "6px 14px", fontSize: 12 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Validated banner */}
            {instance.status === "validated" && (
              <div style={{ marginBottom: 20, padding: "12px 16px", background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 2, display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1565c0" }}>Validated by {users[instance.validated_by] || "unknown"}</div>
                  <div style={{ fontSize: 11, color: "#5b9bd5", marginTop: 1 }}>
                    {new Date(instance.validated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </div>
            )}

            {/* Processed banner */}
            {instance.status === "processed" && (
              <div style={{ marginBottom: 20, padding: "12px 16px", background: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: 2, display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32" }}>Document generated — entry marked as processed.</div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

              {/* Instance metadata */}
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Details</div>
                <MetaRow label="Schema" value={schema?.name || "—"} />
                <MetaRow label="Created by" value={users[instance.created_by] || "—"} />
                <MetaRow label="Created at" value={new Date(instance.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
                <MetaRow label="Source" value={instance.source === "manual" ? "Manual entry" : "Extracted"} />
                <MetaRow label="Fields filled" value={`${instance.field_values?.length || 0} of ${fields.length}`} />
                <div style={{ display: "flex", gap: 8, padding: "7px 0" }}>
                  <span style={{ width: 130, fontSize: 11, color: textLabel, flexShrink: 0 }}>Instance ID</span>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: textDim }}>{instance.id}</span>
                </div>
              </div>

              {/* Validation info */}
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Validation</div>
                <MetaRow label="Status" value={<StatusBadge status={instance.status} />} />
                <MetaRow label="Validated by" value={instance.validated_by ? users[instance.validated_by] || "—" : "Not yet validated"} />
                <MetaRow label="Validated at" value={instance.validated_at ? new Date(instance.validated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"} />
              </div>
            </div>

            {/* Generate Document — only shown once validated or processed */}
            {(instance.status === "validated" || instance.status === "processed") && (
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "16px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Generate Document</div>

                {templates.length === 0 ? (
                  <div style={{ fontSize: 12, color: textMuted }}>
                    No active templates for this schema.{" "}
                    <span
                      style={{ color: accentBlue, cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => router.push("/template-studio/templates")}
                    >
                      Go to Template Studio →
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        disabled={instance.status === "processed" && !!generatedDoc}
                        style={{ ...selectStyle, flex: 1, padding: "7px 10px", fontSize: 12 }}
                      >
                        <option value="">Select a template…</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}{t.is_default ? "  (default)" : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleGenerate}
                        disabled={!selectedTemplate || generating}
                        style={{ ...(!selectedTemplate || generating ? btnDisabled : btnPrimary), padding: "7px 18px", fontSize: 12, whiteSpace: "nowrap" }}
                      >
                        {generating ? "Generating…" : "Generate →"}
                      </button>
                    </div>

                    {generateError && (
                      <div style={{ fontSize: 11, color: "#c62828", marginBottom: 10 }}>{generateError}</div>
                    )}

                    {generatedDoc?.download_url && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: 2 }}>
                        <span style={{ fontSize: 18 }}>✓</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#2e7d32" }}>Document ready</div>
                          <div style={{ fontSize: 11, color: "#4caf50", marginTop: 1 }}>Generated successfully</div>
                        </div>
                        <a
                          href={generatedDoc.download_url}
                          download
                          style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, background: "#2e7d32", color: "#fff", borderRadius: 2, textDecoration: "none" }}
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Field values */}
            <div style={{ background: bgCard, border: borderCard, borderRadius: 2 }}>
              <div style={{ background: bgDeep, padding: "6px 14px", display: "flex", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>Field</span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>Value</span>
                <span style={{ width: 60, fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>Type</span>
              </div>

              {instance.field_values?.length === 0 && (
                <div style={{ padding: "16px 14px", fontSize: 12, color: textLabel }}>No field values recorded.</div>
              )}

              {instance.field_values?.map((fv, i) => {
                const field = fieldMap[fv.schema_field_id];
                return (
                  <div key={fv.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "9px 14px", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: textBody }}>{field?.label || <span style={{ fontFamily: "monospace", fontSize: 10, color: textDim }}>{fv.schema_field_id}</span>}</span>
                    <span style={{ flex: 1, fontSize: 12, color: textPrimary }}>{fv.value}</span>
                    <span style={{ width: 60, fontSize: 10, color: textLabel }}>{field?.field_type || "—"}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        </div>
      </div>
    </NavShell>
  );
}
