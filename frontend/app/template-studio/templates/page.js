"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep, bgRowAlt,
  textPrimary, textSecondary, textMuted, textLabel, textDim,
  accentBlue, accentGreen, accentRed,
  borderCard, colorBorderInput,
  btnPrimary, btnGhost, selectStyle,
} from "../../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function StatusBadge({ status }) {
  const isActive = status === "active";
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", fontSize: 10, fontWeight: 600, borderRadius: 2,
      background: isActive ? "#e8f5e9" : "#fff3e0",
      color: isActive ? "#2e7d32" : "#b87800",
      border: `1px solid ${isActive ? "#66bb6a" : "#f0a500"}`,
    }}>
      {isActive ? "Active" : "Draft"}
    </span>
  );
}

export default function ViewTemplatesPage() {
  const { user } = useUser();
  const router = useRouter();

  const [templates, setTemplates] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [filterSchemaId, setFilterSchemaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const schemaMap = Object.fromEntries(schemas.map((s) => [s.id, s.name]));

  const fetchTemplates = (schemaId) => {
    const url = schemaId ? `${API}/templates/?schema_id=${schemaId}` : `${API}/templates/`;
    return fetch(url).then((r) => r.json());
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/schemas/`).then((r) => r.json()),
      fetchTemplates(""),
    ]).then(([s, t]) => {
      setSchemas(s.filter((sc) => sc.created_by === user.id));
      setTemplates(t.filter((tp) => tp.created_by === user.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const handleFilterChange = async (schemaId) => {
    setFilterSchemaId(schemaId);
    setLoading(true);
    const data = await fetchTemplates(schemaId);
    setTemplates(data.filter((tp) => tp.created_by === user.id));
    setLoading(false);
  };

  const handleActivate = async (templateId) => {
    setActivatingId(templateId);
    await fetch(`${API}/templates/${templateId}/activate`, { method: "PATCH" });
    setTemplates((prev) => prev.map((t) => t.id === templateId ? { ...t, status: "active" } : t));
    setActivatingId(null);
  };

  const handleDelete = async (templateId) => {
    setDeletingId(templateId);
    await fetch(`${API}/templates/${templateId}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    setDeletingId(null);
    setConfirmDelete(null);
  };

  if (!user) return null;

  return (
    <NavShell active="Template Studio">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ maxWidth: 800 }}>
        <div
          style={{ fontSize: 11, color: textLabel, marginBottom: 16, cursor: "pointer" }}
          onClick={() => router.push("/template-studio")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = textLabel)}
        >
          ← Template Studio
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: textPrimary }}>Templates</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{templates.length} template{templates.length !== 1 ? "s" : ""}</div>
          </div>
          <button
            onClick={() => router.push("/template-studio/upload")}
            style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}
          >
            ↑ Upload Template
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: textMuted }}>Filter by schema:</span>
          <select
            value={filterSchemaId}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{ ...selectStyle, padding: "5px 10px", fontSize: 12, background: bgCard }}
          >
            <option value="">All schemas</option>
            {schemas.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {filterSchemaId && (
            <button
              onClick={() => handleFilterChange("")}
              style={{ fontSize: 11, color: textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: bgCard, borderRadius: 2 }}>
          <div style={{ display: "flex", background: bgDeep, padding: "6px 12px" }}>
            {[{ label: "Name", flex: 1.8 }, { label: "Schema", flex: 1.4 }, { label: "Status", flex: 0.8 }, { label: "Created", flex: 0.9 }, { label: "Actions", flex: 1.6, textAlign: "right" }].map((col) => (
              <span key={col.label} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: "#a0a0c0", textAlign: col.textAlign || "left" }}>
                {col.label}
              </span>
            ))}
          </div>

          {loading && <div style={{ padding: "16px 12px", fontSize: 12, color: textMuted }}>Loading...</div>}

          {!loading && templates.length === 0 && (
            <div style={{ padding: "24px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>No templates found.</div>
              <button
                onClick={() => router.push("/template-studio/upload")}
                style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}
              >
                Upload your first template →
              </button>
            </div>
          )}

          {templates.map((t, i) => (
            <div key={t.id}>
              <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 1 ? bgRowAlt : bgCard }}>
                <span style={{ flex: 1.8, fontSize: 12, fontWeight: 500, color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
                <span style={{ flex: 1.4, fontSize: 11, color: textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {schemaMap[t.schema_id] || <span style={{ fontFamily: "monospace", fontSize: 10, color: textDim }}>{t.schema_id.substring(0, 14)}…</span>}
                </span>
                <span style={{ flex: 0.8 }}>
                  <StatusBadge status={t.status} />
                </span>
                <span style={{ flex: 0.9, fontSize: 11, color: textLabel }}>
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
                <div style={{ flex: 1.6, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button
                    onClick={() => router.push(`/template-studio/templates/${t.id}/tokens`)}
                    style={{ padding: "3px 10px", fontSize: 11, background: "rgba(144,202,249,0.12)", color: accentBlue, border: "1px solid rgba(144,202,249,0.25)", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Edit
                  </button>
                  {t.status !== "active" && (
                    <button
                      onClick={() => handleActivate(t.id)}
                      disabled={activatingId === t.id}
                      style={{ padding: "3px 10px", fontSize: 11, background: "rgba(129,199,132,0.12)", color: accentGreen, border: "1px solid rgba(129,199,132,0.25)", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {activatingId === t.id ? "..." : "Activate"}
                    </button>
                  )}
                  {t.status === "active" && (
                    <span style={{ padding: "3px 10px", fontSize: 11, color: textLabel }}>Active</span>
                  )}
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    style={{ padding: "3px 10px", fontSize: 11, background: "rgba(239,154,154,0.12)", color: accentRed, border: "1px solid rgba(239,154,154,0.25)", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {confirmDelete === t.id && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(239,154,154,0.07)", borderBottom: "1px solid rgba(239,154,154,0.15)" }}>
                  <span style={{ fontSize: 12, color: accentRed, flex: 1 }}>
                    Delete <strong>{t.name}</strong>? This also removes the file from storage.
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    style={{ padding: "4px 12px", fontSize: 11, fontWeight: 600, background: "#c62828", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {deletingId === t.id ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
    </NavShell>
  );
}
