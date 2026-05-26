"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

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
      background: "#f0eeeb",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 4 }}>📄</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e", letterSpacing: -0.5 }}>
          rescribe.io
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          Document automation platform
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: "#fff",
        border: "1px solid #c8c4be",
        borderRadius: 4,
        padding: "28px 32px",
        width: 320,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1020", marginBottom: 16 }}>
          Select your account
        </div>

        {loading && (
          <div style={{ fontSize: 12, color: "#888" }}>Loading users...</div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "#c0392b" }}>{error}</div>
        )}

        {!loading && !error && (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: 12,
                border: "1px solid #c8c4be",
                borderRadius: 2,
                background: "#fafafa",
                color: "#1a1020",
                marginBottom: 16,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
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
              style={{
                width: "100%",
                padding: "8px",
                background: selectedId ? "#1a1a2e" : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 600,
                cursor: selectedId ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
