"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import {
  bgPrimary, bgCard, bgDeep, bgHover, bgRowAlt,
  textPrimary, textBody, textSubtle, textSecondary, textMuted, textLabel, textDim, textFaint, textNav,
  accentTeal,
  colorBorderInput, colorBorderRow, borderCard,
  accentRed,
  accentGreen,
  accentOrange,
} from "../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MODULES = [
  { key: "schema", icon: "{ }", title: "Schema Builder", desc: "Define schemas and field mappings", href: "/schema-builder" },
  { key: "template", icon: "⬜", title: "Template Studio", desc: "Upload and configure templates", href: "/template-studio" },
  { key: "ingest", icon: "↑", title: "Ingest", desc: "Upload documents or email bodies", href: "/ingest" },
  { key: "queue", icon: "≡", title: "Queue", desc: "Review, manually enter, or generate documents", href: "/queue" },
];

function StatusBadge({ status }) {
  const map = {
    pending:            { label: "Pending",      bg: "#fff3e0", color: "#b87800", border: "#f0a500" },
    pending_validation: { label: "Needs Review", bg: "#ede7f6", color: "#5e35b1", border: "#9575cd" },
    validated:          { label: "Validated",    bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
    processed:          { label: "Processed",    bg: "#e8f5e9", color: "#2e7d32", border: "#66bb6a" },
    failed:             { label: "Failed",       bg: "#fdecea", color: "#c62828", border: "#ef9a9a" },
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
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: bgCard, borderRadius: 2 }}>
      <div style={{ display: "flex", background: bgDeep, padding: "5px 10px" }}>
        {[{ label: "Label", flex: 1.6 }, { label: "Schema", flex: 1.4 }, { label: "ID", flex: 1.8 }, { label: "Status", flex: 1 }, { label: "Created", flex: 1, textAlign: "right" }]
          .map((col) => (
            <span key={col.label} style={{ flex: col.flex, fontSize: 11, fontWeight: 600, color: textNav, textAlign: col.textAlign || "left" }}>
              {col.label}
            </span>
          ))}
      </div>
      {items.length === 0 && (
        <div style={{ padding: "16px 10px", fontSize: 12, color: textMuted }}>No instances yet.</div>
      )}
      {items.map((item, i) => (
        <div
          key={item.id}
          onClick={() => onRowClick(item)}
          style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderBottom: `1px solid ${colorBorderRow}`, background: i % 2 === 1 ? bgRowAlt : bgCard, cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? bgRowAlt : bgCard)}
        >
          <span style={{ flex: 1.6, fontSize: 11, fontWeight: 500, color: textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <span style={{ flex: 1.4, fontSize: 11, color: textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.schema_name || "—"}</span>
          <span style={{ flex: 1.8, fontSize: 10, fontFamily: "monospace", color: textDim }}>{item.id.substring(0, 18)}…</span>
          <span style={{ flex: 1 }}><StatusBadge status={item.status || "pending"} /></span>
          <span style={{ flex: 1, fontSize: 10, color: textDim, textAlign: "right" }}>
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
      style={{ background: hovered ? "#363660" : bgHover, padding: "20px 18px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 140, transition: "background 0.12s" }}
    >
      <div>
        <div style={{ fontSize: 18, color: textMuted, marginBottom: 10 }}>{module.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{module.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{module.desc}</div>
      </div>
      <div style={{ fontSize: 12, color: textFaint, marginTop: 8 }}>→</div>
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
      style={{ padding: "2px 9px", background: hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)", border: `1px solid ${colorBorderInput}`, fontSize: 11, color: hovered ? "#fff" : textSubtle, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, borderRadius: 2, fontFamily: "inherit" }}
    >
      {children}
    </button>
  );
}

const SLIDES = [
  {
    key: "how-it-works",
    tag: "Getting Started",
    tagColor: accentOrange,
    title: "How does rescribe.io work?",
    body: (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {[
            { n: "1", label: "Define a Schema", desc: "Tell the system what fields matter for a document type — contract, invoice, trade confirmation." },
            { n: "2", label: "Ingest a Document", desc: "Upload a file. The AI matches it to a schema and pulls out every field automatically." },
            { n: "3", label: "Validate & Generate", desc: "Review extracted data or create entries manually, approve them, then generate a formatted output document in one click." },
          ].map(({ n, label, desc }) => (
            <div key={n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: accentOrange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1 }}>{n}</div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: textPrimary }}>{label} — </span>
                <span style={{ fontSize: 11, color: textSubtle }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    link: { label: "Full workflow guide →", href: "/how-it-works" },
  },
  {
    key: "changelog",
    tag: "Release Notes",
    tagColor: accentGreen,
    title: "Beta Version 0.1.0",
    body: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { bullet: "✦", text: "Schema Builder — define fields with AI extraction hints" },
          { bullet: "✦", text: "AI Ingest — automatic schema matching + field extraction" },
          { bullet: "✦", text: "Template Studio — upload DOCX templates, map tokens to fields" },
          { bullet: "✦", text: "Queue — validate extracted data, generate output documents" },
          { bullet: "✦", text: "Bulk Generate — process all validated entries in one action" },
        ].map(({ bullet, text }) => (
          <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: textNav, fontSize: 10, marginTop: 2, flexShrink: 0 }}>{bullet}</span>
            <span style={{ fontSize: 11, color: textBody, lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
    ),
    link: null,
  },
  {
    key: "planned-features",
    tag: "Planned Features",
    tagColor: accentRed,
    title: "Upcoming features in development",
    body: (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { bullet: "✦", text: "User authentication and team management" },
          { bullet: "✦", text: "More schema field types (lists) for more robust document extraction" },
          { bullet: "✦", text: "API access for all core functionalities" },
        ].map(({ bullet, text }) => (
          <div key={text} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ color: textDim, fontSize: 10, marginTop: 2, flexShrink: 0 }}>{bullet}</span>
            <span style={{ fontSize: 11, color: textSubtle, lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
    ),
    link: null,
  }
];

const SLIDE_DURATION_MS = 10000;

function Carousel({ router }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => { setActive(i); startTimer(); };

  const slide = SLIDES[active];

  return (
    <div style={{ flex: 1, minWidth: 0, background: bgCard, border: borderCard, borderRadius: 2, display: "flex", flexDirection: "column", height: 283, overflow: "hidden" }}>

      {/* Header strip — tag only */}
      <div style={{ background: bgPrimary, padding: "7px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: slide.tagColor, letterSpacing: 0.6, textTransform: "uppercase" }}>{slide.tag}</span>
      </div>

      {/* Slide body */}
      <div style={{ flex: 1, padding: "16px 18px 12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 12, letterSpacing: -0.2 }}>{slide.title}</div>
        <div style={{ flex: 1, overflowY: "auto" }}>{slide.body}</div>
        {slide.link && (
          <div style={{ marginTop: 10, flexShrink: 0 }}>
            <span
              onClick={() => router.push(slide.link.href)}
              style={{ fontSize: 11, color: accentOrange, cursor: "pointer", fontWeight: 600 }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {slide.link.label}
            </span>
          </div>
        )}
      </div>

      {/* Bottom: dot nav centred + subtle progress bar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 0 6px" }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? 18 : 7,
                height: 7,
                borderRadius: 4,
                background: i === active ? slide.tagColor : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div
            key={active}
            style={{
              height: "100%",
              background: slide.tagColor,
              opacity: 0.35,
              animation: `carouselProgress ${SLIDE_DURATION_MS / 1000}s linear forwards`,
            }}
          />
          <style>{`@keyframes carouselProgress { from { width: 0% } to { width: 100% } }`}</style>
        </div>
      </div>

    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [instances, setInstances] = useState([]);
  const [schemaMap, setSchemaMap] = useState({});
  const [activeNav, setActiveNav] = useState("Dashboard");

  const loadData = () => {
    Promise.all([
      fetch(`${API}/data-instances/`).then((r) => r.json()),
      fetch(`${API}/schemas/`).then((r) => r.json()),
    ]).then(([inst, schemas]) => {
      const map = Object.fromEntries(schemas.map((s) => [s.id, s.name]));
      setSchemaMap(map);
      setInstances(inst.filter((i) => i.created_by === user.id));
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    loadData();
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
    <div style={{ background: bgPrimary, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Title Bar */}
      <div style={{ background: bgPrimary, padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: textNav }}>📄</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary, letterSpacing: 0.3 }}>rescribe.io</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary, letterSpacing: 0.3 }}>{user.name}</span>
      </div>

      {/* Nav Bar */}
      <div style={{ background: bgCard, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {navItems.map((item) => (
            <div
              key={item}
              onClick={() => { setActiveNav(item); router.push(navRoutes[item]); }}
              style={{ padding: "7px 14px", fontSize: 12, color: activeNav === item ? "#fff" : textSubtle, cursor: "pointer", borderBottom: activeNav === item ? `2px solid ${accentTeal}` : "2px solid transparent", transition: "all 0.12s" }}
            >
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, color: textSubtle, background: "rgba(255,255,255,0.07)", border: `1px solid ${colorBorderInput}`, borderRadius: 2, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.2 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = textSubtle; }}
          >
            Account
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, color: textSubtle, background: "rgba(255,255,255,0.07)", border: `1px solid ${colorBorderInput}`, borderRadius: 2, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.2 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = textSubtle; }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: bgDeep, padding: "4px 14px", display: "flex", gap: 4, alignItems: "center", borderBottom: borderCard, flexShrink: 0 }}>
        <TbBtn onClick={() => router.push("/how-it-works")}>≡ How it Works</TbBtn>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.1)", margin: "0 3px" }} />
        <TbBtn onClick={() => { setInstances([]); loadData(); }}>↻ Refresh</TbBtn>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 24px 20px", flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: textPrimary, letterSpacing: -0.3 }}>Welcome back, {firstName}.</div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>{today}</div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-start" }}>
          {/* 4-box module grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 320, flexShrink: 0 }}>
            {MODULES.map((mod) => (
              <ModuleBox key={mod.key} module={mod} onClick={() => router.push(mod.href)} />
            ))}
          </div>
          {/* Carousel */}
          <Carousel router={router} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: textLabel, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
          Queue — recent instances
        </div>
        <QueueTable
          items={instances.slice(0, 10).map((i) => ({ ...i, schema_name: schemaMap[i.schema_id] || "—" }))}
          onRowClick={(item) => router.push(`/queue/${item.id}`)}
        />
      </div>

      {/* Status Bar */}
      <div style={{ background: bgDeep, borderTop: borderCard, padding: "3px 14px", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        {["4 modules", `${pendingCount} pending · ${reviewCount} needs review · ${doneCount} done`].map((text, i) => (
          <span key={i} style={{ fontSize: 11, color: textDim, paddingRight: 12, borderRight: "1px solid rgba(255,255,255,0.1)" }}>{text}</span>
        ))}
        <span style={{ fontSize: 11, color: textDim, marginLeft: "auto" }}>{user.name}</span>
      </div>
    </div>
  );
}
