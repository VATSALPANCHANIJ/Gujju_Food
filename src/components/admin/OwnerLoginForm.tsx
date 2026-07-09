"use client";

import React, { useState } from "react";

export default function OwnerLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        // Full navigation so the HttpOnly cookie is sent and middleware allows it.
        window.location.href = data.redirect || "/owner/dashboard";
        return;
      }
      setError(data.message || "Invalid credentials.");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} autoComplete="off">
      <div className="ov-field">
        <label htmlFor="ov-user">Owner ID</label>
        <input id="ov-user" className="ov-input" value={username} autoComplete="off"
          onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="ov-field">
        <label htmlFor="ov-pass">Password</label>
        <input id="ov-pass" className="ov-input" type="password" value={password} autoComplete="off"
          onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="ov-field">
        <label htmlFor="ov-pin">PIN <span style={{ color: "var(--ov-muted)", fontWeight: 400 }}>(if enabled)</span></label>
        <input id="ov-pin" className="ov-input" type="password" inputMode="numeric" maxLength={6} value={pin}
          autoComplete="off" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
      </div>

      {error && <p className="ov-error">{error}</p>}

      <button type="submit" className="ov-btn ov-btn-primary" disabled={loading}>
        {loading ? <><span className="ov-spinner" /> Verifying…</> : "Enter Dashboard"}
      </button>
    </form>
  );
}
