"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GUEST_LABELS,
  MEAL_LABELS,
  OCCASION_LABELS,
  type Booking,
  type BookingStatus,
} from "@/lib/booking/types";

// Deliberately simple — an owner should understand it in under 2 minutes.
// No charts, no analytics. Reads/writes via /api/admin/bookings using a shared
// access token (kept in localStorage). Portable & dependency-free.

const NEXT_ACTION: Partial<Record<BookingStatus, { label: string; to: BookingStatus }[]>> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled" },
  ],
  confirmed: [
    { label: "Mark Arrived", to: "arrived" },
    { label: "Cancel", to: "cancelled" },
  ],
  arrived: [{ label: "Mark Completed", to: "completed" }],
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function BookingAdminTable() {
  const [token, setToken] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("gfh_admin_token") : "";
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        headers: { "x-admin-token": t },
      });
      if (res.status === 401) throw new Error("Invalid access token.");
      if (!res.ok) throw new Error("Could not load reservations.");
      const data = await res.json();
      setBookings(data.bookings || []);
      localStorage.setItem("gfh_admin_token", t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) load(token);
  }, [token, load]);

  const act = async (id: string, to: BookingStatus) => {
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id, status: to }),
    });
    if (res.ok) load(token);
  };

  const t = todayISO();
  const stats = useMemo(() => {
    const today = bookings.filter((b) => b.booking_date === t && b.status !== "cancelled");
    const upcoming = bookings.filter((b) => b.booking_date > t && b.status !== "cancelled");
    const past = bookings.filter((b) => b.status === "completed");
    return { today: today.length, upcoming: upcoming.length, past: past.length, total: bookings.length };
  }, [bookings, t]);

  if (!token) {
    return (
      <div className="bk-admin-gate">
        <h2>Admin Access</h2>
        <p>Enter the access token to view reservations.</p>
        <AdminTokenForm onSubmit={setToken} />
      </div>
    );
  }

  return (
    <div className="bk-admin">
      <header className="bk-admin-head">
        <h1>Reservations</h1>
        <button className="bk-admin-refresh" onClick={() => load(token)} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </header>

      <div className="bk-admin-stats">
        <Stat label="Today's Reservations" value={stats.today} />
        <Stat label="Upcoming" value={stats.upcoming} />
        <Stat label="Past Customers" value={stats.past} />
        <Stat label="Total Reservations" value={stats.total} />
      </div>

      {error && <p className="bk-admin-error">{error}</p>}

      <div className="bk-admin-table-wrap">
        <table className="bk-admin-table">
          <thead>
            <tr>
              <th>Date</th><th>Time</th><th>Customer</th><th>Phone</th>
              <th>Guests</th><th>Meal</th><th>Occasion</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && !loading && (
              <tr><td colSpan={9} className="bk-admin-empty">No reservations yet.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.booking_date}</td>
                <td>{b.booking_time}</td>
                <td>{b.name}</td>
                <td>{b.phone}</td>
                <td>{GUEST_LABELS[b.guests]}</td>
                <td>{MEAL_LABELS[b.meal_type]}</td>
                <td>{b.occasion ? OCCASION_LABELS[b.occasion] : "—"}</td>
                <td><span className={`bk-status bk-status-${b.status}`}>{b.status}</span></td>
                <td>
                  <div className="bk-admin-actions">
                    {(NEXT_ACTION[b.status] || []).map((a) => (
                      <button key={a.to} onClick={() => act(b.id, a.to)}>{a.label}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bk-admin-stat">
      <span className="bk-admin-stat-value">{value}</span>
      <span className="bk-admin-stat-label">{label}</span>
    </div>
  );
}

function AdminTokenForm({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="bk-admin-token"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v.trim());
      }}
    >
      <input type="password" placeholder="Access token" value={v} onChange={(e) => setV(e.target.value)} />
      <button type="submit">Enter</button>
    </form>
  );
}
