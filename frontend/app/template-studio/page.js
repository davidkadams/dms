"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import NavShell from "../components/NavShell";
import { bgPrimary, bgHover, textPrimary, textMuted, textFaint } from "../theme";

const OPTIONS = [
  { key: "upload", icon: "↑", title: "Upload Template", desc: "Upload a DOCX file and link it to a schema", href: "/template-studio/upload" },
  { key: "view", icon: "≡", title: "View Templates", desc: "Browse, activate and delete your templates", href: "/template-studio/templates" },
];

function OptionBox({ option, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? bgHover : bgPrimary, padding: "20px 18px", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", height: 140, transition: "background 0.12s" }}
    >
      <div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>{option.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3 }}>{option.title}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.4 }}>{option.desc}</div>
      </div>
      <div style={{ fontSize: 12, color: textFaint, marginTop: 8 }}>→</div>
    </div>
  );
}

export default function TemplateStudioPage() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) { router.push("/login"); return null; }

  return (
    <NavShell active="Template Studio">
      <div style={{ background: bgPrimary, flex: 1, padding: "24px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: textPrimary, letterSpacing: -0.3 }}>Template Studio</div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 3 }}>Upload and manage your document templates</div>
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
