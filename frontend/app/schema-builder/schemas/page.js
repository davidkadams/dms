"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FIELD_TYPES = ["string", "number", "date"];

function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span style={{
      display: "inline-block", padding: "2px 6px", fontSize: 10, fontWeight: 600, borderRadius: 2,
      background: isActive ? "#e8f5e9" : "#fff3e0",
      color: isActive ? "#2e7d32" : "#b87800",
      border: `1px solid ${isActive ? "#66bb6a" : "#f0a500"}`,
    }}>
      {isActive ? "Active" : "Draft"}
    </span>
  );
}

function FieldRow({ field, schemaId, onSaved, onDeleted }) {
  const { user } = useUser();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [label, setLabel] = useState(field.label);
  const [fieldType, setFieldType] = useState(field.field_type);
  const [required, setRequired] = useState(field.required);
  const [description, setDescription] = useState(field.description || "");
  const [hint, setHint] = useState(field.extraction_hint || "");

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`${API}/schemas/${schemaId}/fields/${field.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({
        label: label.trim() || undefined,
        field_type: fieldType,
        required,
        description: description.trim() || null,
        extraction_hint: hint.trim() || null,
      }),
    });
    if (res.ok) { const updated = await res.json(); onSaved(updated); setEditing(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`${API}/schemas/${schemaId}/fields/${field.id}`, {
      method: "DELETE",
      headers: { "x-user-id": user.id },
    });
    onDeleted(field.id);
  };

  if (editing) {
    return (
      <div style={{ padding: "10px 14px", background: "#f8f8ff", borderBottom: "1px solid #e8e4ff" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>Label</div>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
          </div>
          <div style={{ flex: 0.6 }}>
            <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>Type</div>
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}
              style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit", background: "#fff" }}>
              {FIELD_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              required
            </label>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>
            Description <span style={{ color: "#bbb" }}>(helps LLM extraction)</span>
          </div>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this field mean in context?"
            style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>
            Extraction hint <span style={{ color: "#bbb" }}>(where to look in the document)</span>
          </div>
          <input value={hint} onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. Usually in the Fees section or Schedule 2"
            style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, background: saving ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: saving ? "default" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditing(false)}
            style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, padding: "7px 14px", borderBottom: "1px solid #f5f5f5", alignItems: "flex-start" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "#1a1020" }}>{field.label}</span>
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "#bbb" }}>{field.name}</span>
        </div>
        {(field.description || field.extraction_hint) && (
          <div style={{ marginTop: 2 }}>
            {field.description && <div style={{ fontSize: 10, color: "#777" }}>{field.description}</div>}
            {field.extraction_hint && <div style={{ fontSize: 10, color: "#1565c0" }}>Hint: {field.extraction_hint}</div>}
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: "#888", background: "#f0eeeb", padding: "1px 5px", borderRadius: 2, whiteSpace: "nowrap", marginTop: 1 }}>{field.field_type}</span>
      <span style={{ fontSize: 10, color: field.required ? "#2e7d32" : "#bbb", whiteSpace: "nowrap", marginTop: 1 }}>{field.required ? "req" : "opt"}</span>
      <div style={{ display: "flex", gap: 4, marginTop: 0, flexShrink: 0 }}>
        <button onClick={() => setEditing(true)}
          style={{ padding: "2px 8px", fontSize: 10, background: "none", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", color: "#555", fontFamily: "inherit" }}>
          Edit
        </button>
        {confirmDelete ? (
          <>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding: "2px 8px", fontSize: 10, background: "#fdecea", border: "1px solid #ef9a9a", borderRadius: 2, cursor: "pointer", color: "#c62828", fontFamily: "inherit" }}>
              {deleting ? "…" : "Confirm"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ padding: "2px 6px", fontSize: 10, background: "none", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", color: "#888", fontFamily: "inherit" }}>
              ✕
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding: "2px 8px", fontSize: 10, background: "none", border: "1px solid #e0e0e0", borderRadius: 2, cursor: "pointer", color: "#bbb", fontFamily: "inherit" }}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function AddFieldForm({ schemaId, fieldCount, onAdded }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("string");
  const [required, setRequired] = useState(true);
  const [description, setDescription] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setName(""); setLabel(""); setFieldType("string"); setRequired(true); setDescription(""); setHint(""); setError(""); };

  const handleAdd = async () => {
    if (!name.trim() || !label.trim()) { setError("Name and label are required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`${API}/schemas/${schemaId}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": user.id },
      body: JSON.stringify({
        name: name.trim(),
        label: label.trim(),
        field_type: fieldType,
        required,
        display_order: fieldCount,
        description: description.trim() || null,
        extraction_hint: hint.trim() || null,
      }),
    });
    if (res.ok) {
      const newField = await res.json();
      onAdded(newField);
      reset();
      setOpen(false);
    } else {
      const e = await res.json();
      setError(e.detail || "Failed to add field.");
    }
    setSaving(false);
  };

  if (!open) {
    return (
      <div style={{ padding: "8px 14px" }}>
        <button onClick={() => setOpen(true)}
          style={{ padding: "4px 12px", fontSize: 11, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}>
          + Add Field
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 14px", background: "#f8fff8", borderTop: "1px solid #e0f0e0" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 10 }}>New Field</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>name <span style={{ color: "#bbb" }}>(snake_case, used for matching)</span></div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. unit_price"
            style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "monospace" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>label <span style={{ color: "#bbb" }}>(display name)</span></div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Unit Price"
            style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
        </div>
        <div style={{ flex: 0.6 }}>
          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>type</div>
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}
            style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit", background: "#fff" }}>
            {FIELD_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            required
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>
          Description <span style={{ color: "#1565c0" }}>— improves LLM extraction accuracy</span>
        </div>
        <input value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this field represent? e.g. The annual management fee as a percentage"
          style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 3 }}>
          Extraction hint <span style={{ color: "#1565c0" }}>— where to look in the document</span>
        </div>
        <input value={hint} onChange={(e) => setHint(e.target.value)}
          placeholder="e.g. Usually found in the Fees section or Schedule 2, stated as a percentage"
          style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit" }} />
      </div>

      {error && <div style={{ fontSize: 11, color: "#c62828", marginBottom: 8 }}>{error}</div>}

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={handleAdd} disabled={saving}
          style={{ padding: "5px 14px", fontSize: 11, fontWeight: 600, background: saving ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: saving ? "default" : "pointer", fontFamily: "inherit" }}>
          {saving ? "Adding…" : "Add Field"}
        </button>
        <button onClick={() => { reset(); setOpen(false); }}
          style={{ padding: "5px 10px", fontSize: 11, background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ViewSchemasPage() {
  const { user } = useUser();
  const router = useRouter();
  const [schemas, setSchemas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  // per-schema local fields state so edits don't require full reload
  const [schemaFields, setSchemaFields] = useState({});

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/schemas/`).then((r) => r.json()),
      fetch(`${API}/templates/`).then((r) => r.json()),
    ]).then(([s, t]) => {
      const userSchemas = s.filter((sc) => sc.created_by === user.id);
      setSchemas(userSchemas);
      setTemplates(t.filter((tp) => tp.created_by === user.id));
      // seed schemaFields from the fields already embedded in the response
      const fieldsMap = {};
      userSchemas.forEach((sc) => { if (sc.fields) fieldsMap[sc.id] = sc.fields; });
      setSchemaFields(fieldsMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  // when expanding a schema, fetch fresh fields
  const handleExpand = async (schemaId) => {
    if (expanded === schemaId) { setExpanded(null); return; }
    setExpanded(schemaId);
    try {
      const fields = await fetch(`${API}/schemas/${schemaId}/fields`).then((r) => r.json());
      setSchemaFields((prev) => ({ ...prev, [schemaId]: fields }));
    } catch {}
  };

  const handleFieldSaved = (schemaId, updated) => {
    setSchemaFields((prev) => ({
      ...prev,
      [schemaId]: prev[schemaId].map((f) => f.id === updated.id ? updated : f),
    }));
  };

  const handleFieldDeleted = (schemaId, fieldId) => {
    setSchemaFields((prev) => ({
      ...prev,
      [schemaId]: prev[schemaId].filter((f) => f.id !== fieldId),
    }));
  };

  const handleFieldAdded = (schemaId, newField) => {
    setSchemaFields((prev) => ({
      ...prev,
      [schemaId]: [...(prev[schemaId] || []), newField],
    }));
  };

  if (!user) return null;

  const templatesForSchema = (schemaId) => templates.filter((t) => t.schema_id === schemaId);

  return (
    <NavShell active="Schema Builder">
      <div style={{ padding: "24px", maxWidth: 760 }}>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 16, cursor: "pointer" }} onClick={() => router.push("/schema-builder")}>
          ← Schema Builder
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "#1a1020" }}>Your Schemas</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{schemas.length} schema{schemas.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={() => router.push("/schema-builder/new")}
            style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}>
            + New Schema
          </button>
        </div>

        {loading && <div style={{ fontSize: 12, color: "#999" }}>Loading...</div>}

        {!loading && schemas.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>No schemas yet.</div>
            <button onClick={() => router.push("/schema-builder/new")}
              style={{ padding: "7px 14px", fontSize: 12, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}>
              Create your first schema →
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {schemas.map((schema) => {
            const schemaTemplates = templatesForSchema(schema.id);
            const fields = schemaFields[schema.id] || [];
            return (
              <div key={schema.id} style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2 }}>

                {/* Schema row */}
                <div
                  onClick={() => handleExpand(schema.id)}
                  style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <span style={{ fontSize: 11, color: "#aaa", marginRight: 10 }}>
                    {expanded === schema.id ? "▾" : "▸"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1020" }}>{schema.name}</div>
                    {schema.description && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{schema.description}</div>}
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginRight: 16 }}>
                    {fields.length} field{fields.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginRight: 16 }}>
                    {schemaTemplates.length} template{schemaTemplates.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>
                    {new Date(schema.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Expanded panel */}
                {expanded === schema.id && (
                  <div style={{ borderTop: "1px solid #eee" }}>

                    {/* Fields section */}
                    <div style={{ borderBottom: schemaTemplates.length > 0 ? "1px solid #f0eeeb" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 6px" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6 }}>
                          Fields
                        </div>
                      </div>

                      {fields.length === 0 && (
                        <div style={{ padding: "4px 14px 10px", fontSize: 11, color: "#bbb" }}>No fields — add one below.</div>
                      )}

                      {fields.length > 0 && (
                        <>
                          {/* column headers */}
                          <div style={{ display: "flex", gap: 8, padding: "4px 14px", background: "#fafafa", borderBottom: "1px solid #f0eeeb" }}>
                            <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#bbb", textTransform: "uppercase" }}>Field</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#bbb", textTransform: "uppercase", width: 48 }}>Type</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#bbb", textTransform: "uppercase", width: 28 }}>Req</span>
                            <span style={{ width: 110 }} />
                          </div>
                          {fields.map((f) => (
                            <FieldRow
                              key={f.id}
                              field={f}
                              schemaId={schema.id}
                              onSaved={(updated) => handleFieldSaved(schema.id, updated)}
                              onDeleted={(id) => handleFieldDeleted(schema.id, id)}
                            />
                          ))}
                        </>
                      )}

                      <AddFieldForm
                        schemaId={schema.id}
                        fieldCount={fields.length}
                        onAdded={(f) => handleFieldAdded(schema.id, f)}
                      />
                    </div>

                    {/* Templates section */}
                    <div style={{ padding: "10px 14px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Templates</div>
                      {schemaTemplates.length === 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, color: "#bbb" }}>No templates linked to this schema.</span>
                          <button onClick={() => router.push("/template-studio/upload")}
                            style={{ fontSize: 11, color: "#1a1a2e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                            Upload one →
                          </button>
                        </div>
                      ) : (
                        schemaTemplates.map((t) => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #f9f9f9" }}>
                            <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: "#1a1020" }}>{t.name}</span>
                            <StatusBadge status={t.status} />
                            <span style={{ fontSize: 10, color: "#bbb", marginLeft: 8 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                            <button onClick={() => router.push("/template-studio/templates")}
                              style={{ fontSize: 11, color: "#666", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                              Manage →
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </NavShell>
  );
}
