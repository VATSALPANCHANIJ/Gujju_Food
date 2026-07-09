"use client";

import React, { useState } from "react";
import OwnerLoginForm from "./OwnerLoginForm";
import "./admin.css";

// A tiny, low-opacity lock in the site footer. Only the owner knows it opens a
// private login. It does NOT link to any discoverable /admin URL.
export default function FooterLock() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="gfh-footer-lock">
        <button
          type="button"
          className="gfh-lock-btn"
          aria-label="Staff access"
          title=""
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="ov-root">
          <div className="ov-modal-overlay" onClick={() => setOpen(false)}>
            <div
              className="ov-login-card"
              style={{ position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ov-drawer-close"
                style={{ position: "absolute", top: 16, right: 16 }}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="ov-login-lock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
              <h1>Owner Access</h1>
              <p className="ov-login-sub">Authorised staff only.</p>
              <OwnerLoginForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
