"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep,
  textPrimary, textSubtle, textMuted, textLabel,
  accentTeal, accentBlue, accentGreen, accentRed,
  borderCard,
  btnPrimary, btnDisabled, btnGhost, inputStyle,
} from "../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function FieldInput({ field, value, onChange }) {
  const base = { ...inputStyle, width: "100%", padding: "8px 10px", fontSize: 13 };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{field.label}</label>
        <span style={{ fontSize: 10, color: textLabel }}>{field.field_type}</span>
        {field.required && <span style={{ fontSize: 10, color: accentRed }}>required</span>}
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
  const { user, authHeaders } = useUser();
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
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ schema_id: selectedSchema.id, label: label.trim(), field_values }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(Array.isArray(err.detail) ? err.detail.map((e) => e.msg).join(", ") : (err.detail || "Failed to create instance"));
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
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 680 }}>
        <div
          style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push("/queue")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
        >
          ← Queue
        </div>

        <div style={{ fontSize: 22, fontWeight: 500, color: textPrimary, letterSpacing: -0.3, marginBottom: 4 }}>New Data Entry</div>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 28 }}>Manually enter data to be merged into a document template.</div>

        {/* Step 1 — Pick a schema */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>
            Step 1 — Select a Schema
          </div>
          {schemas.length === 0 ? (
            <div style={{ fontSize: 12, color: accentRed }}>
              No schemas found.{" "}
              <span style={{ cursor: "pointer", textDecoration: "underline", color: accentBlue }} onClick={() => router.push("/schema-builder/new")}>
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
                      border: `1px solid ${active ? accentTeal : "rgba(255,255,255,0.12)"}`,
                      background: active ? "rgba(0,191,179,0.12)" : "rgba(255,255,255,0.04)",
                      transition: "all 0.1s",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: active ? accentTeal : textPrimary }}>{s.name}</div>
                    {s.description && (
                      <div style={{ fontSize: 11, color: active ? "rgba(0,191,179,0.6)" : "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.description}</div>
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
            <div style={{ borderTop: borderCard, paddingTop: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7 }}>
                  Step 2 — Fill in Data
                  <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 8, color: textMuted }}>
                    {selectedSchema.name}
                  </span>
                </div>
                {fields.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? accentGreen : accentTeal, transition: "width 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: textLabel }}>{filledCount}/{fields.length}</span>
                  </div>
                )}
              </div>

              {/* Label */}
              <div style={{ marginBottom: 22, paddingBottom: 22, borderBottom: borderCard }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 5 }}>
                  Entry Label <span style={{ fontSize: 10, color: accentRed }}>required</span>
                </div>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`e.g. Acme Corp – ${selectedSchema.name} – May 2026`}
                  style={{ ...inputStyle, width: "100%", padding: "8px 10px", fontSize: 13 }}
                />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>A short descriptive name to identify this entry in the queue.</div>
              </div>

              {/* Fields */}
              {loadingFields ? (
                <div style={{ fontSize: 12, color: textMuted }}>Loading fields...</div>
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

            {error && <div style={{ fontSize: 12, color: accentRed, marginBottom: 14 }}>{error}</div>}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => router.push("/queue")}
                style={{ ...btnGhost, padding: "9px 18px", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{ ...(saving ? btnDisabled : btnPrimary), padding: "9px 24px", fontSize: 13 }}
              >
                {saving ? "Saving..." : "Add to Queue →"}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </NavShell>
  );
}
