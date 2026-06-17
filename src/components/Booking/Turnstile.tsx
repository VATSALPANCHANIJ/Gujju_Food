"use client";

import React, { useEffect, useRef } from "react";

// Lightweight Cloudflare Turnstile wrapper.
// - If NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, it loads and renders the real widget.
// - Otherwise it shows a branded placeholder so the form is reviewable pre-keys.
// No dependency on any Turnstile npm package — uses the official script.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";

export function TurnstileBox({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;

    const render = () => {
      if (!window.turnstile || !ref.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        theme: "light",
        callback: (token: string) => onVerify(token),
        "error-callback": () => onVerify(""),
        "expired-callback": () => onVerify(""),
      });
    };

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      window.onTurnstileLoad = render;
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    } else {
      window.onTurnstileLoad = render;
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onVerify]);

  if (SITE_KEY) {
    return <div className="bk-turnstile" ref={ref} />;
  }

  // Placeholder (matches the reference) until the Turnstile key is added.
  return (
    <div className="bk-turnstile-ph" aria-hidden="true">
      <span className="bk-turnstile-check" />
      <div className="bk-turnstile-meta">
        <strong>Cloudflare Turnstile</strong>
        <span>Privacy • Terms</span>
      </div>
      <svg viewBox="0 0 24 24" className="bk-turnstile-logo" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 15a4 4 0 0 1 .9-7.9A5 5 0 0 1 15 7a3.5 3.5 0 0 1 1 6.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
