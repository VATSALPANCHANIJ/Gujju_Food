"use client";

// MenuSection — premium, reusable home-page menu.
// • Background: public/assets/Menu-Section/Menu_Section_Background.png (cover).
// • Category filter pills, 5/3/1-column responsive grid, luxury light cards.
// • Motion is CSS-only (fade-up + stagger) toggled by an IntersectionObserver —
//   no animation library added. Product images load lazily via next/image and
//   fall back to an elegant cream plate if a file is missing.

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { menuPreview, type MenuPreviewItem } from "@/data/menu-preview";
import styles from "./MenuSection.module.css";

// Prefixes public asset paths on GitHub Pages (e.g. /Gujju_Food). Empty in dev.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const BG_URL = `${BASE_PATH}/assets/Menu-Section/Menu_Section_Background.png`;

// Filter order mirrors the reference. "All" first, then the categories present.
const CATEGORIES = ["All", "Street Food", "Snacks", "Falooda", "Desserts", "Beverages"] as const;

function MenuCard({ item, index }: { item: MenuPreviewItem; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <article className={styles.card} style={{ ["--i" as string]: index }}>
      <div className={styles.imageWrap}>
        <span className={styles.badge}>{item.category}</span>
        {!failed ? (
          <Image
            className={styles.image}
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1180px) 33vw, 20vw"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className={styles.fallback} role="img" aria-label={`${item.name} — image coming soon`}>
            {item.name}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.cat}>{item.category}</span>
        <h3 className={styles.name}>{item.name}</h3>
        <p className={styles.desc}>{item.description}</p>
        <span className={styles.price}>{item.price}</span>
      </div>
    </article>
  );
}

export default function MenuSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");
  const [inView, setInView] = useState(false);

  // Reveal on first scroll into view (fade-up + card stagger via CSS).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const items = useMemo(
    () => (active === "All" ? menuPreview : menuPreview.filter((m) => m.category === active)),
    [active]
  );

  return (
    <section
      ref={sectionRef}
      id="menu"
      className={`${styles.section} ${inView ? styles.inView : ""}`}
      style={{ backgroundImage: `url("${BG_URL}")` }}
      aria-labelledby="menu-heading"
    >
      <div className={styles.container}>
        {/* Heading */}
        <header className={styles.header}>
          <span className={styles.label}>Our Menu</span>
          <h2 id="menu-heading" className={styles.title}>
            Signature Street Flavours
          </h2>
          <p className={styles.subtitle}>
            Handcrafted Gujarati favourites — from buttery pav bhaji to chilled royal falooda.
            Made with authentic recipes and the finest ingredients.
          </p>
          <div className={styles.divider} aria-hidden="true">
            <span className={styles.dividerDot}>✦</span>
          </div>
        </header>

        {/* Category pills */}
        <div className={styles.pills} role="tablist" aria-label="Menu categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active === cat}
              className={`${styles.pill} ${active === cat ? styles.pillActive : ""}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid — keyed on category so a filter change re-triggers the
            stagger reveal. */}
        <div className={styles.grid} key={active}>
          {items.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* View full menu → the animated menu book lives on its own page */}
        <div className={styles.footer}>
          <Link href="/menu" className={styles.button}>
            View Full Menu
            <span className={styles.buttonArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
