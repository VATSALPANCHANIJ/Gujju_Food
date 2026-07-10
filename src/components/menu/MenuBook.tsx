"use client";

// MenuBook — an animated hardcover menu book with a category filter above it.
//
//  • Leaf model: each leaf is a sheet of paper with a FRONT and a BACK face.
//      desktop → leaf i = { front: pages[2i], back: pages[2i+1] }  (two-page spread)
//      mobile  → leaf i = { front: pages[i],  back: blank paper }  (single page)
//  • Flipping is a real 3D rotation around the spine (GSAP, rotationY 0 → -180)
//    with a mid-turn shadow sweep for the paper-curl feel. Never instant.
//  • Choosing a category flips through every intervening leaf, one after another.
//  • Turning pages manually re-highlights the category (two-way sync), because
//    the active category is DERIVED from the current leaf.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  buildPages,
  categoryOf,
  firstPageOfCategory,
  type BookPage,
  type MenuCategory,
} from "@/data/menu-full";
import CategoryFilter from "./CategoryFilter";
import MenuItemCard from "./MenuItemCard";
import styles from "./MenuBook.module.css";

interface Leaf {
  front: BookPage;
  back: BookPage | null; // null → blank paper (mobile single-page mode)
}

const FLIP_DURATION = 0.85;
const FLIP_OVERLAP = 0.55; // consecutive turns overlap, so the book "riffles"
const FLIP_STEP = FLIP_DURATION - FLIP_OVERLAP;

/* ------------------------------------------------------------------ faces */

function PageFace({ page, pageNo }: { page: BookPage | null; pageNo?: number }) {
  if (page === null) return <div className={styles.paper} aria-hidden="true" />;

  if (page.kind === "cover" || page.kind === "back") {
    const isCover = page.kind === "cover";
    return (
      <div className={`${styles.page} ${styles.cover}`}>
        <div className={styles.coverInner}>
          <span className={styles.coverOrn}>✦</span>
          {isCover ? (
            <>
              <p className={styles.coverEyebrow}>Hobart · Tasmania</p>
              <h2 className={styles.coverTitle}>Gujju Food Hub</h2>
              <div className={styles.coverRule} />
              <p className={styles.coverSub}>Menu</p>
            </>
          ) : (
            <>
              <h2 className={styles.coverTitle}>Thank You</h2>
              <div className={styles.coverRule} />
            </>
          )}
          <p className={styles.coverTag}>&ldquo;Spice Up Your Day with Gujju Delights!&rdquo;</p>
        </div>
      </div>
    );
  }

  if (page.kind === "filler") {
    // Decorative flourish page — keeps each category on whole spreads.
    return (
      <div className={`${styles.page} ${styles.filler}`}>
        <div className={styles.fillerInner}>
          <span className={styles.fillerOrn}>✦</span>
          <p className={styles.fillerCat}>{page.category}</p>
          <div className={styles.pageRule} />
          <p className={styles.fillerTag}>
            &ldquo;Spice Up Your Day with Gujju Delights!&rdquo;
          </p>
        </div>
        {pageNo !== undefined ? <footer className={styles.pageNo}>{pageNo}</footer> : null}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <span className={styles.pageKicker}>Our Menu</span>
        <h3 className={styles.pageTitle}>{page.category}</h3>
        {page.partOf > 1 ? (
          <span className={styles.pagePart}>
            {page.part} / {page.partOf}
          </span>
        ) : null}
        <div className={styles.pageRule} />
      </header>

      <div className={styles.pageItems}>
        {page.items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>

      {pageNo !== undefined ? <footer className={styles.pageNo}>{pageNo}</footer> : null}
    </div>
  );
}

/* ------------------------------------------------------------------- book */

export default function MenuBook() {
  const pages = useMemo(() => buildPages(), []);
  const [isMobile, setIsMobile] = useState(false);
  const [flipped, setFlipped] = useState(0); // leaves turned so far
  const [animating, setAnimating] = useState(false);

  const bookRef = useRef<HTMLDivElement>(null);
  const flippedRef = useRef(0);
  const animRef = useRef(false);

  useEffect(() => {
    flippedRef.current = flipped;
  }, [flipped]);

  // ---- responsive mode (converts the flip position so you keep your place) --
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => {
      setIsMobile((prev) => {
        if (prev === mq.matches) return prev;
        const f = flippedRef.current;
        const next = mq.matches ? f * 2 : f % 2 === 0 ? f / 2 : (f + 1) / 2;
        flippedRef.current = next;
        setFlipped(next);
        return mq.matches;
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ---- leaves -------------------------------------------------------------
  const leaves = useMemo<Leaf[]>(() => {
    if (isMobile) return pages.map((p) => ({ front: p, back: null }));
    const out: Leaf[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      out.push({ front: pages[i], back: pages[i + 1] ?? null });
    }
    return out;
  }, [pages, isMobile]);

  const maxFlipped = leaves.length;

  /** Leaves are queried from the DOM, so no ref array can go stale mid-render. */
  const leafAt = useCallback(
    (i: number) => bookRef.current?.querySelector<HTMLDivElement>(`[data-leaf="${i}"]`) ?? null,
    []
  );

  // ---- baseline rotation + z-order (re-applied when the leaf set changes) --
  useEffect(() => {
    const f = flippedRef.current;
    for (let i = 0; i < leaves.length; i++) {
      const el = leafAt(i);
      if (!el) continue;
      gsap.set(el, { rotationY: i < f ? -180 : 0, zIndex: i < f ? i : leaves.length - i });
      el.querySelectorAll<HTMLElement>("[data-shade]").forEach((s) =>
        gsap.set(s, { opacity: 0 })
      );
    }
  }, [leaves, leafAt]);

  // ---- flip to an arbitrary leaf, one page at a time ----------------------
  const goToLeaf = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(maxFlipped, target));
      const from = flippedRef.current;
      if (animRef.current || clamped === from) return;

      // Collect the leaves to turn, in order.
      const turns: { i: number; forward: boolean }[] = [];
      if (clamped > from) for (let i = from; i < clamped; i++) turns.push({ i, forward: true });
      else for (let i = from - 1; i >= clamped; i--) turns.push({ i, forward: false });

      const usable = turns.filter((t) => leafAt(t.i));
      if (usable.length === 0) return; // nothing to animate — never strand `animating`

      animRef.current = true;
      setAnimating(true);

      const master = gsap.timeline({
        onComplete: () => {
          animRef.current = false;
          setAnimating(false);
        },
      });

      usable.forEach((turn, k) => {
        const el = leafAt(turn.i)!;
        const shades = el.querySelectorAll<HTMLElement>("[data-shade]");
        const at = k * FLIP_STEP;
        const end = at + FLIP_DURATION;

        master
          // lift the turning leaf above both stacks (+k keeps overlapping turns ordered)
          .set(el, { zIndex: leaves.length + 10 + k }, at)
          .to(
            el,
            { rotationY: turn.forward ? -180 : 0, duration: FLIP_DURATION, ease: "power2.inOut" },
            at
          )
          // paper darkens through the middle of the turn, then lifts — the curl
          .fromTo(
            shades,
            { opacity: 0 },
            {
              opacity: 0.4,
              duration: FLIP_DURATION / 2,
              ease: "sine.in",
              yoyo: true,
              repeat: 1,
            },
            at
          )
          .call(
            () => {
              flippedRef.current = turn.forward ? turn.i + 1 : turn.i;
              setFlipped(flippedRef.current);
            },
            undefined,
            end
          )
          .set(el, { zIndex: turn.forward ? turn.i : leaves.length - turn.i }, end);
      });
    },
    [leafAt, leaves.length, maxFlipped]
  );

  // ---- derived: which category is on screen right now (manual-flip sync) ---
  const activeCategory = useMemo<MenuCategory | null>(() => {
    if (isMobile) return categoryOf(pages[flipped]);
    // Every category owns whole spreads, so left and right always agree.
    return categoryOf(pages[2 * flipped]) ?? categoryOf(pages[2 * flipped - 1]);
  }, [flipped, isMobile, pages]);

  // ---- category → flip there ----------------------------------------------
  const goToCategory = useCallback(
    (category: MenuCategory | null) => {
      if (category === null) {
        goToLeaf(0); // back to the cover
        return;
      }
      const p = firstPageOfCategory(pages, category);
      if (p < 0) return;
      goToLeaf(isMobile ? p : p % 2 === 0 ? p / 2 : (p + 1) / 2);
    },
    [goToLeaf, isMobile, pages]
  );

  // ---- manual navigation ---------------------------------------------------
  const next = useCallback(() => goToLeaf(flippedRef.current + 1), [goToLeaf]);
  const prev = useCallback(() => goToLeaf(flippedRef.current - 1), [goToLeaf]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className={styles.wrap}>
      <CategoryFilter active={activeCategory} onSelect={goToCategory} disabled={animating} />

      <div
        ref={bookRef}
        className={`${styles.book} ${isMobile ? styles.single : ""}`}
        role="group"
        aria-label="Menu book"
      >
        <div className={styles.spine} aria-hidden="true" />
        <div className={styles.edgeLeft} aria-hidden="true" />
        <div className={styles.edgeRight} aria-hidden="true" />

        {leaves.map((leaf, i) => (
          <div key={i} data-leaf={i} className={styles.leaf}>
            <div className={`${styles.face} ${styles.front}`}>
              <PageFace page={leaf.front} pageNo={isMobile ? i + 1 : 2 * i + 1} />
              <div className={styles.shade} data-shade="front" aria-hidden="true" />
            </div>
            <div className={`${styles.face} ${styles.back}`}>
              <PageFace page={leaf.back} pageNo={leaf.back ? 2 * i + 2 : undefined} />
              <div className={styles.shade} data-shade="back" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prev}
          disabled={animating || flipped === 0}
          aria-label="Previous page"
        >
          ←
        </button>
        <span className={styles.progress}>
          {activeCategory ?? (flipped === 0 ? "Cover" : "Thank You")}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={next}
          disabled={animating || flipped === maxFlipped}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      <p className={styles.hint}>Use ← → keys, or pick a category above to flip through.</p>
    </div>
  );
}
