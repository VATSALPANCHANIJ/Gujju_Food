"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  GUEST_LABELS,
  MEAL_LABELS,
  OCCASION_LABELS,
  type BookingResult,
} from "@/lib/booking/types";

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default function BookingSuccess({
  result,
  onReset,
}: {
  result: BookingResult;
  onReset: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".bk-ok-ring", { scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "back.out(1.7)" })
        .from(".bk-ok-check", { autoAlpha: 0, scale: 0.5, duration: 0.45, ease: "back.out(2)" }, "-=0.2")
        .from(".bk-success-head > *", { y: 22, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.1")
        .from(".bk-detail", { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.2")
        .from(".bk-success-actions > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, "-=0.15");
    }, root);
    return () => ctx.revert();
  }, []);

  const details: { label: string; value: string }[] = [
    { label: "Date", value: formatDate(result.booking_date) },
    { label: "Time", value: formatTime(result.booking_time) },
    { label: "Guests", value: `${GUEST_LABELS[result.guests]} Guests` },
    { label: "Meal", value: MEAL_LABELS[result.meal_type] },
  ];
  if (result.occasion) {
    details.push({ label: "Occasion", value: OCCASION_LABELS[result.occasion] });
  }

  return (
    <div className="bk-success" ref={root}>
      <div className="bk-ok">
        <span className="bk-ok-ring" />
        <svg className="bk-ok-check" viewBox="0 0 52 52" aria-hidden="true">
          <path d="M14 27l8 8 16-18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="bk-success-head">
        <p className="bk-eyebrow"><span className="bk-eyebrow-mark">❖</span> Reservation Confirmed <span className="bk-eyebrow-mark">❖</span></p>
        <h2 className="bk-title">Table Reserved</h2>
        <p className="bk-subtitle">We look forward to welcoming you, {result.name.split(" ")[0]}.</p>
        <p className="bk-reference">
          Booking Reference <strong>{result.booking_reference}</strong>
        </p>
      </div>

      <div className="bk-details">
        {details.map((d) => (
          <div className="bk-detail" key={d.label}>
            <span className="bk-detail-label">{d.label}</span>
            <span className="bk-detail-value">{d.value}</span>
          </div>
        ))}
      </div>

      {result.preview && (
        <p className="bk-preview-note">
          Preview mode — this reservation was not saved. Connect Supabase to go live.
        </p>
      )}

      <div className="bk-success-actions">
        {result.manage_url && (
          <a className="bk-btn-ghost" href={result.manage_url}>Manage Booking</a>
        )}
        <button type="button" className="bk-btn-ghost" onClick={onReset}>
          Make Another Booking
        </button>
      </div>
    </div>
  );
}
