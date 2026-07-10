"use client";

// MenuBook — an animated hardcover menu book with a category filter above it.
//
//  • Leaf model: each leaf is a sheet of paper with a FRONT and a BACK face.
//      desktop → leaf i = { front: pages[2i], back: pages[2i+1] }  (two-page spread)
//      mobile  → leaf i = { front: pages[i],  back: blank paper }  (single page)
//  • HARDCOVER: the book opens closed — only the front cover is visible, centred.
//    Turning leaf 0 swings the cover open and slides the stage into the spread.
//    Turning the last leaf closes the back cover, leaving only it visible.
//  • Flipping is a real 3D rotation around the spine (GSAP, rotationY 0 → -180)
//    with a mid-turn shadow sweep for the paper-curl feel. Never instant.
//  • Pages can be turned by button, arrow keys, or by dragging/swiping the page
//    itself — the paper follows the pointer and settles or springs back.
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
const DRAG_THRESHOLD = 6; // px before a drag claims a direction
const DRAG_COMMIT = 0.3; // release past 30% → complete the turn

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
  const stageRef = useRef<HTMLDivElement>(null);
  const slabLeftRef = useRef<HTMLDivElement>(null);
  const slabRightRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);

  const flippedRef = useRef(0);
  const animRef = useRef(false);
  const mobileRef = useRef(false);

  useEffect(() => {
    flippedRef.current = flipped;
  }, [flipped]);
  useEffect(() => {
    mobileRef.current = isMobile;
  }, [isMobile]);

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
  const lastLeaf = leaves.length - 1;

  /** Leaves are queried from the DOM, so no ref array can go stale mid-render. */
  const leafAt = useCallback(
    (i: number) => bookRef.current?.querySelector<HTMLDivElement>(`[data-leaf="${i}"]`) ?? null,
    []
  );

  /** Width of one page — the drag distance that equals a full turn. */
  const pageWidth = useCallback(
    () => (bookRef.current ? bookRef.current.clientWidth / (mobileRef.current ? 1 : 2) : 420),
    []
  );

  /** Closed front → shift right; closed back → shift left. Desktop only. */
  const stageXFor = useCallback(
    (f: number) => {
      if (mobileRef.current) return 0;
      const pw = pageWidth();
      if (f === 0) return -pw / 2; // only the front cover, centred
      if (f === maxFlipped) return pw / 2; // only the back cover, centred
      return 0;
    },
    [maxFlipped, pageWidth]
  );

  // ---- baseline rotation, z-order and hardcover state ---------------------
  useEffect(() => {
    const f = flippedRef.current;
    for (let i = 0; i < leaves.length; i++) {
      const el = leafAt(i);
      if (!el) continue;
      gsap.set(el, { rotationY: i < f ? -180 : 0, zIndex: i < f ? i : leaves.length - i });
      el.querySelectorAll<HTMLElement>("[data-shade]").forEach((s) => gsap.set(s, { opacity: 0 }));
    }
    gsap.set(stageRef.current, { x: stageXFor(f) });
    const closedFront = !mobileRef.current && f === 0;
    const closedBack = !mobileRef.current && f === maxFlipped;
    gsap.set(slabLeftRef.current, { autoAlpha: closedFront ? 0 : 1 });
    gsap.set(slabRightRef.current, { autoAlpha: closedBack ? 0 : 1 });
    gsap.set(spineRef.current, { autoAlpha: closedFront || closedBack ? 0 : 1 });
  }, [leaves, leafAt, maxFlipped, stageXFor]);

  /**
   * Adds one leaf turn to `tl` at time `at`, including the hardcover choreography
   * when the leaf being turned is the front or back cover.
   */
  const addLeafTurn = useCallback(
    (tl: gsap.core.Timeline, i: number, forward: boolean, at: number, k = 0) => {
      const el = leafAt(i);
      if (!el) return;
      const shades = el.querySelectorAll<HTMLElement>("[data-shade]");
      const end = at + FLIP_DURATION;

      tl.set(el, { zIndex: leaves.length + 10 + k }, at)
        .to(
          el,
          { rotationY: forward ? -180 : 0, duration: FLIP_DURATION, ease: "power2.inOut" },
          at
        )
        // paper darkens through the middle of the turn, then lifts — the curl
        .fromTo(
          shades,
          { opacity: 0 },
          { opacity: 0.4, duration: FLIP_DURATION / 2, ease: "sine.in", yoyo: true, repeat: 1 },
          at
        )
        .set(el, { zIndex: forward ? i : leaves.length - i }, end);

      if (mobileRef.current) return;
      const pw = pageWidth();
      const fade = FLIP_DURATION * 0.6;

      if (i === 0) {
        // front cover swinging open (or closing back down)
        tl.to(stageRef.current, { x: forward ? 0 : -pw / 2, duration: FLIP_DURATION, ease: "power2.inOut" }, at)
          .to(slabLeftRef.current, { autoAlpha: forward ? 1 : 0, duration: fade }, at)
          .to(spineRef.current, { autoAlpha: forward ? 1 : 0, duration: fade }, at);
      }
      if (i === lastLeaf) {
        // back cover closing down (or re-opening)
        tl.to(stageRef.current, { x: forward ? pw / 2 : 0, duration: FLIP_DURATION, ease: "power2.inOut" }, at)
          .to(slabRightRef.current, { autoAlpha: forward ? 0 : 1, duration: fade }, at)
          .to(spineRef.current, { autoAlpha: forward ? 0 : 1, duration: fade }, at);
      }
    },
    [lastLeaf, leafAt, leaves.length, pageWidth]
  );

  // ---- flip to an arbitrary leaf, one page at a time ----------------------
  const goToLeaf = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(maxFlipped, target));
      const from = flippedRef.current;
      if (animRef.current || clamped === from) return;

      const turns: { i: number; forward: boolean }[] = [];
      if (clamped > from) for (let i = from; i < clamped; i++) turns.push({ i, forward: true });
      else for (let i = from - 1; i >= clamped; i--) turns.push({ i, forward: false });

      const usable = turns.filter((t) => leafAt(t.i));
      if (usable.length === 0) return; // never strand `animating`

      animRef.current = true;
      setAnimating(true);

      const master = gsap.timeline({
        onComplete: () => {
          animRef.current = false;
          setAnimating(false);
        },
      });

      usable.forEach((turn, k) => {
        const at = k * FLIP_STEP;
        addLeafTurn(master, turn.i, turn.forward, at, k);
        master.call(
          () => {
            flippedRef.current = turn.forward ? turn.i + 1 : turn.i;
            setFlipped(flippedRef.current);
          },
          undefined,
          at + FLIP_DURATION
        );
      });
    },
    [addLeafTurn, leafAt, maxFlipped]
  );

  // ---- drag / swipe -------------------------------------------------------
  const drag = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    leaf: number;
    forward: boolean;
    tl: gsap.core.Timeline | null;
  }>({ active: false, startX: 0, startY: 0, leaf: -1, forward: true, tl: null });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (animRef.current) return;
    // ignore drags that begin on the nav buttons
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      leaf: -1,
      forward: true,
      tl: null,
    };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d.active || animRef.current) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      // Claim a direction (and build the paused turn) on the first real move.
      if (d.leaf < 0) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          d.active = false; // vertical → let the page scroll
          return;
        }
        const forward = dx < 0;
        const f = flippedRef.current;
        const leaf = forward ? f : f - 1;
        if (leaf < 0 || leaf >= leaves.length) {
          d.active = false;
          return;
        }
        const tl = gsap.timeline({ paused: true });
        addLeafTurn(tl, leaf, forward, 0);
        d.leaf = leaf;
        d.forward = forward;
        d.tl = tl;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }

      if (d.tl) {
        const p = Math.max(0, Math.min(1, Math.abs(dx) / pageWidth()));
        d.tl.progress(p);
      }
    },
    [addLeafTurn, leaves.length, pageWidth]
  );

  const endDrag = useCallback(() => {
    const d = drag.current;
    if (!d.active || !d.tl) {
      drag.current.active = false;
      return;
    }
    const tl = d.tl;
    const leaf = d.leaf;
    const forward = d.forward;
    const p = tl.progress();
    drag.current = { active: false, startX: 0, startY: 0, leaf: -1, forward: true, tl: null };

    animRef.current = true;
    setAnimating(true);

    const commit = p > DRAG_COMMIT;
    gsap.to(tl, {
      progress: commit ? 1 : 0,
      duration: FLIP_DURATION * (commit ? 1 - p : p) * 0.9 + 0.12,
      ease: commit ? "power2.out" : "power2.inOut",
      onComplete: () => {
        if (commit) {
          flippedRef.current = forward ? leaf + 1 : leaf;
          setFlipped(flippedRef.current);
        }
        tl.kill();
        animRef.current = false;
        setAnimating(false);
      },
    });
  }, []);

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
        goToLeaf(0); // back to the closed cover
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

  const closedFront = flipped === 0;
  const closedBack = flipped === maxFlipped;

  return (
    <div className={styles.wrap}>
      <CategoryFilter active={activeCategory} onSelect={goToCategory} disabled={animating} />

      <div
        ref={bookRef}
        className={[
          styles.book,
          isMobile ? styles.single : "",
          closedFront ? styles.closedFront : "",
          closedBack ? styles.closedBack : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="group"
        aria-label="Menu book — drag or swipe a page to turn it"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div ref={stageRef} className={styles.stage}>
          <div ref={slabLeftRef} className={styles.slabLeft} aria-hidden="true" />
          <div ref={slabRightRef} className={styles.slabRight} aria-hidden="true" />
          <div ref={spineRef} className={styles.spine} aria-hidden="true" />
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
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prev}
          disabled={animating || closedFront}
          aria-label="Previous page"
        >
          ←
        </button>
        <span className={styles.progress}>
          {activeCategory ?? (closedFront ? "Cover" : "Thank You")}
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={next}
          disabled={animating || closedBack}
          aria-label="Next page"
        >
          →
        </button>
      </div>

      <p className={styles.hint}>
        Drag or swipe a page to turn it · use ← → keys · or pick a category above.
      </p>
    </div>
  );
}
