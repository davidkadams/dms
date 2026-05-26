"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Schema Builder", href: "/schema-builder" },
  { label: "Template Studio", href: "/template-studio" },
  { label: "Ingest", href: "/ingest" },
  { label: "Queue", href: "/queue" },
];

export default function NavShell({ active, children }) {
  const { user, logout } = useUser();
  const router = useRouter();

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
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{ padding: "7px 14px", fontSize: 12, color: active === item.label ? "#fff" : "rgba(255,255,255,0.55)", cursor: "pointer", borderBottom: active === item.label ? "2px solid #00bfb3" : "2px solid transparent", transition: "all 0.12s" }}
            >
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", paddingRight: 10, borderRight: "1px solid rgba(255,255,255,0.15)" }}>
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.55)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 2, background: "transparent", fontFamily: "inherit" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Status Bar */}
      <div style={{ background: "#e8e4e0", borderTop: "1px solid #c8c4be", padding: "3px 14px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#666", paddingRight: 12, borderRight: "1px solid #c8c4be" }}>rescribe.io</span>
        <span style={{ fontSize: 11, color: "#666", marginLeft: "auto" }}>{user?.name}</span>
      </div>
    </div>
  );
}
