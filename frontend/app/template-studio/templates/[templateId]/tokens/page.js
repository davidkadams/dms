"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "../../../../context/UserContext";
import NavShell from "../../../../components/NavShell";

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
      // reload fields if schema changed
      if (editSchemaId !== template.schema_id) {
        const f = await fetch(`${API}/schemas/${editSchemaId}/fields`).then((r) => r.json());
        setFields(f);
        setMappings([]); // old mappings reference old schema fields
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
        <div style={{ width: 480, flexShrink: 0, overflowY: "auto", padding: "24px", borderRight: "1px solid #c8c4be" }}>
          <div style={{ fontSize: 11, color: "#999", marginBottom: 16, cursor: "pointer" }} onClick={() => router.push("/template-studio/templates")}>
            ← Templates
          </div>

          {loading ? <div style={{ fontSize: 12, color: "#999" }}>Loading...</div> : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1020" }}>Edit Template</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Update details, map tokens, then activate.</div>
              </div>

              {/* ── Template Details ── */}
              <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Details</div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Template Name</div>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>Schema</div>
                  <select
                    value={editSchemaId}
                    onChange={(e) => setEditSchemaId(e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit", background: "#fafafa" }}
                  >
                    {allSchemas.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {editSchemaId !== template?.schema_id && (
                    <div style={{ fontSize: 10, color: "#b87800", marginTop: 3 }}>
                      ⚠ Changing schema will clear existing token mappings.
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={handleSaveDetails}
                    disabled={savingDetails || !detailsChanged}
                    style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: detailsChanged ? "#1a1a2e" : "#e0e0e0", color: detailsChanged ? "#fff" : "#aaa", border: "none", borderRadius: 2, cursor: detailsChanged ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                  >
                    {savingDetails ? "Saving..." : "Save Changes"}
                  </button>
                  {detailsSaved && <span style={{ fontSize: 11, color: "#2e7d32" }}>✓ Saved</span>}
                </div>
              </div>

              {/* ── Token Mappings ── */}
              <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, marginBottom: 14 }}>
                <div style={{ background: "#1a1a2e", padding: "5px 10px", display: "flex" }}>
                  {[{ label: "Token", flex: 1.2 }, { label: "→", flex: 0.2 }, { label: "Field", flex: 1.2 }, { label: "Type", flex: 0.7 }, { label: "", flex: 0.3 }].map((col, i) => (
                    <span key={i} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: "#a0a0c0" }}>{col.label}</span>
                  ))}
                </div>
                {mappings.length === 0 && (
                  <div style={{ padding: "12px 10px", fontSize: 11, color: "#bbb" }}>No mappings yet — add at least one below.</div>
                )}
                {mappings.map((m, i) => {
                  const field = fieldMap[m.schema_field_id];
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: "1px solid #f0f0f0", background: i % 2 === 1 ? "#fafafa" : "#fff" }}>
                      <span style={{ flex: 1.2, fontSize: 11, fontFamily: "monospace", color: "#1a1a2e", fontWeight: 600 }}>{"{{"}{m.token}{"}}"}</span>
                      <span style={{ flex: 0.2, fontSize: 11, color: "#bbb" }}>→</span>
                      <span style={{ flex: 1.2, fontSize: 11, color: "#444" }}>{field?.label || "—"}</span>
                      <span style={{ flex: 0.7, fontSize: 11, color: "#888" }}>{field?.field_type || "—"}</span>
                      <div style={{ flex: 0.3, display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          style={{ padding: "2px 7px", fontSize: 11, background: "#fdecea", color: "#c62828", border: "1px solid #ef9a9a", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {deletingId === m.id ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Add Mapping ── */}
              <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, padding: "14px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Add Mapping</div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>Token name</div>
                    <input
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      placeholder="e.g. client_name"
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "monospace" }}
                    />
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>Inside {"{{ }}"} in the doc</div>
                  </div>
                  <div style={{ fontSize: 16, color: "#ccc", paddingTop: 22 }}>→</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>Schema field</div>
                    <select
                      value={newFieldId}
                      onChange={(e) => setNewFieldId(e.target.value)}
                      style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit", background: "#fafafa" }}
                    >
                      <option value="">— select —</option>
                      {availableFields.map((f) => (
                        <option key={f.id} value={f.id}>{f.label} ({f.field_type})</option>
                      ))}
                    </select>
                    {availableFields.length === 0 && fields.length > 0 && (
                      <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>All fields mapped.</div>
                    )}
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, background: adding ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: adding ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 18 }}
                  >
                    {adding ? "..." : "+ Add"}
                  </button>
                </div>
                {addError && <div style={{ fontSize: 11, color: "#c62828", marginTop: 6 }}>{addError}</div>}
              </div>

              {/* ── Activation ── */}
              {template?.status !== "active" && (
                <div style={{ padding: "12px 14px", background: canActivate ? "#fff8e1" : "#f5f5f5", border: `1px solid ${canActivate ? "#f0a500" : "#e0e0e0"}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, color: canActivate ? "#b87800" : "#aaa" }}>
                    {canActivate ? "Mappings look good — activate when ready." : "Add at least one token mapping to activate."}
                  </div>
                  <button
                    onClick={handleActivate}
                    disabled={!canActivate}
                    style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, background: canActivate ? "#1a1a2e" : "#e0e0e0", color: canActivate ? "#fff" : "#aaa", border: "none", borderRadius: 2, cursor: canActivate ? "pointer" : "not-allowed", fontFamily: "inherit" }}
                  >
                    Activate →
                  </button>
                </div>
              )}

              {template?.status === "active" && (
                <div style={{ padding: "12px 14px", background: "#e8f5e9", border: "1px solid #66bb6a", borderRadius: 2, fontSize: 11, color: "#2e7d32" }}>
                  ✓ Template is active and ready to use.
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right Panel: Document Preview ── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fafafa", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #e0ddd9", background: "#f0eeeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6 }}>Document Preview</span>
            <span style={{ fontSize: 10, color: "#bbb" }}>
              <mark style={{ background: "#fff3cd", color: "#1a1a2e", padding: "1px 5px", borderRadius: 2, fontWeight: 600 }}>{"{{tokens}}"}</mark>
              {" "}are highlighted
            </span>
          </div>
          <div style={{ flex: 1, padding: "32px 40px" }}>
            {docLoading && <div style={{ fontSize: 12, color: "#999" }}>Loading document preview...</div>}
            {docError && <div style={{ fontSize: 12, color: "#c62828" }}>{docError}</div>}
            {docHtml && (
              <div
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderRadius: 2, padding: "48px 56px", maxWidth: 700, margin: "0 auto", fontSize: 13, lineHeight: 1.7, color: "#1a1020" }}
                dangerouslySetInnerHTML={{ __html: docHtml }}
              />
            )}
          </div>
        </div>
      </div>
    </NavShell>
  );
}
