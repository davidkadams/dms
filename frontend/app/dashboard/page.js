"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MODULES = [
  { key: "schema", icon: "{ }", title: "Schema Builder", desc: "Define schemas and field mappings", href: "/schema-builder" },
  { key: "template", icon: "⬜", title: "Template Studio", desc: "Upload and configure templates", href: "/template-studio" },
  { key: "ingest", icon: "↑", title: "Ingest", desc: "Upload documents or email bodies", href: "/ingest" },
  { key: "queue", icon: "≡", title: "Queue", desc: "Review, reconcile and generate", href: "/queue" },
];

function StatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", bg: "#fff3e0", color: "#b87800", border: "#f0a500" },
    pending_validation: { label: "Needs Review", bg: "#ede7f6", color: "#5e35b1", border: "#9575cd" },
    processed: { label: "Done", bg: "#e8f5e9", color: "#2e7d32", border: "#66bb6a" },
    failed: { label: "Failed", bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      display: "inline-block", padding: "2px 7px", fontSize: 10, fontWeight: 600, borderRadius: 2,
    }}>
      {s.label}
    </span>
  );
}

function QueueTable({ items, onRowClick }) {
  return (
    <div style={{ border: "1px solid #c8c4be", background: "#fff", borderRadius: 2 }}>
      <div style={{ display: "flex", background: "#1a1a2e", padding: "5px 10px" }}>
        {[{ label: "Label", flex: 1.6 }, { label: "Schema", flex: 1.4 }, { label: "ID", flex: 1.8 }, { label: "Status", flex: 1 }, { label: "Created", flex: 1, textAlign: "right" }]
          .map((col) => (
            <span key={col.label} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: "#a0a0c0", textAlign: col.textAlign || "left" }}>
              {col.label}
            </span>
          ))}
      </div>
      {items.length === 0 && (
        <div style={{ padding: "16px 10px", fontSize: 12, color: "#999" }}>No instances yet.</div>
      )}
      {items.map((item, i) => (
        <div
          key={item.id}
          onClick={() => onRowClick(item)}
          style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: "1px solid #eee", background: i % 2 === 1 ? "#fafafa" : "#fff", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0eeeb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "#fafafa" : "#fff")}
        >
          <span style={{ flex: 1.6, fontSize: 11, fontWeight: 500, color: "#1a1020", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <span style={{ flex: 1.4, fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.schema_name || "—"}</span>
          <span style={{ flex: 1.8, fontSize: 10, fontFamily: "monospace", color: "#999" }}>{item.id.substring(0, 18)}…</span>
          <span style={{ flex: 1 }}><StatusBadge status={item.status || "pending"} /></span>
          <span style={{ flex: 1, fontSize: 10, color: "#999", textAlign: "right" }}>
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function ModuleBox({ module, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#2a2a4e" : "#1a1a2e", padding: "20px 18px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 140, transition: "background 0.12s" }}
    >
      <div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{module.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{module.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{module.desc}</div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>→</div>
    </div>
  );
}

function TbBtn({ children, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: "2px 9px", background: hovered ? "#fff" : "#f0eeeb", border: `1px solid ${hovered ? "#888" : "#b0acaa"}`, fontSize: 11, color: "#1a1020", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, borderRadius: 2, fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [instances, setInstances] = useState([]);
  const [activeNav, setActiveNav] = useState("Dashboard");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch(`${API}/data-instances/`)
      .then((r) => r.json())
      .then(setInstances)
      .catch(() => {});
  }, [user, router]);

  if (!user) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const firstName = user.name.split(" ")[0];

  const pendingCount = instances.filter((i) => i.status === "pending" || !i.status).length;
  const reviewCount = instances.filter((i) => i.status === "pending_validation").length;
  const doneCount = instances.filter((i) => i.status === "processed").length;

  const navItems = ["Dashboard", "Schema Builder", "Template Studio", "Ingest", "Queue"];
  const navRoutes = { "Dashboard": "/dashboard", "Schema Builder": "/schema-builder", "Template Studio": "/template-studio", "Ingest": "/ingest", "Queue": "/queue" };

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <div style={{ background: "#f0eeeb", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Title Bar */}
      <div style={{ background: "#1a1a2e", padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#a0a0c0" }}>📄</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#e0e0f0", letterSpacing: 0.3 }}>rescribe.io</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ color: "#ff5f57" }, { color: "#febc2e" }, { color: "#28c840" }].map((btn, i) => (
            <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: btn.color, cursor: "pointer" }} />
          ))}
        </div>
      </div>

      {/* Nav Bar */}
      <div style={{ background: "#22223a", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {navItems.map((item) => (
            <div
              key={item}
              onClick={() => { setActiveNav(item); router.push(navRoutes[item]); }}
              style={{ padding: "7px 14px", fontSize: 12, color: activeNav === item ? "#fff" : "rgba(255,255,255,0.55)", cursor: "pointer", borderBottom: activeNav === item ? "2px solid #00bfb3" : "2px solid transparent", transition: "all 0.12s" }}
            >
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", paddingRight: 10, borderRight: "1px solid rgba(255,255,255,0.15)" }}>
            {user.name}
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.55)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, background: "transparent", fontFamily: "inherit" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#f0eeeb", padding: "4px 14px", display: "flex", gap: 4, alignItems: "center", borderBottom: "1px solid #c8c4be", flexShrink: 0 }}>
        <TbBtn onClick={() => router.push("/ingest")}>↑ Upload</TbBtn>
        <TbBtn onClick={() => router.push("/queue")}>≡ Queue</TbBtn>
        <div style={{ width: 1, height: 18, background: "#c8c4be", margin: "0 3px" }} />
        <TbBtn onClick={() => { setInstances([]); fetch(`${API}/data-instances/`).then(r => r.json()).then(setInstances).catch(() => {}); }}>↻ Refresh</TbBtn>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 24px 20px", flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1020", letterSpacing: -0.3 }}>Welcome back, {firstName}.</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{today}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 320, marginBottom: 24 }}>
          {MODULES.map((mod) => (
            <ModuleBox key={mod.key} module={mod} onClick={() => router.push(mod.href)} />
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
          Queue — recent instances
        </div>
        <QueueTable items={instances.slice(0, 10)} onRowClick={(item) => router.push(`/queue/${item.id}`)} />
      </div>

      {/* Status Bar */}
      <div style={{ background: "#e8e4e0", borderTop: "1px solid #c8c4be", padding: "3px 14px", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        {["4 modules", `${pendingCount} pending · ${reviewCount} needs review · ${doneCount} done`].map((text, i) => (
          <span key={i} style={{ fontSize: 11, color: "#666", paddingRight: 12, borderRight: "1px solid #c8c4be" }}>{text}</span>
        ))}
        <span style={{ fontSize: 11, color: "#666", marginLeft: "auto" }}>{user.name}</span>
      </div>
    </div>
  );
}
