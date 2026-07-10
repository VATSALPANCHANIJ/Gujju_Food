import React from "react";
import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import MenuBook from "@/components/menu/MenuBook";
import styles from "./menu.module.css";

export const metadata: Metadata = {
  title: "Full Menu · Gujju Food Hub",
  description:
    "The complete Gujju Food Hub menu — Gujarati street food, chaat, curries, breads, biryani, desserts and drinks in Hobart, Tasmania.",
};

export default function MenuPage() {
  return (
    <div className={styles.shell}>
      <SiteHeader />

      <main className={styles.main}>
        {/* 1. Luxury header */}
        <section className={styles.intro}>
          <span className={styles.eyebrow}>The Full Menu</span>
          <h1 className={styles.title}>Gujju Food Hub</h1>
          <div className={styles.rule} aria-hidden="true">
            <span>✦</span>
          </div>
          <p className={styles.lead}>
            Turn the pages of our menu — authentic Gujarati street food, chaat, slow-cooked
            curries, fresh breads and chilled drinks, prepared the way they are back home.
          </p>
        </section>

        {/* 2. Category filter + 3. Animated luxury book */}
        <MenuBook />
      </main>

      {/* 4. Footer */}
      <SiteFooter />
    </div>
  );
}
