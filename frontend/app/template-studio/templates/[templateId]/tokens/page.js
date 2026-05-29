"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "../../../../context/UserContext";
import NavShell from "../../../../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep, bgRowAlt,
  textPrimary, textSecondary, textMuted, textLabel, textDim,
  accentTeal, accentGreen, accentOrange, accentRed,
  borderCard, colorBorderRow,
  btnPrimary, btnDisabled, inputStyle, selectStyle,
} from "../../../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function highlightTokens(html) {
  return html.replace(/\{\{([^}]+)\}\}/g, (_, token) =>
    `<mark style="background:#fff3cd;color:#1a1a2e;padding:1px 3px;border-radius:2px;font-weight:600;">{{${token}}}</mark>`
  );
}

export default function EditTemplatePage() {
  const { user } = useUser();
  const router = useRouter();
  const { templateId } = useParams();

  const [template, setTemplate] = useState(null);
  const [allSchemas, setAllSchemas] = useState([]);
  const [fields, setFields] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  // doc preview
  const [docHtml, setDocHtml] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);

  // details editing
  const [editName, setEditName] = useState("");
  const [editSchemaId, setEditSchemaId] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // token mapping
  const [newToken, setNewToken] = useState("");
  const [newFieldId, setNewFieldId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/templates/${templateId}`).then((r) => r.json()),
      fetch(`${API}/templates/${templateId}/token-mappings`).then((r) => r.json()),
      fetch(`${API}/schemas/`).then((r) => r.json()),
    ]).then(([tmpl, maps, schemas]) => {
      setTemplate(tmpl);
      setMappings(maps);
      setEditName(tmpl.name);
      setEditSchemaId(tmpl.schema_id);
      setAllSchemas(schemas.filter((s) => s.created_by === user.id));
      loadDocPreview(tmpl);
      return fetch(`${API}/schemas/${tmpl.schema_id}/fields`).then((r) => r.json());
    }).then((f) => {
      setFields(f);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router, templateId]);

  const loadDocPreview = async (tmpl) => {
    setDocLoading(true);
    setDocError(null);
    try {
      const fileRes = await fetch(`${API}/templates/${tmpl.id}/file`);
      if (!fileRes.ok) throw new Error();
      const arrayBuffer = await fileRes.arrayBuffer();
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setDocHtml(highlightTokens(result.value));
    } catch {
      setDocError("Could not load document preview.");
    } finally {
      setDocLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    setDetailsSaved(false);
    try {
      const res = await fetch(`${API}/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), schema_id: editSchemaId }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTemplate(updated);
      if (editSchemaId !== template.schema_id) {
        const f = await fetch(`${API}/schemas/${editSchemaId}/fields`).then((r) => r.json());
        setFields(f);
        setMappings([]);
      }
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
    } finally {
      setSavingDetails(false);
    }
  };

  const detailsChanged = editName.trim() !== template?.name || editSchemaId !== template?.schema_id;

  const handleAdd = async () => {
    if (!newToken.trim()) { setAddError("Token name is required."); return; }
    if (!newFieldId) { setAddError("Please select a field."); return; }
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`${API}/templates/${templateId}/token-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ token: newToken.trim(), schema_field_id: newFieldId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to add mapping");
      }
      const mapping = await res.json();
      setMappings([...mappings, mapping]);
      setNewToken("");
      setNewFieldId("");
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (mappingId) => {
    setDeletingId(mappingId);
    await fetch(`${API}/templates/${templateId}/token-mappings/${mappingId}`, { method: "DELETE" });
    setMappings((prev) => prev.filter((m) => m.id !== mappingId));
    setDeletingId(null);
  };

  const handleActivate = async () => {
    await fetch(`${API}/templates/${templateId}/activate`, { method: "PATCH" });
    setTemplate({ ...template, status: "active" });
  };

  const mappedFieldIds = new Set(mappings.map((m) => m.schema_field_id));
  const availableFields = fields.filter((f) => !mappedFieldIds.has(f.id));
  const fieldMap = Object.fromEntries(fields.map((f) => [f.id, f]));
  const canActivate = mappings.length > 0;

  if (!user) return null;

  return (
    <NavShell active="Template Studio">
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 72px)" }}>

        {/* ── Left Panel ── */}
        <div style={{ width: 480, flexShrink: 0, overflowY: "auto", padding: "24px", borderRight: borderCard, background: bgPrimary }}>
          <div
            style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
            onClick={() => router.push("/template-studio/templates")}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
          >
            ← Templates
          </div>

          {loading ? <div style={{ fontSize: 12, color: textMuted }}>Loading...</div> : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: textPrimary }}>Edit Template</div>
                <div style={{ fontSize: 11, color: textLabel, marginTop: 2 }}>Update details, map tokens, then activate.</div>
              </div>

              {/* ── Template Details ── */}
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Details</div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>Template Name</div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ ...inputStyle, width: "100%", padding: "6px 8px", fontSize: 12 }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 3 }}>Schema</div>
                  <select
                    value={editSchemaId}
                    onChange={(e) => setEditSchemaId(e.target.value)}
                    style={{ ...selectStyle, width: "100%", padding: "6px 8px", fontSize: 12 }}
                  >
                    {allSchemas.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {editSchemaId !== template?.schema_id && (
                    <div style={{ fontSize: 10, color: accentOrange, marginTop: 3 }}>
                      ⚠ Changing schema will clear existing token mappings.
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={handleSaveDetails}
                    disabled={savingDetails || !detailsChanged}
                    style={{ ...(detailsChanged ? btnPrimary : btnDisabled), padding: "5px 14px", fontSize: 11 }}
                  >
                    {savingDetails ? "Saving..." : "Save Changes"}
                  </button>
                  {detailsSaved && <span style={{ fontSize: 11, color: accentGreen }}>✓ Saved</span>}
                </div>
              </div>

              {/* ── Token Mappings ── */}
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, marginBottom: 14 }}>
                <div style={{ background: bgDeep, padding: "5px 10px", display: "flex" }}>
                  {[{ label: "Token", flex: 1.2 }, { label: "→", flex: 0.2 }, { label: "Field", flex: 1.2 }, { label: "Type", flex: 0.7 }, { label: "", flex: 0.3 }].map((col, i) => (
                    <span key={i} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>{col.label}</span>
                  ))}
                </div>
                {mappings.length === 0 && (
                  <div style={{ padding: "12px 10px", fontSize: 11, color: textDim }}>No mappings yet — add at least one below.</div>
                )}
                {mappings.map((m, i) => {
                  const field = fieldMap[m.schema_field_id];
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard }}>
                      <span style={{ flex: 1.2, fontSize: 11, fontFamily: "monospace", color: accentTeal, fontWeight: 600 }}>{"{{"}{m.token}{"}}"}</span>
                      <span style={{ flex: 0.2, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>→</span>
                      <span style={{ flex: 1.2, fontSize: 11, color: textSecondary }}>{field?.label || "—"}</span>
                      <span style={{ flex: 0.7, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{field?.field_type || "—"}</span>
                      <div style={{ flex: 0.3, display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          style={{ padding: "2px 7px", fontSize: 11, background: "rgba(239,154,154,0.12)", color: accentRed, border: "1px solid rgba(239,154,154,0.25)", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {deletingId === m.id ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Add Mapping ── */}
              <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Add Mapping</div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: textLabel, marginBottom: 3 }}>Token name</div>
                    <input
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      placeholder="e.g. client_name"
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      style={{ ...inputStyle, width: "100%", padding: "6px 8px", fontSize: 12, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Inside {"{{ }}"} in the doc</div>
                  </div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.2)", paddingTop: 22 }}>→</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: textLabel, marginBottom: 3 }}>Schema field</div>
                    <select
                      value={newFieldId}
                      onChange={(e) => setNewFieldId(e.target.value)}
                      style={{ ...selectStyle, width: "100%", padding: "6px 8px", fontSize: 12 }}
                    >
                      <option value="">— select —</option>
                      {availableFields.map((f) => (
                        <option key={f.id} value={f.id}>{f.label} ({f.field_type})</option>
                      ))}
                    </select>
                    {availableFields.length === 0 && fields.length > 0 && (
                      <div style={{ fontSize: 10, color: textLabel, marginTop: 2 }}>All fields mapped.</div>
                    )}
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    style={{ ...(adding ? btnDisabled : btnPrimary), padding: "6px 14px", fontSize: 12, marginTop: 18 }}
                  >
                    {adding ? "..." : "+ Add"}
                  </button>
                </div>
                {addError && <div style={{ fontSize: 11, color: accentRed, marginTop: 6 }}>{addError}</div>}
              </div>

              {/* ── Activation ── */}
              {template?.status !== "active" && (
                <div style={{ padding: "12px 14px", background: canActivate ? "rgba(255,204,128,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${canActivate ? "rgba(255,204,128,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: canActivate ? accentOrange : textLabel }}>
                    {canActivate ? "Mappings look good — activate when ready." : "Add at least one token mapping to activate."}
                  </div>
                  <button
                    onClick={handleActivate}
                    disabled={!canActivate}
                    style={{ ...(canActivate ? btnPrimary : btnDisabled), padding: "4px 12px", fontSize: 11 }}
                  >
                    Activate →
                  </button>
                </div>
              )}

              {template?.status === "active" && (
                <div style={{ padding: "12px 14px", background: "rgba(129,199,132,0.1)", border: "1px solid rgba(129,199,132,0.3)", borderRadius: 2, fontSize: 11, color: accentGreen }}>
                  ✓ Template is active and ready to use.
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Panel: Document Preview ── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#13132a", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 20px", borderBottom: borderCard, background: bgDeep, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.6 }}>Document Preview</span>
            <span style={{ fontSize: 10, color: textDim }}>
              <mark style={{ background: "#fff3cd", color: "#1a1a2e", padding: "1px 5px", borderRadius: 2, fontWeight: 600 }}>{"{{tokens}}"}</mark>
              {" "}are highlighted
            </span>
          </div>
          <div style={{ flex: 1, padding: "32px 40px" }}>
            {docLoading && <div style={{ fontSize: 12, color: textMuted }}>Loading document preview...</div>}
            {docError && <div style={{ fontSize: 12, color: accentRed }}>{docError}</div>}
            {docHtml && (
              <div
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.4)", borderRadius: 2, padding: "48px 56px", maxWidth: 700, margin: "0 auto", fontSize: 13, lineHeight: 1.7, color: "#1a1020" }}
                dangerouslySetInnerHTML={{ __html: docHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </NavShell>
  );
}
