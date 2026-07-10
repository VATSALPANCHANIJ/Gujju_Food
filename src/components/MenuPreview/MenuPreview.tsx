"use client";

// Home-page menu preview. Renders one card per entry in `menuPreview`, loading
// each product image from public/assets/Menu-Section/ via next/image.
//
// Image rules honoured here:
//  • ONLY images from that folder are used — paths come straight from the data.
//  • No placeholders, no external URLs, no generated/dummy images.
//  • If a file is missing (or fails to load), the card shows a clean fallback
//    plate (monogram + utensils) so the grid layout never breaks.
//  • next/image → lazy-loaded, optimised, aspect-ratio preserved via `fill`.

import React, { useState } from "react";
import Image from "next/image";
import { menuPreview, type MenuPreviewItem } from "@/data/menu-preview";
import "./menu-preview.css";

// A small, brand-aligned palette cycled across the cards (teal → saffron →
// deep-teal → warm) so the grid reads vibrant like the reference without
// hard-coding a colour per dish.
const THEMES = ["mp-t-teal", "mp-t-gold", "mp-t-deep", "mp-t-warm"] as const;

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MenuCard({ item, theme }: { item: MenuPreviewItem; theme: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <article className={`mp-card ${theme}`}>
      <button type="button" className="mp-order" aria-label={`Order ${item.name}`}>
        Order Now
      </button>

      <div className="mp-plate">
        {!failed ? (
          <Image
            className="mp-img"
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 600px) 80vw, (max-width: 960px) 40vw, 300px"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          // Clean fallback — no broken image, no external/dummy asset.
          <div className="mp-fallback" role="img" aria-label={`${item.name} image coming soon`}>
            <span className="mp-fallback-mono">{initials(item.name)}</span>
            <svg viewBox="0 0 24 24" className="mp-fallback-icon" aria-hidden="true">
              <path
                d="M6 3v7a2 2 0 0 0 2 2v9M6 3v0m3 0v9m0-9v0M8 3v9M17 3c-1.5 1-2 3-2 6s.5 4 2 5v7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="mp-body">
        <span className="mp-cat">{item.category}</span>
        <h3 className="mp-name">{item.name}</h3>
        <p className="mp-desc">{item.description}</p>
        <div className="mp-foot">
          <span className="mp-price">{item.price}</span>
          <span className="mp-dot" aria-hidden="true" />
          <span className="mp-avail">Available today</span>
        </div>
      </div>
    </article>
  );
}

export default function MenuPreview() {
  return (
    <section className="mp-section" id="menu-preview" aria-labelledby="mp-heading">
      <div className="mp-head">
        <span className="mp-eyebrow">Our Menu</span>
        <h2 id="mp-heading" className="mp-title">
          Signature Street Flavours
        </h2>
        <p className="mp-sub">
          Handcrafted Gujarati favourites — from buttery pav bhaji to chilled royal falooda.
        </p>
      </div>

      <div className="mp-grid">
        {menuPreview.map((item, i) => (
          <MenuCard key={item.id} item={item} theme={THEMES[i % THEMES.length]} />
        ))}
      </div>
    </section>
  );
}
