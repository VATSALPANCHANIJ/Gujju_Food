"use client";

import React, { useState, useCallback } from "react";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import HeroSequence from "@/components/HeroSequence";
import TextOverlay from "@/components/TextOverlay";
import ProductShowcase from "@/components/ProductShowcase";

export default function Home() {
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Stable identities so HeroSequence effects run once, not on every render.
  const handleProgress = useCallback((progress: number) => {
    // Loader bar hits 100% once the preload threshold (~45% of frames) is buffered
    setPreloadProgress(Math.min(100, (progress / 45) * 100));
  }, []);

  const handlePreloadComplete = useCallback(() => {
    setLoadingFinished(true);
    // Refresh ScrollTrigger after preloader is fully faded out
    setTimeout(() => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    }, 1100);
  }, []);

  const handleScrollProgress = useCallback((progress: number) => {
    setScrollProgress(progress);
  }, []);

  return (
    <SmoothScroll>
      {/* 1. LUXURY LOADING SCREEN */}
      <Preloader progress={preloadProgress} loadingFinished={loadingFinished} />

      {/* 2. HERO PINNED CONTAINER */}
      <main id="home" style={{ position: "relative", backgroundColor: "#0f1412" }}>
        <HeroSequence 
          onProgress={handleProgress}
          onPreloadComplete={handlePreloadComplete}
          onScrollProgress={handleScrollProgress}
        />
        <TextOverlay progress={scrollProgress} />
      </main>

      {/* 3. SIGNATURE FAVOURITES — pinned product showcase (Section 02) */}
      <ProductShowcase />
    </SmoothScroll>
  );
}
