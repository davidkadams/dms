"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import {
  bgPrimary, bgCard, bgDeep,
  textPrimary, textMuted, textLabel,
  accentRed, borderCard,
  btnPrimary, btnDisabled, selectStyle,
} from "../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/users`)
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => { setError("Could not reach the server."); setLoading(false); });
  }, []);

  const handleLogin = () => {
    const user = users.find((u) => u.id === selectedId);
    if (!user) return;
    login(user);
    router.push("/dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: bgPrimary,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 4 }}>📄</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary, letterSpacing: -0.5 }}>
          rescribe.io
        </div>
        <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
          Document automation platform
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: bgCard,
        border: borderCard,
        borderRadius: 4,
        padding: "28px 32px",
        width: 320,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 16 }}>
          Select your account
        </div>

        {loading && (
          <div style={{ fontSize: 12, color: textMuted }}>Loading users...</div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: accentRed }}>{error}</div>
        )}

        {!loading && !error && (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{ ...selectStyle, width: "100%", padding: "7px 10px", fontSize: 12, marginBottom: 16 }}
            >
              <option value="">— choose a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleLogin}
              disabled={!selectedId}
              style={{ ...(selectedId ? btnPrimary : btnDisabled), width: "100%", padding: "8px", fontSize: 12 }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
