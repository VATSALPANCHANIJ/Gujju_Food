"use client";

// Reusable menu product row used inside the book pages.
// The image path is DERIVED from the product name (see imageFor) so no filename
// is hardcoded — drop files into public/assets/Menu-Section/ and they appear.
// A missing image degrades to an elegant monogram plate; the layout never breaks.

import React, { useState } from "react";
import Image from "next/image";
import { imageFor, type MenuItem } from "@/data/menu-full";
import styles from "./MenuItemCard.module.css";

function monogram(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const [failed, setFailed] = useState(false);

  return (
    <article className={styles.item}>
      <div className={styles.thumb}>
        {!failed ? (
          <Image
            className={styles.img}
            src={imageFor(item)}
            alt={item.name}
            fill
            sizes="120px"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className={styles.mono} aria-hidden="true">
            {monogram(item.name)}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.topline}>
          <h4 className={styles.name}>{item.name}</h4>
          <span className={styles.leader} aria-hidden="true" />
          <span className={styles.price}>{item.price}</span>
        </div>

        {item.description ? <p className={styles.desc}>{item.description}</p> : null}

        {item.variants ? (
          <ul className={styles.variants}>
            {item.variants.map((v) => (
              <li key={v.label}>
                <span>{v.label}</span>
                <span className={styles.variantPrice}>{v.price}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {item.note ? <p className={styles.note}>{item.note}</p> : null}
      </div>
    </article>
  );
}
