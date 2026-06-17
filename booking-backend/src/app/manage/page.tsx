"use client";

// /manage?token=...  — customer self-service (no login).
// Reschedule date/time, change guest count, or cancel.

import React, { useCallback, useEffect, useState } from "react";
import { bookingDateBounds, GUEST_RANGES } from "@/lib/booking/validation";
import { GUEST_LABELS, type Booking } from "@/lib/booking/types";
import "@/components/Booking/booking.css";

export default function ManagePage() {
  const [token, setToken] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const { min, max } = bookingDateBounds();

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
  }, []);

  const load = useCallback(async (t: string) => {
    setStatus("loading");
    const res = await fetch(`/api/bookings/manage?token=${encodeURIComponent(t)}`);
    if (!res.ok) { setStatus("error"); return; }
    const data = await res.json();
    setBooking(data.booking);
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (token) load(token);
    else if (token === null) {/* still resolving */}
  }, [token, load]);

  const update = async (patch: Record<string, string>) => {
    if (!token) return;
    const res = await fetch(`/api/bookings/manage?token=${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setBooking(data.booking); setMessage("Reservation updated."); }
    else setMessage(data.message || "Update failed.");
  };

  const cancel = async () => {
    if (!token || !confirm("Cancel this reservation?")) return;
    const res = await fetch(`/api/bookings/manage?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setBooking(data.booking); setMessage("Reservation cancelled."); }
  };

  if (status === "loading") return <div className="bk-manage"><p>Loading your reservation…</p></div>;
  if (status === "error" || !booking)
    return <div className="bk-manage"><h1>Reservation not found</h1><p>This link is invalid or expired.</p></div>;

  return (
    <div className="bk-manage">
      <h1>Manage Your Reservation</h1>
      <p className="bk-manage-ref">Reference <strong>{booking.booking_reference}</strong> · Status: {booking.status}</p>

      {message && <p className="bk-manage-msg">{message}</p>}

      {booking.status === "cancelled" ? (
        <p>This reservation has been cancelled.</p>
      ) : (
        <div className="bk-manage-grid">
          <label>Date
            <input type="date" min={min} max={max} defaultValue={booking.booking_date}
              onChange={(e) => update({ date: e.target.value })} />
          </label>
          <label>Time
            <input type="time" defaultValue={booking.booking_time}
              onChange={(e) => update({ time: e.target.value })} />
          </label>
          <label>Guests
            <select defaultValue={booking.guests} onChange={(e) => update({ guests: e.target.value })}>
              {GUEST_RANGES.map((g) => <option key={g} value={g}>{GUEST_LABELS[g]} Guests</option>)}
            </select>
          </label>
          <button className="bk-btn-ghost" onClick={cancel}>Cancel Reservation</button>
        </div>
      )}
    </div>
  );
}
