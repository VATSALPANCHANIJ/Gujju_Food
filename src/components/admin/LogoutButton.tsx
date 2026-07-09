"use client";

import React from "react";

export default function LogoutButton() {
  const logout = async () => {
    try {
      await fetch("/api/owner/logout", { method: "POST" });
    } finally {
      // replace() so the back button cannot return to the dashboard after logout.
      window.location.replace("/owner/login");
    }
  };
  return (
    <button type="button" className="ov-btn ov-btn-ghost" onClick={logout}>
      Logout
    </button>
  );
}
