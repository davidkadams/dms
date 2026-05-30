"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import {
  bgPrimary, bgCard, bgDeep,
  textPrimary, textSubtle, textDim, textNav,
  accentTeal, colorBorderInput, borderCard,
} from "../theme";

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
    <div style={{ background: bgPrimary, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Title Bar */}
      <div style={{ background: bgPrimary, padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: textNav }}>📄</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary, letterSpacing: 0.3 }}>rescribe.io</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: textPrimary, letterSpacing: 0.3 }}>{user?.name}</span>
      </div>

      {/* Nav Bar */}
      <div style={{ background: bgCard, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{ padding: "7px 14px", fontSize: 12, color: active === item.label ? "#fff" : textSubtle, cursor: "pointer", borderBottom: active === item.label ? `2px solid ${accentTeal}` : "2px solid transparent", transition: "all 0.12s" }}
            >
              {item.label}
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

      {/* Page Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Status Bar */}
      <div style={{ background: bgDeep, borderTop: borderCard, padding: "3px 14px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: textDim, paddingRight: 12, borderRight: "1px solid rgba(255,255,255,0.1)" }}>rescribe.io</span>
        <span style={{ fontSize: 11, color: textDim, marginLeft: "auto" }}>{user?.name}</span>
      </div>
    </div>
  );
}
