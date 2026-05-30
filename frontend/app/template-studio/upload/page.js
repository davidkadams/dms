"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep,
  textPrimary, textSubtle, textLabel,
  accentTeal, accentBlue, accentRed,
  borderCard,
  btnPrimary, btnDisabled, btnGhost, inputStyle, selectStyle,
} from "../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadTemplatePage() {
  const { user, authHeaders } = useUser();
  const router = useRouter();
  const fileRef = useRef(null);

  const [schemas, setSchemas] = useState([]);
  const [name, setName] = useState("");
  const [schemaId, setSchemaId] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch(`${API}/schemas/`)
      .then((r) => r.json())
      .then((data) => setSchemas(data.filter((s) => s.created_by === user.id)))
      .catch(() => {});
  }, [user, router]);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Template name is required."); return; }
    if (!schemaId) { setError("Please select a schema."); return; }
    if (!file) { setError("Please select a DOCX file."); return; }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("schema_id", schemaId);
      formData.append("file", file);

      const res = await fetch(`${API}/templates/`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      router.push("/template-studio/templates");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <NavShell active="Template Studio">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 560 }}>
        <div
          style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push("/template-studio")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
        >
          ← Template Studio
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: textPrimary, marginBottom: 4 }}>Upload Template</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>Upload a DOCX file with {"{{token}}"} placeholders and link it to a schema.</div>

        <div style={{ background: bgCard, border: borderCard, borderRadius: 2, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>Template Details</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>
              Template Name <span style={{ color: accentRed }}>*</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Invoice Template v1"
              style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>
              Schema <span style={{ color: accentRed }}>*</span>
            </div>
            {schemas.length === 0 ? (
              <div style={{ fontSize: 12, color: accentRed }}>
                No schemas found.{" "}
                <span style={{ cursor: "pointer", textDecoration: "underline", color: accentBlue }} onClick={() => router.push("/schema-builder/new")}>
                  Create one first →
                </span>
              </div>
            ) : (
              <select
                value={schemaId}
                onChange={(e) => setSchemaId(e.target.value)}
                style={{ ...selectStyle, width: "100%", padding: "7px 10px", fontSize: 12 }}
              >
                <option value="">— select a schema —</option>
                {schemas.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: textSubtle, marginBottom: 4 }}>
              DOCX File <span style={{ color: accentRed }}>*</span>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${file ? accentTeal : "rgba(255,255,255,0.2)"}`, borderRadius: 2, padding: "20px", textAlign: "center", cursor: "pointer", background: file ? "rgba(0,191,179,0.06)" : "rgba(255,255,255,0.03)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = file ? accentTeal : "rgba(255,255,255,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = file ? accentTeal : "rgba(255,255,255,0.2)")}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: accentTeal }}>📄 {file.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Click to select a .docx file</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Only .docx files are supported</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: accentRed, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push("/template-studio")}
            style={{ ...btnGhost, padding: "8px 16px", fontSize: 12 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ ...(saving ? btnDisabled : btnPrimary), padding: "8px 20px", fontSize: 12 }}
          >
            {saving ? "Uploading..." : "Upload Template →"}
          </button>
        </div>
        </div>
      </div>
    </NavShell>
  );
}
