"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Prefixes public asset paths on GitHub Pages (e.g. /Gujju_Food). Empty in dev.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface Product {
  id: string;
  name: string;
  price: string;
  badge: string;
  story: string;
  description: string;
  ingredients: string[];
  glow: string; // ambient glow colour (rgba) — the ONLY thing that changes per product
  accent: string; // price / highlight colour
  image: string; // file expected in public/assets/Product/
}

// Order follows the approved scroll flow: 0-20% … 80-100%.
const PRODUCTS: Product[] = [
  {
    id: "royal-faluda",
    name: "Royal Faluda",
    price: "$8.90",
    badge: "Customer Favourite",
    story: "A regal Mughlai indulgence, poured cold and crowned with kulfi.",
    description:
      "Chilled rose-kissed milk layered over silky vermicelli and basil seeds, finished with a slow-set saffron kulfi.",
    ingredients: ["Rose Petals", "Pistachios", "Almonds", "Basil Seeds", "Kulfi Ice Cream"],
    glow: "rgba(232, 93, 134, 0.55)",
    accent: "#E85D86",
    image: "royal-faluda.png",
  },
  {
    id: "vada-pav",
    name: "Vada Pav",
    price: "$6.50",
    badge: "Best Seller",
    story: "Mumbai's iconic street bite, fried to order and built for craving.",
    description:
      "A spiced potato vada in a golden gram crust, pressed into soft pav with garlic chutney and a fried chilli.",
    ingredients: ["Green Chilli", "Garlic", "Potato", "Pav"],
    glow: "rgba(255, 136, 17, 0.50)",
    accent: "#FF8811",
    image: "vada-pav.png",
  },
  {
    id: "jalebi-fafda",
    name: "Jalebi Fafda",
    price: "$9.50",
    badge: "Most Popular",
    story: "The Gujarati weekend ritual — sweet spirals beside savoury crisp.",
    description:
      "Warm syrup-soaked jalebi coiled fresh, served with crisp gram-flour fafda and a fried green chilli.",
    ingredients: ["Jalebi Spiral", "Fafda Pieces", "Fried Chilli"],
    glow: "rgba(244, 208, 111, 0.62)",
    accent: "#E0A93B",
    image: "jalebi-fafda.png",
  },
  {
    id: "samosa",
    name: "Samosa",
    price: "$5.50",
    badge: "Best Seller",
    story: "The everyday classic, folded by hand and fried golden.",
    description:
      "A flaky pastry parcel packed with spiced potato and peas, sealed by hand and fried to a deep crackling gold.",
    ingredients: ["Potato Filling", "Coriander", "Spice Elements"],
    glow: "rgba(200, 110, 45, 0.52)",
    accent: "#C86E2D",
    image: "samosa.png",
  },
  {
    id: "pani-puri",
    name: "Pani Puri",
    price: "$7.90",
    badge: "Most Popular",
    story: "Six perfect bursts of cold, tangy, fresh — eaten one breath at a time.",
    description:
      "Crisp hollow puris filled with spiced potato, tamarind and a chilled mint water that bursts on the very first bite.",
    ingredients: ["Puri Shells", "Mint", "Tamarind"],
    glow: "rgba(63, 191, 159, 0.52)",
    accent: "#2BA7A0",
    image: "pani-puri.png",
  },
];

// Lay floating ingredient chips out on a loose ring around the product.
function chipPosition(index: number, total: number): { left: string; top: string } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2; // start at top
  const rx = 40; // horizontal radius (% of centre box)
  const ry = 38; // vertical radius
  const left = 50 + Math.cos(angle) * rx;
  const top = 50 + Math.sin(angle) * ry;
  return { left: `${left}%`, top: `${top}%` };
}

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  // Tracks images that failed to load so we fall back to the glow + monogram.
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const slides = gsap.utils.toArray<HTMLElement>(".ps-slide");

      // --- Scroll-scrubbed timeline: products arrive, hold, then exit. ---
      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=250%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(slides.length - 1, Math.floor(self.progress * slides.length));
            if (counterRef.current) {
              counterRef.current.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(
                slides.length
              ).padStart(2, "0")}`;
            }
          },
        },
      });

      slides.forEach((slide, i) => {
        const wrap = slide.querySelector<HTMLElement>(".ps-image-wrap");
        const chars = slide.querySelectorAll<HTMLElement>(".ps-char");
        const items = slide.querySelectorAll<HTMLElement>("[data-stagger]");
        const chips = slide.querySelectorAll<HTMLElement>(".ps-chip");

        const enterAt = i; // one timeline unit per product
        const exitAt = i + 0.78; // overlaps into the next product's arrival

        if (i === 0) {
          // First product is already on stage at scroll progress 0.
          gsap.set(slide, { autoAlpha: 1 });
          gsap.set(wrap, { scale: 1, yPercent: 0, filter: "blur(0px)" });
          gsap.set([...chars, ...items, ...chips], {
            autoAlpha: 1,
            y: 0,
            yPercent: 0,
            scale: 1,
            rotate: 0,
            filter: "blur(0px)",
          });
        } else {
          tl.fromTo(slide, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, enterAt)
            .fromTo(
              wrap,
              { scale: 0.85, yPercent: 8, filter: "blur(14px)" },
              { scale: 1, yPercent: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
              enterAt
            )
            .fromTo(
              chars,
              { yPercent: 115, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.025, ease: "power3.out" },
              enterAt + 0.08
            )
            .fromTo(
              items,
              { y: 28, autoAlpha: 0, filter: "blur(8px)" },
              { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.06 },
              enterAt + 0.12
            )
            .fromTo(
              chips,
              { scale: 0.5, autoAlpha: 0, rotate: -10 },
              { scale: 1, autoAlpha: 1, rotate: 0, duration: 0.6, stagger: 0.05, ease: "back.out(1.6)" },
              enterAt + 0.16
            );
        }

        if (i < slides.length - 1) {
          tl.to(slide, { autoAlpha: 0, duration: 0.45, ease: "power2.in" }, exitAt)
            .to(
              wrap,
              { scale: 1.05, yPercent: -7, filter: "blur(12px)", duration: 0.55, ease: "power2.in" },
              exitAt
            )
            .to(
              chars,
              { yPercent: -45, autoAlpha: 0, duration: 0.4, stagger: 0.02, ease: "power2.in" },
              exitAt
            )
            .to(
              items,
              { y: 22, autoAlpha: 0, filter: "blur(6px)", duration: 0.4, stagger: 0.03, ease: "power2.in" },
              exitAt
            )
            .to(
              chips,
              {
                scale: 0.7,
                autoAlpha: 0,
                x: (idx: number) => (idx % 2 ? 70 : -70),
                duration: 0.45,
                stagger: 0.03,
                ease: "power2.in",
              },
              exitAt
            );
        }
      });

      // --- Continuous "alive" motion, independent of scroll. ---
      if (!reduce) {
        slides.forEach((slide) => {
          const float = slide.querySelector<HTMLElement>(".ps-image-float");
          const glow = slide.querySelector<HTMLElement>(".ps-glow");
          if (float) {
            gsap.to(float, { yPercent: -4, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });
            gsap.to(float, {
              rotate: 1.4,
              duration: 5,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
          if (glow) {
            gsap.to(glow, {
              scale: 1.12,
              opacity: 0.85,
              duration: 4,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
          slide.querySelectorAll<HTMLElement>(".ps-chip-inner").forEach((chip, ci) => {
            gsap.to(chip, {
              y: `+=${10 + ci * 2}`,
              x: `+=${(ci % 2 ? -1 : 1) * 8}`,
              duration: 3 + ci * 0.4,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          });
        });

        // Organic wave drift, top and bottom.
        gsap.to(".ps-wave.top .ps-wave-inner", {
          xPercent: -22,
          duration: 14,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".ps-wave.bottom .ps-wave-inner", {
          xPercent: 22,
          duration: 17,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      // The Hero's text/brand-reveal overlay is position:fixed and would bleed
      // over this section. Fade it out as the showcase slides up into place
      // (and back in on the way up). Hero files stay untouched.
      const heroOverlay = document.querySelector(".hero-text-overlay-container");
      if (heroOverlay) {
        gsap.to(heroOverlay, {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top bottom",
            end: "top top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      }

      // Pin spacing depends on font/layout metrics — recompute once settled.
      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const wave = (
    <div className="ps-wave-inner">
      <svg viewBox="0 0 1440 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,64 C180,110 360,18 540,52 C720,86 900,118 1080,86 C1260,54 1350,40 1440,58 L1440,140 L0,140 Z"
          fill="url(#ps-wave-grad)"
        />
        <defs>
          <linearGradient id="ps-wave-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(43,167,160,0.10)" />
            <stop offset="50%" stopColor="rgba(244,208,111,0.14)" />
            <stop offset="100%" stopColor="rgba(255,136,17,0.10)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  return (
    <section ref={sectionRef} className="ps-section" id="signature-favourites">
      <div ref={stageRef} className="ps-stage">
        <div className="ps-wave top">{wave}</div>

        <span className="ps-eyebrow">Signature Gujarati Favourites</span>

        {PRODUCTS.map((p, i) => {
          const monogram = p.name
            .split(" ")
            .map((w) => w[0])
            .join("");
          return (
            <article
              key={p.id}
              className="ps-slide"
              style={{ ["--glow" as string]: p.glow, ["--accent" as string]: p.accent }}
            >
              <div className="ps-col ps-left">
                <span className="ps-price" data-stagger>
                  {p.price}
                </span>
                <h2 className="ps-name">
                  {p.name.split(" ").map((word, wi, arr) => (
                    <React.Fragment key={wi}>
                      <span className="ps-word">
                        {word.split("").map((ch, ci) => (
                          <span className="ps-char" key={ci}>
                            {ch === " " ? " " : ch}
                          </span>
                        ))}
                      </span>
                      {wi < arr.length - 1 ? " " : null}
                    </React.Fragment>
                  ))}
                </h2>
                <span className="ps-badge" data-stagger>
                  {p.badge}
                </span>
              </div>

              <div className="ps-center">
                <div className="ps-glow" />
                <div className="ps-image-wrap">
                  <div className="ps-image-float">
                    {!imgError[i] && (
                      <img
                        className="ps-image"
                        src={`${BASE_PATH}/assets/Product/${encodeURIComponent(p.image)}`}
                        alt={p.name}
                        ref={(el) => {
                          // A cached image can already be complete before onLoad
                          // binds — reveal it immediately so it never stays at opacity 0.
                          if (el && el.complete && el.naturalWidth > 0) {
                            el.classList.add("is-loaded");
                          }
                        }}
                        onError={() => setImgError((e) => ({ ...e, [i]: true }))}
                        onLoad={(ev) => ev.currentTarget.classList.add("is-loaded")}
                      />
                    )}
                  </div>
                </div>
                <div className="ps-floats">
                  {p.ingredients.map((ing, ci) => {
                    const pos = chipPosition(ci, p.ingredients.length);
                    return (
                      <span
                        key={ing}
                        className="ps-chip"
                        style={{ left: pos.left, top: pos.top }}
                      >
                        <span className="ps-chip-inner">{ing}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="ps-col ps-right">
                <p className="ps-story" data-stagger>
                  {p.story}
                </p>
                <p className="ps-desc" data-stagger>
                  {p.description}
                </p>
                <ul className="ps-ingredients">
                  {p.ingredients.map((ing) => (
                    <li key={ing} data-stagger>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}

      
        <div className="ps-wave bottom">{wave}</div>
      </div>
    </section>
  );
}
