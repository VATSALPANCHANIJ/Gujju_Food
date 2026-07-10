"use client";

// WHY GUJJU FOOD HUB — premium 55/45 editorial split, between the Signature
// Gujarati Dish showcase and the Our Menu section.
//
//  • Background — the supplied artwork "Why Gujju Food Hub - BG.png", used exactly
//    as-is: cover, centred, no-repeat, not fixed, no overlay/blur/opacity change.
//  • Left  — the supplied transparent food composition, `object-fit: contain` so
//    NO dish is ever cropped, floating on a soft drop-shadow. Subtle hover lift.
//  • Right — label, serif headline, paragraph, 2-col feature grid, primary button.
//  • Entrance is GSAP + ScrollTrigger (no Framer Motion): image fades up + scales
//    0.96→1; right content fades up (200ms); features stagger (80ms); button last.

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, ArrowRight } from "lucide-react";
import styles from "./WhyGujjuFood.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Prefixes public asset paths on GitHub Pages (e.g. /Gujju_Food). Empty in dev.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (file: string) => `${BASE_PATH}/assets/Menu-Section/${encodeURIComponent(file)}`;

const BG_IMAGE = asset("Why Gujju Food Hub - BG.png");
const FOOD_IMAGE = asset("Why Gujju Food_Left Image.png");

const FEATURES: string[] = [
  "Authentic Gujarati Recipes",
  "Fresh Ingredients Every Day",
  "Made Fresh To Order",
  "Premium Quality Ingredients",
  "Family-Owned Restaurant",
  "Warm Gujarati Hospitality",
];

export default function WhyGujjuFood() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const targets = [
        `.${styles.visual}`,
        `.${styles.label}`,
        `.${styles.heading}`,
        `.${styles.lead}`,
        `.${styles.feature}`,
        `.${styles.cta}`,
      ];

      if (reduce) {
        gsap.set(targets, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: root, start: "top 74%", once: true },
      });

      // Left image — fade up + scale 0.96 → 1 over 1s.
      // Plain opacity (not autoAlpha): autoAlpha sets visibility:hidden, which
      // would stop the browser pre-fetching the lazy composition image.
      tl.fromTo(
        `.${styles.visual}`,
        { opacity: 0, y: 40, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1 },
        0
      )
        // Right content — fade up, delayed 200ms.
        .fromTo(
          [`.${styles.label}`, `.${styles.heading}`, `.${styles.lead}`],
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.2
        )
        // Feature items — stagger 80ms.
        .fromTo(
          `.${styles.feature}`,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.55, stagger: 0.08 },
          0.5
        )
        // Button — last, delayed ~600ms.
        .fromTo(
          `.${styles.cta}`,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          0.6
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      id="why-gujju-food"
      aria-labelledby="why-heading"
      style={{ ["--why-bg" as string]: `url("${BG_IMAGE}")` }}
    >
      <div className={styles.inner}>
        {/* ---------------------------------------------------------- LEFT */}
        <div className={styles.visual}>
          <div className={styles.frame}>
            <Image
              className={styles.image}
              src={FOOD_IMAGE}
              alt="A full spread of Gujarati dishes — pani puri, dal, chhole, puri, bhaji, biryani and more"
              width={1418}
              height={1109}
              sizes="(max-width: 1024px) 92vw, 55vw"
              priority={false}
            />
          </div>
        </div>

        {/* --------------------------------------------------------- RIGHT */}
        <div className={styles.content}>
          <span className={styles.label}>Why Gujju Food Hub</span>

          <h2 id="why-heading" className={styles.heading}>
            Authentic Gujarati Flavours,
            <br />
            Crafted Fresh in Hobart.
          </h2>

          <p className={styles.lead}>
            Every dish is prepared using authentic Gujarati recipes, fresh ingredients, and
            traditional cooking methods, bringing the real taste of Gujarat to Tasmania.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((label) => (
              <li key={label} className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden="true">
                  <Check size={16} strokeWidth={2.4} />
                </span>
                <span className={styles.featureText}>{label}</span>
              </li>
            ))}
          </ul>

          <div className={styles.cta}>
            <Link href="/menu" className={styles.button}>
              Explore Our Menu
              <ArrowRight size={17} strokeWidth={2} className={styles.buttonArrow} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
