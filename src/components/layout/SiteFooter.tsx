// Minimal, reusable site footer. Currently used by /menu.

import React from "react";
import styles from "./SiteChrome.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.footerOrn} aria-hidden="true">✦</span>
      <p className={styles.footerTag}>&ldquo;Spice Up Your Day with Gujju Delights!&rdquo;</p>
      <p className={styles.footerCopy}>© {new Date().getFullYear()} Gujju Food Hub · Hobart, Tasmania</p>
    </footer>
  );
}
