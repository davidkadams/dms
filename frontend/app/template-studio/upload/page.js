"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadTemplatePage() {
  const { user } = useUser();
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
        headers: { "x-user-id": user.id },
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
      <div style={{ padding: "24px", maxWidth: 560 }}>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 16, cursor: "pointer" }} onClick={() => router.push("/template-studio")}>
          ← Template Studio
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, color: "#1a1020", marginBottom: 4 }}>Upload Template</div>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>Upload a DOCX file with {"{{token}}"} placeholders and link it to a schema.</div>

        <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 14 }}>Template Details</div>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>
              Template Name <span style={{ color: "#c0392b" }}>*</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Invoice Template v1"
              style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, background: "#fafafa", fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {/* Schema */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>
              Schema <span style={{ color: "#c0392b" }}>*</span>
            </div>
            {schemas.length === 0 ? (
              <div style={{ fontSize: 12, color: "#c0392b" }}>
                No schemas found.{" "}
                <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/schema-builder/new")}>
                  Create one first →
                </span>
              </div>
            ) : (
              <select
                value={schemaId}
                onChange={(e) => setSchemaId(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #c8c4be", borderRadius: 2, background: "#fafafa", fontFamily: "inherit", cursor: "pointer" }}
              >
                <option value="">— select a schema —</option>
                {schemas.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* File */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4 }}>
              DOCX File <span style={{ color: "#c0392b" }}>*</span>
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "1px dashed #c8c4be", borderRadius: 2, padding: "20px", textAlign: "center", cursor: "pointer", background: file ? "#f0fff4" : "#fafafa" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1a1a2e")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#c8c4be")}
            >
              {file ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#2e7d32" }}>📄 {file.name}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: "#888" }}>Click to select a .docx file</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Only .docx files are supported</div>
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

        {error && <div style={{ fontSize: 12, color: "#c62828", marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => router.push("/template-studio")}
            style={{ padding: "8px 16px", fontSize: 12, background: "#f0eeeb", border: "1px solid #c8c4be", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: "8px 20px", fontSize: 12, fontWeight: 600, background: saving ? "#ccc" : "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {saving ? "Uploading..." : "Upload Template →"}
          </button>
        </div>
      </div>
    </NavShell>
  );
}
