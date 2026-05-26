"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import NavShell from "../components/NavShell";

const OPTIONS = [
  { key: "new", icon: "+", title: "Create New Schema", desc: "Define a new document structure with fields", href: "/schema-builder/new" },
  { key: "view", icon: "≡", title: "View Schemas", desc: "Browse and manage existing schemas", href: "/schema-builder/schemas" },
];

function OptionBox({ option, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#2a2a4e" : "#1a1a2e", padding: "20px 18px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 140, transition: "background 0.12s" }}
    >
      <div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{option.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{option.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{option.desc}</div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>→</div>
    </div>
  );
}

export default function SchemaBuilderPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) { router.push("/login"); return null; }

  return (
    <NavShell active="Schema Builder">
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1020", letterSpacing: -0.3 }}>Schema Builder</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>Define the structure of your documents</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 320 }}>
          {OPTIONS.map((opt) => (
            <OptionBox key={opt.key} option={opt} onClick={() => router.push(opt.href)} />
          ))}
        </div>
      </div>
    </NavShell>
  );
}
