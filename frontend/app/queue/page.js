"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import NavShell from "../components/NavShell";
import {
  bgPrimary, bgCard, bgDeep, bgHover, bgRowAlt,
  textPrimary, textSecondary, textMuted, textLabel, textDim,
  accentBlue, colorBorderInput, colorBorderRow,
} from "../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_MAP = {
  pending:            { label: "Pending",      bg: "#fff3e0", color: "#b87800", border: "#f0a500" },
  pending_validation: { label: "Needs Review", bg: "#ede7f6", color: "#5e35b1", border: "#9575cd" },
  validated:          { label: "Validated",    bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  processed:          { label: "Processed",    bg: "#e8f5e9", color: "#2e7d32", border: "#66bb6a" },
  failed:             { label: "Failed",       bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", fontSize: 10, fontWeight: 600, borderRadius: 2, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const isManual = source === "manual";
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", fontSize: 10, borderRadius: 2, background: isManual ? "#f0eeeb" : "#e3f2fd", color: isManual ? "#888" : "#1565c0", border: `1px solid ${isManual ? "#c8c4be" : "#90caf9"}` }}>
      {isManual ? "Manual" : "Extracted"}
    </span>
  );
}

export default function QueuePage() {
  const { user, authHeaders } = useUser();
  const router = useRouter();

  const [instances, setInstances] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSchema, setFilterSchema] = useState("");
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const schemaMap = Object.fromEntries(schemas.map((s) => [s.id, s.name]));

  const validatedCount = instances.filter((i) => i.status === "validated").length;

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    setBulkResult(null);
    try {
      const res = await fetch(`${API}/documents/generate-bulk`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      setBulkResult(data);
      const [inst] = await Promise.all([
        fetch(`${API}/data-instances/`).then((r) => r.json()),
      ]);
      setInstances(inst.filter((i) => i.created_by === user.id));
    } catch {
      setBulkResult({ error: "Could not reach the server." });
    }
    setBulkGenerating(false);
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/data-instances/`).then((r) => r.json()),
      fetch(`${API}/schemas/`).then((r) => r.json()),
    ]).then(([inst, sc]) => {
      setInstances(inst.filter((i) => i.created_by === user.id));
      setSchemas(sc.filter((s) => s.created_by === user.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  const filtered = instances.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterSchema && i.schema_id !== filterSchema) return false;
    return true;
  });

  const counts = {
    pending: instances.filter((i) => i.status === "pending").length,
    pending_validation: instances.filter((i) => i.status === "pending_validation").length,
    validated: instances.filter((i) => i.status === "validated").length,
    processed: instances.filter((i) => i.status === "processed").length,
  };

  if (!user) return null;

  return (
    <NavShell active="Queue">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 500, color: textPrimary, letterSpacing: -0.3 }}>Queue</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>Data instances ready for document generation</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {validatedCount > 0 && (
              <button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating}
                style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, background: bulkGenerating ? "#ccc" : "#2e7d32", color: "#fff", border: "none", borderRadius: 2, cursor: bulkGenerating ? "default" : "pointer", fontFamily: "inherit" }}
              >
                {bulkGenerating ? "Generating…" : `Generate All Validated (${validatedCount})`}
              </button>
            )}
            <button
              onClick={() => router.push("/data-instances/new")}
              style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, background: bgPrimary, color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
            >
              + New Manual Entry
            </button>
          </div>
        </div>

        {/* Bulk generate result banner */}
        {bulkResult && !bulkResult.error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: bulkResult.total_generated > 0 ? "#e8f5e9" : "#fff3e0", border: `1px solid ${bulkResult.total_generated > 0 ? "#66bb6a" : "#f0a500"}`, borderRadius: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: bulkResult.total_generated > 0 ? "#2e7d32" : "#b87800", marginBottom: bulkResult.total_skipped > 0 ? 8 : 0 }}>
              {bulkResult.total_generated > 0
                ? `${bulkResult.total_generated} document${bulkResult.total_generated !== 1 ? "s" : ""} generated`
                : "No documents generated"}
              {bulkResult.total_skipped > 0 && ` — ${bulkResult.total_skipped} skipped`}
            </div>
            {bulkResult.skipped?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {bulkResult.skipped.map((s) => (
                  <div key={s.instance_id} style={{ fontSize: 11, color: "#b87800" }}>
                    <strong>{s.label}</strong> — {s.reason === "no default template" ? "no default template set" : s.reason}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setBulkResult(null)} style={{ marginTop: 8, fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#aaa", fontFamily: "inherit", padding: 0 }}>Dismiss</button>
          </div>
        )}
        {bulkResult?.error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fdecea", border: "1px solid #ef9a9a", borderRadius: 2, fontSize: 12, color: "#c62828" }}>
            {bulkResult.error}
            <button onClick={() => setBulkResult(null)} style={{ marginLeft: 12, fontSize: 10, background: "none", border: "none", cursor: "pointer", color: "#aaa", fontFamily: "inherit", padding: 0 }}>Dismiss</button>
          </div>
        )}

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "", label: `All  ${instances.length}` },
            { key: "pending", label: `Pending  ${counts.pending}` },
            { key: "pending_validation", label: `Needs Review  ${counts.pending_validation}` },
            { key: "validated", label: `Validated  ${counts.validated}` },
            { key: "processed", label: `Processed  ${counts.processed}` },
          ].map((f) => {
            const active = filterStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{ padding: "5px 12px", fontSize: 11, fontWeight: active ? 600 : 400, background: active ? textPrimary : "rgba(255,255,255,0.07)", color: active ? bgPrimary : textSecondary, border: `1px solid ${colorBorderInput}`, borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
              >
                {f.label}
              </button>
            );
          })}
          <select
            value={filterSchema}
            onChange={(e) => setFilterSchema(e.target.value)}
            style={{ marginLeft: "auto", padding: "5px 10px", fontSize: 11, border: `1px solid ${colorBorderInput}`, borderRadius: 2, background: bgCard, color: textSecondary, fontFamily: "inherit", cursor: "pointer" }}
          >
            <option value="">All schemas</option>
            {schemas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: bgCard, borderRadius: 2 }}>
          <div style={{ display: "flex", background: bgDeep, padding: "6px 12px" }}>
            {[
              { label: "Label", flex: 2 },
              { label: "Schema", flex: 1.2 },
              { label: "Source", flex: 0.8 },
              { label: "Status", flex: 0.9 },
              { label: "Created", flex: 0.9 },
              { label: "Fields", flex: 0.6, textAlign: "right" },
            ].map((col) => (
              <span key={col.label} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: "#a0a0c0", textAlign: col.textAlign || "left" }}>
                {col.label}
              </span>
            ))}
          </div>

          {loading && <div style={{ padding: "20px 12px", fontSize: 12, color: textMuted }}>Loading...</div>}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "32px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
                {instances.length === 0 ? "No entries yet." : "No entries match the current filter."}
              </div>
              {instances.length === 0 && (
                <button
                  onClick={() => router.push("/data-instances/new")}
                  style={{ padding: "8px 16px", fontSize: 12, background: bgPrimary, color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Create your first entry →
                </button>
              )}
            </div>
          )}

          {filtered.map((instance, i) => (
            <div
              key={instance.id}
              onClick={() => router.push(`/queue/${instance.id}`)}
              style={{ display: "flex", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? bgRowAlt : bgCard)}
            >
              <div style={{ flex: 2, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {instance.label}
                </div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: textDim, marginTop: 1 }}>
                  {instance.id.substring(0, 20)}…
                </div>
              </div>
              <span style={{ flex: 1.2, fontSize: 11, color: textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {schemaMap[instance.schema_id] || "—"}
              </span>
              <span style={{ flex: 0.8 }}>
                <SourceBadge source={instance.source} />
              </span>
              <span style={{ flex: 0.9 }}>
                <StatusBadge status={instance.status} />
              </span>
              <span style={{ flex: 0.9, fontSize: 11, color: textLabel }}>
                {new Date(instance.created_at).toLocaleDateString()}
              </span>
              <span style={{ flex: 0.6, fontSize: 11, textAlign: "right" }}>
                {instance.status === "validated" ? (
                  <span style={{ color: "#1565c0", fontWeight: 600 }}>Ready →</span>
                ) : (
                  <span style={{ color: textLabel }}>{instance.field_values?.length || 0} fields</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Status bar summary */}
        {!loading && instances.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: textLabel }}>
            Showing {filtered.length} of {instances.length} entries
          </div>
        )}
      </div>
    </NavShell>
  );
}
