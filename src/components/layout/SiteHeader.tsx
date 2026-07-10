// Minimal, reusable site header. Currently used by /menu; safe to reuse
// site-wide later. Intentionally does NOT touch the Home Page.

import React from "react";
import Link from "next/link";
import styles from "./SiteChrome.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <span className={styles.brandMark}>✦</span>
        <span className={styles.brandName}>Gujju Food Hub</span>
      </Link>

      <Link href="/" className={styles.back}>
        <span aria-hidden="true">←</span> Home
      </Link>
    </header>
  );
}
