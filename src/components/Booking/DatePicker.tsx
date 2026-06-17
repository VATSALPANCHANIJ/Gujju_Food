"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const ICON = {
  calendar:
    "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z",
  prev: "M15 6l-6 6 6 6",
  next: "M9 6l6 6-6 6",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m is 0-indexed
function todayISO() {
  const d = new Date();
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d);
}

function Svg({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min: string;
  max: string;
  error?: boolean;
  id?: string;
}

export default function DatePicker({ value, onChange, min, max, error, id }: Props) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Month currently shown — defaults to the selected date's month, else min's.
  const initial = parseISO(value || min) || new Date();
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const today = todayISO();

  const monthLabel = useMemo(
    () => new Date(view.y, view.m, 1).toLocaleDateString("en-AU", { month: "long", year: "numeric" }),
    [view]
  );

  // Build the 6-week grid (leading blanks + days).
  const cells = useMemo(() => {
    const firstDow = new Date(view.y, view.m, 1).getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const out: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(iso(view.y, view.m, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [view]);

  // Limit navigation to months that intersect the [min, max] window.
  const minD = parseISO(min)!;
  const maxD = parseISO(max)!;
  const canPrev = new Date(view.y, view.m, 1) > new Date(minD.getFullYear(), minD.getMonth(), 1);
  const canNext = new Date(view.y, view.m, 1) < new Date(maxD.getFullYear(), maxD.getMonth(), 1);

  const go = (delta: 1 | -1) => {
    setDir(delta);
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const triggerLabel = value
    ? parseISO(value)!.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "Select date";

  return (
    <div className="bk-cal" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`bk-input bk-cal-trigger ${error ? "is-error" : ""} ${open ? "is-open" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Svg d={ICON.calendar} className="bk-input-icon" />
        <span className={`bk-cal-value ${value ? "" : "is-placeholder"}`}>{triggerLabel}</span>
      </button>

      <div className={`bk-cal-pop ${open ? "is-open" : ""}`} role="dialog" aria-label="Choose a date">
        <div className="bk-cal-header">
          <button type="button" className="bk-cal-nav" onClick={() => go(-1)} disabled={!canPrev} aria-label="Previous month">
            <Svg d={ICON.prev} />
          </button>
          <span className="bk-cal-month">{monthLabel}</span>
          <button type="button" className="bk-cal-nav" onClick={() => go(1)} disabled={!canNext} aria-label="Next month">
            <Svg d={ICON.next} />
          </button>
        </div>

        <div className="bk-cal-weekdays">
          {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
        </div>

        <div
          className={`bk-cal-grid ${dir === 1 ? "from-next" : "from-prev"}`}
          key={`${view.y}-${view.m}`}
        >
          {cells.map((cell, i) => {
            if (!cell) return <span className="bk-cal-cell is-empty" key={`e${i}`} />;
            const disabled = cell < min || cell > max;
            const isToday = cell === today;
            const selected = cell === value;
            const day = Number(cell.split("-")[2]);
            return (
              <button
                type="button"
                key={cell}
                className={`bk-cal-cell ${disabled ? "is-disabled" : ""} ${isToday ? "is-today" : ""} ${selected ? "is-selected" : ""}`}
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onChange(cell);
                  setOpen(false);
                }}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="bk-cal-foot">
          <span className="bk-cal-legend"><i className="bk-cal-dot today" /> Today</span>
          <span className="bk-cal-legend"><i className="bk-cal-dot sel" /> Selected</span>
          <span className="bk-cal-hint">Today → next 10 days</span>
        </div>
      </div>
    </div>
  );
}
