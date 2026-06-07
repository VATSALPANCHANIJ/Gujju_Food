"use client";

import React from "react";

interface TextOverlayProps {
  progress: number;
}

// Smooth trapezoidal envelope: 0 before `start`, ramps to 1 by `inEnd`,
// holds, then ramps back to 0 by `end`. Driven directly by scroll progress
// so beats flow continuously instead of toggling on/off.
function envelope(p: number, start: number, inEnd: number, outStart: number, end: number) {
  if (p <= start || p >= end) return 0;
  if (p < inEnd) return (p - start) / (inEnd - start);
  if (p > outStart) return 1 - (p - outStart) / (end - outStart);
  return 1;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Beat {
  tag: string;
  name: string;
  sub: string;
  start: number;
  inEnd: number;
  outStart: number;
  end: number;
}

const BEATS: Beat[] = [
  { tag: "01 — ORIGIN", name: "India", sub: "Gujarat — where every flavour begins.", start: -0.06, inEnd: 0.0, outStart: 0.14, end: 0.2 },
  { tag: "02 — THE JOURNEY", name: "Across the Ocean", sub: "Carrying tradition over continents.", start: 0.22, inEnd: 0.28, outStart: 0.4, end: 0.46 },
  { tag: "03 — A NEW SHORE", name: "Australia", sub: "A land that welcomed the spice road.", start: 0.5, inEnd: 0.55, outStart: 0.62, end: 0.67 },
  { tag: "04 — THE ISLAND", name: "Tasmania", sub: "Wild coastlines, the journey's end in sight.", start: 0.67, inEnd: 0.71, outStart: 0.77, end: 0.81 },
  { tag: "05 — HOME", name: "Hobart", sub: "Where Gujarat finds a new table.", start: 0.83, inEnd: 0.87, outStart: 0.91, end: 0.94 },
];

export default function TextOverlay({ progress }: TextOverlayProps) {
  // Route arc draws across the globe apex.
  const routeRaw = envelope(progress, 0.34, 0.42, 0.46, 0.5);
  const routeDraw = Math.min(1, Math.max(0, (progress - 0.34) / (0.46 - 0.34)));
  const pathLength = 1000;

  // Brand reveal hand-off.
  const revealT = easeOut(Math.min(1, Math.max(0, (progress - 0.94) / 0.06)));

  return (
    <div className="hero-text-overlay-container">
      {/* KINETIC LOCATION BEATS */}
      {BEATS.map((beat) => {
        const e = easeOut(envelope(progress, beat.start, beat.inEnd, beat.outStart, beat.end));
        return (
          <div
            key={beat.name}
            className="cine-beat"
            style={{
              opacity: e,
              transform: `translateY(${(1 - e) * 36}px)`,
            }}
          >
            <span className="beat-rule" style={{ transform: `scaleX(${e})` }} />
            <span className="beat-tag">{beat.tag}</span>
            <h2 className="beat-name">{beat.name}</h2>
            <p className="beat-sub">{beat.sub}</p>
          </div>
        );
      })}

      {/* ROUTE ARC — luxury-travel line at the globe apex */}
      <svg
        className="route-layer"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: routeRaw }}
      >
        <path
          className="route-path"
          d="M 27 24 Q 55 8 82 80"
          pathLength={pathLength}
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - routeDraw)}
        />
      </svg>
      <div className="route-points" style={{ opacity: routeRaw }}>
        <span className="route-dot origin" style={{ left: "27%", top: "24%" }}>
          <span className="route-label">GUJARAT</span>
        </span>
        <span
          className="route-dot dest"
          style={{ left: "82%", top: "80%", opacity: routeDraw > 0.85 ? 1 : 0 }}
        >
          <span className="route-label">HOBART</span>
        </span>
      </div>

      {/* BRAND REVEAL — world dissolves into the brand */}
      <div
        className="brand-reveal-overlay"
        style={{ opacity: revealT, pointerEvents: revealT > 0.5 ? "auto" : "none" }}
      >
        <div className="reveal-bloom" style={{ opacity: revealT }} />
        <div className="reveal-content">
          <span className="reveal-kicker" style={{ opacity: revealT, transform: `translateY(${(1 - revealT) * 20}px)` }}>
            FROM GUJARAT, TO YOUR TABLE
          </span>
          <h2 className="reveal-logo" style={{ opacity: revealT, transform: `translateY(${(1 - revealT) * 30}px)` }}>
            GUJJU FOOD HUB
          </h2>
          <p className="reveal-tagline" style={{ opacity: revealT, transform: `translateY(${(1 - revealT) * 28}px)` }}>
            Authentic Gujarati flavours in Hobart, Tasmania
          </p>
          <div className="reveal-buttons" style={{ opacity: revealT, transform: `translateY(${(1 - revealT) * 24}px)` }}>
            <a className="btn btn-primary" href="#menu">Explore Menu</a>
            <a className="btn btn-accent" href="#book">Order Online</a>
          </div>
        </div>
      </div>
    </div>
  );
}
