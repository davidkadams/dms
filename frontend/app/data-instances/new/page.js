"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function FieldInput({ field, value, onChange }) {
  const base = {
    width: "100%", padding: "8px 10px", fontSize: 13,
    border: "1px solid #c8c4be", borderRadius: 2,
    fontFamily: "inherit", outline: "none", background: "#fafafa",
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#1a1020" }}>{field.label}</label>
        <span style={{ fontSize: 10, color: "#aaa" }}>{field.field_type}</span>
        {field.required && <span style={{ fontSize: 10, color: "#c0392b" }}>required</span>}
      </div>
      {field.field_type === "date" ? (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} style={base} />
      ) : field.field_type === "number" ? (
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} style={base} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} style={base} />
      )}
    </div>
  );
}

export default function NewDataInstancePage() {
  const { user } = useUser();
  const router = useRouter();

  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [fields, setFields] = useState([]);
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch(`${API}/schemas/`)
      .then((r) => r.json())
      .then((data) => setSchemas(data.filter((s) => s.created_by === user.id)))
      .catch(() => {});
  }, [user, router]);

  const handleSchemaSelect = async (schema) => {
    setSelectedSchema(schema);
    setFields([]);
    setValues({});
    setLoadingFields(true);
    const f = await fetch(`${API}/schemas/${schema.id}/fields`).then((r) => r.json());
    setFields(f);
    const initial = {};
    f.forEach((field) => { initial[field.id] = ""; });
    setValues(initial);
    setLoadingFields(false);
  };

  const handleSubmit = async () => {
    if (!label.trim()) { setError("Please give this instance a label."); return; }
    const missingRequired = fields.filter((f) => f.required && !values[f.id]?.trim());
    if (missingRequired.length > 0) {
      setError(`Please fill in: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const field_values = fields
        .filter((f) => values[f.id]?.trim())
        .map((f) => ({ schema_field_id: f.id, value: values[f.id].trim() }));

      const res = await fetch(`${API}/data-instances/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ schema_id: selectedSchema.id, label: label.trim(), field_values }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create instance");
      }

      router.push("/queue");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const filledCount = fields.filter((f) => values[f.id]?.trim()).length;
  const progress = fields.length > 0 ? Math.round((filledCount / fields.length) * 100) : 0;

  return (
    <NavShell active="Queue">
      <div style={{ padding: "24px", maxWidth: 680 }}>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 16, cursor: "pointer" }} onClick={() => router.push("/queue")}>
          ← Queue
        </div>

        <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1020", letterSpacing: -0.3, marginBottom: 4 }}>New Data Entry</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 28 }}>Manually enter data to be merged into a document template.</div>

        {/* Step 1 — Pick a schema */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
            Step 1 — Select a Schema
          </div>
          {schemas.length === 0 ? (
            <div style={{ fontSize: 12, color: "#c0392b" }}>
              No schemas found.{" "}
              <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/schema-builder/new")}>
                Create one first →
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {schemas.map((s) => {
                const active = selectedSchema?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSchemaSelect(s)}
                    style={{
                      padding: "10px 16px", cursor: "pointer", borderRadius: 2,
                      border: `1px solid ${active ? "#1a1a2e" : "#c8c4be"}`,
                      background: active ? "#1a1a2e" : "#fff",
                      transition: "all 0.1s",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? "#fff" : "#1a1020" }}>{s.name}</div>
                    {s.description && (
                      <div style={{ fontSize: 11, color: active ? "rgba(255,255,255,0.5)" : "#aaa", marginTop: 2 }}>{s.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2 — Fill in the data */}
        {selectedSchema && (
          <>
            <div style={{ borderTop: "1px solid #e0ddd9", paddingTop: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.7 }}>
                  Step 2 — Fill in Data
                  <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 8, color: "#bbb" }}>
                    {selectedSchema.name}
                  </span>
                </div>
                {fields.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: "#e0ddd9", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? "#2e7d32" : "#1a1a2e", transition: "width 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#aaa" }}>{filledCount}/{fields.length}</span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div style={{ marginBottom: 22, paddingBottom: 22, borderBottom: "1px solid #f0eeeb" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1020", marginBottom: 5 }}>
                  Entry Label <span style={{ fontSize: 10, color: "#c0392b" }}>required</span>
                </div>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`e.g. Acme Corp – ${selectedSchema.name} – May 2026`}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #c8c4be", borderRadius: 2, fontFamily: "inherit", outline: "none", background: "#fafafa" }}
                />
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 4 }}>A short descriptive name to identify this entry in the queue.</div>
              </div>

              {/* Fields */}
              {loadingFields ? (
                <div style={{ fontSize: 12, color: "#999" }}>Loading fields...</div>
              ) : (
                fields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    value={values[field.id] || ""}
                    onChange={(val) => setValues({ ...values, [field.id]: val })}
                  />
                ))
              )}
            </div>

            {error && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 14 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => router.push("/queue")}
                style={{ padding: "9px 18px", fontSize: 12, background: "#f0eeeb", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ padding: "9px 24px", fontSize: 13, fontWeight: 600, background: saving ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {saving ? "Saving..." : "Add to Queue →"}
              </button>
            </div>
          </>
        )}
      </div>
    </NavShell>
  );
}
