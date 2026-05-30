"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const inputStyle = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 12,
  border: "1px solid #c8c4be",
  borderRadius: 2,
  background: "#fafafa",
  color: "#1a1020",
  marginBottom: 12,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const btnStyle = (disabled) => ({
  width: "100%",
  padding: "8px",
  background: disabled ? "#ccc" : "#1a1a2e",
  color: "#fff",
  border: "none",
  borderRadius: 2,
  fontSize: 12,
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
  marginTop: 4,
});

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
    const body = mode === "login"
      ? { email, password }
      : { email, password, name };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
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

  const ready = mode === "login"
    ? email && password
    : email && password && name;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0eeeb",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 4 }}>📄</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e", letterSpacing: -0.5 }}>
          rescribe.io
        </div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
          Document automation platform
        </div>
      </div>

      <div style={{
        background: "#fff",
        border: "1px solid #c8c4be",
        borderRadius: 4,
        padding: "28px 32px",
        width: 320,
      }}>
        <div style={{ display: "flex", marginBottom: 20, borderBottom: "1px solid #e8e4de" }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              style={{
                flex: 1,
                padding: "6px 0",
                background: "none",
                border: "none",
                borderBottom: mode === m ? "2px solid #1a1a2e" : "2px solid transparent",
                fontSize: 12,
                fontWeight: mode === m ? 600 : 400,
                color: mode === m ? "#1a1a2e" : "#888",
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
            style={inputStyle}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && ready && handleSubmit()}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && ready && handleSubmit()}
        />

        {error && (
          <div style={{ fontSize: 11, color: "#c0392b", marginBottom: 8 }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!ready || loading}
          style={btnStyle(!ready || loading)}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
      </div>
    </div>
  );
}
