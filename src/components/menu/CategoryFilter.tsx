"use client";

// Premium category filter bar. Purely presentational — the book owns the state,
// so manual page turns highlight the right pill automatically (two-way sync).

import React from "react";
import { CATEGORIES, type MenuCategory } from "@/data/menu-full";
import styles from "./CategoryFilter.module.css";

export interface CategoryFilterProps {
  /** null → the book is on the cover, so "All" is highlighted. */
  active: MenuCategory | null;
  onSelect: (category: MenuCategory | null) => void;
  disabled?: boolean;
}

export default function CategoryFilter({ active, onSelect, disabled }: CategoryFilterProps) {
  return (
    <nav className={styles.bar} aria-label="Menu categories">
      <button
        type="button"
        disabled={disabled}
        aria-current={active === null}
        className={`${styles.pill} ${active === null ? styles.active : ""}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>

      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          disabled={disabled}
          aria-current={active === cat}
          className={`${styles.pill} ${active === cat ? styles.active : ""}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}
