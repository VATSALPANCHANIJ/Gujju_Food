"use client";

import React, { useEffect, useRef, useState } from "react";

/* period → icon */
type Period = "evening" | "night" | "late";

const ICON = {
  sunset:
    "M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 2v4M4.5 8.5 6 10m13.5-1.5L18 10M2 13h2m18 0h-2M9 22h6",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  // crescent moon + sparkle dots (zero-length round-cap segments render as stars)
  stars: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z M5 5h0 M4 9h0 M7.5 3.5h0",
  caret: "M6 9l6 6 6-6",
  check: "M5 13l4 4 10-12",
};

function periodOf(time: string): Period {
  const h = parseInt(time.split(":")[0] || "0", 10);
  if (h >= 17 && h < 20) return "evening"; // 5:00 PM – 7:30 PM
  if (h >= 20) return "night"; // 8:00 PM – 11:30 PM
  return "late"; // 12:00 AM – 1:00 AM
}
function periodIcon(p: Period): string {
  if (p === "evening") return ICON.sunset;
  if (p === "late") return ICON.stars;
  return ICON.moon;
}
function label12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

// Operating hours: 5:00 PM → 1:00 AM.
const GROUPS: { period: Period; title: string; times: string[] }[] = [
  { period: "evening", title: "Evening", times: ["17:00","17:30","18:00","18:30","19:00","19:30"] },
  { period: "night", title: "Night", times: ["20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30"] },
  { period: "late", title: "Late Night", times: ["00:00","00:30","01:00"] },
];

function Svg({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

interface Props {
  value: string;
  onChange: (time: string) => void;
  error?: boolean;
  id?: string;
}

export default function TimePicker({ value, onChange, error, id }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Scroll the selected option into view when opening.
  useEffect(() => {
    if (open && listRef.current) {
      const sel = listRef.current.querySelector<HTMLElement>(".bk-time-opt.is-selected");
      if (sel) sel.scrollIntoView({ block: "center" });
    }
  }, [open]);

  const icon = value ? periodIcon(periodOf(value)) : ICON.sunset;

  return (
    <div className="bk-time" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`bk-input bk-time-trigger ${error ? "is-error" : ""} ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Svg d={icon} className="bk-input-icon" />
        <span className={`bk-time-value ${value ? "" : "is-placeholder"}`}>
          {value ? label12(value) : "Select time"}
        </span>
        <Svg d={ICON.caret} className="bk-select-caret" />
      </button>

      {/* data-lenis-prevent: let this list scroll natively (mouse wheel / touch)
          instead of Lenis hijacking the wheel for the page. */}
      <div
        className={`bk-time-pop ${open ? "is-open" : ""}`}
        role="listbox"
        ref={listRef}
        data-lenis-prevent
      >
        {GROUPS.map((g) => (
          <div className="bk-time-group" key={g.period}>
            <div className="bk-time-head">
              <Svg d={periodIcon(g.period)} className="bk-time-head-ic" />
              {g.title}
            </div>
            {g.times.map((t) => {
              const selected = value === t;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  key={t}
                  className={`bk-time-opt ${selected ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                >
                  <span>{label12(t)}</span>
                  {selected && <Svg d={ICON.check} className="bk-time-check" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
