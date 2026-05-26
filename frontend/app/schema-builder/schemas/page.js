"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import NavShell from "../../components/NavShell";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export default function ViewSchemasPage() {
  const { user } = useUser();
  const router = useRouter();
  const [schemas, setSchemas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/schemas/`).then((r) => r.json()),
      fetch(`${API}/templates/`).then((r) => r.json()),
    ]).then(([s, t]) => {
      setSchemas(s.filter((sc) => sc.created_by === user.id));
      setTemplates(t.filter((tp) => tp.created_by === user.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const templatesForSchema = (schemaId) => templates.filter((t) => t.schema_id === schemaId);

  return (
    <NavShell active="Schema Builder">
      <div style={{ padding: "24px", maxWidth: 700 }}>
        <div style={{ fontSize: 11, color: "#999", marginBottom: 16, cursor: "pointer" }} onClick={() => router.push("/schema-builder")}>
          ← Schema Builder
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "#1a1020" }}>Your Schemas</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{schemas.length} schema{schemas.length !== 1 ? "s" : ""}</div>
          </div>
          <button
            onClick={() => router.push("/schema-builder/new")}
            style={{ padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
          >
            + New Schema
          </button>
        </div>

        {loading && <div style={{ fontSize: 12, color: "#999" }}>Loading...</div>}

        {!loading && schemas.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>No schemas yet.</div>
            <button
              onClick={() => router.push("/schema-builder/new")}
              style={{ padding: "7px 14px", fontSize: 12, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
            >
              Create your first schema →
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {schemas.map((schema) => {
            const schemaTemplates = templatesForSchema(schema.id);
            return (
              <div key={schema.id} style={{ background: "#fff", border: "1px solid #c8c4be", borderRadius: 2 }}>
                {/* Schema Row */}
                <div
                  onClick={() => setExpanded(expanded === schema.id ? null : schema.id)}
                  style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <span style={{ fontSize: 11, color: "#aaa", marginRight: 10 }}>
                    {expanded === schema.id ? "▾" : "▸"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1020" }}>{schema.name}</div>
                    {schema.description && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{schema.description}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginRight: 16 }}>
                    {schema.fields?.length || 0} field{schema.fields?.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#aaa", marginRight: 16 }}>
                    {schemaTemplates.length} template{schemaTemplates.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>
                    {new Date(schema.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Expanded Panel */}
                {expanded === schema.id && (
                  <div style={{ borderTop: "1px solid #eee" }}>

                    {/* Fields Section */}
                    <div style={{ padding: "12px 16px", borderBottom: schemaTemplates.length > 0 ? "1px solid #f0eeeb" : "none" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                        Fields
                      </div>
                      {(!schema.fields || schema.fields.length === 0) ? (
                        <div style={{ fontSize: 11, color: "#bbb" }}>No fields on this schema.</div>
                      ) : (
                        <>
                          <div style={{ display: "flex", gap: 8, paddingBottom: 4, marginBottom: 2, borderBottom: "1px solid #f0eeeb" }}>
                            {["name", "label", "type", "required"].map((h) => (
                              <span key={h} style={{ flex: 1, fontSize: 10, fontWeight: 600, color: "#bbb", textTransform: "uppercase" }}>{h}</span>
                            ))}
                          </div>
                          {schema.fields.map((f) => (
                            <div key={f.id} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #f9f9f9" }}>
                              <span style={{ flex: 1, fontSize: 11, fontFamily: "monospace", color: "#444" }}>{f.name}</span>
                              <span style={{ flex: 1, fontSize: 11, color: "#666" }}>{f.label}</span>
                              <span style={{ flex: 1, fontSize: 11, color: "#888" }}>{f.field_type}</span>
                              <span style={{ flex: 1, fontSize: 11, color: f.required ? "#2e7d32" : "#999" }}>{f.required ? "yes" : "no"}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Templates Section */}
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                        Templates
                      </div>
                      {schemaTemplates.length === 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 11, color: "#bbb" }}>No templates linked to this schema.</span>
                          <button
                            onClick={() => router.push("/template-studio/upload")}
                            style={{ fontSize: 11, color: "#1a1a2e", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                          >
                            Upload one →
                          </button>
                        </div>
                      ) : (
                        schemaTemplates.map((t) => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid #f9f9f9" }}>
                            <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: "#1a1020" }}>{t.name}</span>
                            <StatusBadge status={t.status} />
                            <span style={{ fontSize: 10, color: "#bbb", marginLeft: 8 }}>
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => router.push("/template-studio/templates")}
                              style={{ fontSize: 11, color: "#666", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
                            >
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
