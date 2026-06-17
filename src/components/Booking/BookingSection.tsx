"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BookingForm from "./BookingForm";
import BookingSuccess from "./BookingSuccess";
import type { BookingResult } from "@/lib/booking/types";
import "./booking.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function BookingSection() {
  const root = useRef<HTMLElement>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [imgOk, setImgOk] = useState(true);

  // Entrance reveal — the panel rises and the visual settles in.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".bk-panel", {
        y: 60,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 78%" },
      });
      gsap.from(".bk-visual", {
        y: 40,
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 78%" },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="gfh-booking" id="reserve">
      <div className="bk-inner">
        {/* LEFT — reservation form / success */}
        <div className="bk-panel">
          {result ? (
            <BookingSuccess result={result} onReset={() => setResult(null)} />
          ) : (
            <BookingForm onSuccess={setResult} />
          )}
        </div>

        {/* RIGHT — premium restaurant visual */}
        <div className="bk-visual">
          {imgOk ? (
            <img
              className="bk-visual-img"
              src={`${BASE_PATH}/assets/Booking/Image/Restaurants_Image.png`}
              alt="The Gujju Food Hub dining room — colourful Gujarati decor and warm hospitality"
              ref={(el) => {
                // A missing image can finish (404) before React binds onError —
                // detect the already-failed case so the fallback still shows.
                if (el && el.complete && el.naturalWidth === 0) setImgOk(false);
              }}
              onError={() => setImgOk(false)}
            />
          ) : (
            // Graceful, on-brand fallback until a real interior photo is added.
            <div className="bk-visual-fallback" aria-hidden="true">
              <span className="bk-visual-mandala" />
              <span className="bk-visual-glow" />
            </div>
          )}

          <div className="bk-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z" strokeLinejoin="round" />
            </svg>
            <span>Reserve Now<br />Your Table</span>
          </div>

          <div className="bk-welcome">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="bk-welcome-ic" aria-hidden="true">
              <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.7 0-5 1.3-5 3.5V19h7M16 13c2.7 0 5 1.3 5 3.5V19h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <strong>We can&apos;t wait to welcome you!</strong>
            <span>Experience the authentic taste of Gujarat.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
