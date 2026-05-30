"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";
import {
  bgPrimary, bgCard, borderCard,
  textPrimary, textMuted, textLabel,
  accentRed, btnPrimary, btnDisabled, inputStyle,
} from "../theme";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const normalizeDetail = (detail, fallback) =>
  Array.isArray(detail) ? detail.map((e) => e.msg).join(", ") : (detail || fallback);

export default function LoginPage() {
  const { login } = useUser();
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(normalizeDetail(data.detail, "Something went wrong."));
        setLoading(false);
        return;
      }
      login(data.user, data.access_token);
      router.push("/dashboard");
    } catch {
      setError("Could not reach the server.");
      setLoading(false);
    }
  };

  const ready = mode === "login" ? email && password : email && password && name;

  return (
    <div style={{
      minHeight: "100vh",
      background: bgPrimary,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 4 }}>📄</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: textPrimary, letterSpacing: -0.5 }}>
          rescribe.io
        </div>
        <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
          Document automation platform
        </div>
      </div>

      <div style={{
        background: bgCard,
        border: borderCard,
        borderRadius: 4,
        padding: "28px 32px",
        width: 320,
      }}>
        <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1,
                padding: "6px 0",
                background: "none",
                border: "none",
                borderBottom: mode === m ? `2px solid ${textPrimary}` : "2px solid transparent",
                fontSize: 12,
                fontWeight: mode === m ? 600 : 400,
                color: mode === m ? textPrimary : textLabel,
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
                marginBottom: -1,
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12, marginBottom: 12 }}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12, marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && ready && handleSubmit()}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, width: "100%", padding: "7px 10px", fontSize: 12, marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && ready && handleSubmit()}
        />

        {error && (
          <div style={{ fontSize: 11, color: accentRed, marginBottom: 8 }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!ready || loading}
          style={{ ...(!ready || loading ? btnDisabled : btnPrimary), width: "100%", padding: "8px", fontSize: 12, marginTop: 4 }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
      </div>
    </div>
  );
}
