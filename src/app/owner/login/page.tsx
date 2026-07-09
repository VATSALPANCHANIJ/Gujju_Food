import React from "react";
import OwnerLoginForm from "@/components/admin/OwnerLoginForm";

export const dynamic = "force-dynamic";

export default function OwnerLoginPage() {
  return (
    <div className="ov-login">
      <div className="ov-login-card">
        <div className="ov-login-lock">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1>Owner Access</h1>
        <p className="ov-login-sub">Authorised staff only — Gujju Food Hub.</p>
        <OwnerLoginForm />
      </div>
    </div>
  );
}
