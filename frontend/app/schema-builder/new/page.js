"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";
import {
  bgPrimary, bgCard,
  textPrimary, textSubtle, textLabel,
  accentRed,
  borderCard,
  btnPrimary, btnDisabled, btnGhost, inputStyle, selectStyle,
} from "../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const FIELD_TYPES = ["string", "number", "date"];

function Input({ label, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>
        {label}{required && <span style={{ color: accentRed }}> *</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12 }}
      />
    </div>
  );
}

function FieldRow({ field, index, onChange, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input
        placeholder="name (snake_case)"
        value={field.name}
        onChange={(e) => onChange(index, "name", e.target.value)}
        style={{ ...inputStyle, flex: 1.2, padding: "6px 8px", fontSize: 11 }}
      />
      <input
        placeholder="label"
        value={field.label}
        onChange={(e) => onChange(index, "label", e.target.value)}
        style={{ ...inputStyle, flex: 1.2, padding: "6px 8px", fontSize: 11 }}
      />
      <select
        value={field.field_type}
        onChange={(e) => onChange(index, "field_type", e.target.value)}
        style={{ ...selectStyle, flex: 0.8, padding: "6px 8px", fontSize: 11 }}
      >
        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: textSubtle, whiteSpace: "nowrap" }}>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange(index, "required", e.target.checked)}
        />
        required
      </label>
      <button
        onClick={() => onRemove(index)}
        style={{ padding: "4px 8px", fontSize: 11, background: "rgba(239,154,154,0.12)", border: "1px solid rgba(239,154,154,0.3)", borderRadius: 2, cursor: "pointer", color: accentRed, fontFamily: "inherit" }}
      >
        ✕
      </button>
    </div>
  );
}

export default function NewSchemaPage() {
  const { user, authHeaders } = useUser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!user) { router.push("/login"); return null; }

  const addField = () => {
    setFields([...fields, { name: "", label: "", field_type: "string", required: true }]);
  };

  const updateField = (index, key, value) => {
    setFields(fields.map((f, i) => i === index ? { ...f, [key]: value } : f));
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Schema name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const schemaRes = await fetch(`${API}/schemas/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!schemaRes.ok) {
        const err = await schemaRes.json();
        throw new Error(err.detail || "Failed to create schema");
      }
      const schema = await schemaRes.json();

      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (!f.name.trim() || !f.label.trim()) continue;
        await fetch(`${API}/schemas/${schema.id}/fields`, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ ...f, name: f.name.trim(), label: f.label.trim(), display_order: i }),
        });
      }

      router.push("/schema-builder/schemas");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <NavShell active="Schema Builder">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 640 }}>
        <div
          style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push("/schema-builder")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
        >
          ← Schema Builder
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: textPrimary, marginBottom: 4 }}>Create New Schema</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>Define the name, description, and fields for this document structure.</div>

        <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>Schema Details</div>
          <Input label="Name" value={name} onChange={setName} placeholder="e.g. Invoice, Client Onboarding" required />
          <div style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12, resize: "vertical" }}
            />
          </div>
        </div>

        <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7 }}>Fields</div>
            <button
              onClick={addField}
              style={{ ...btnPrimary, padding: "4px 10px", fontSize: 11 }}
            >
              + Add Field
            </button>
          </div>

          {fields.length === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "8px 0" }}>No fields yet — click Add Field to get started.</div>
          )}

          {fields.length > 0 && (
            <div style={{ fontSize: 10, color: textLabel, display: "flex", gap: 8, marginBottom: 6 }}>
              <span style={{ flex: 1.2 }}>name</span>
              <span style={{ flex: 1.2 }}>label</span>
              <span style={{ flex: 0.8 }}>type</span>
              <span style={{ flex: 0.6 }}></span>
              <span style={{ width: 40 }}></span>
            </div>
          )}

          {fields.map((f, i) => (
            <FieldRow key={i} field={f} index={i} onChange={updateField} onRemove={removeField} />
          ))}
        </div>

        {error && <div style={{ fontSize: 12, color: accentRed, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push("/schema-builder")}
            style={{ ...btnGhost, padding: "8px 16px", fontSize: 12 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ ...(saving ? btnDisabled : btnPrimary), padding: "8px 20px", fontSize: 12 }}
          >
            {saving ? "Saving..." : "Create Schema →"}
          </button>
        </div>
        </div>
      </div>
    </NavShell>
  );
}
