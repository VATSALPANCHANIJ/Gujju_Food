"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TOTAL_FRAMES = 138;

// Story beats as [scrollProgress, frameIndex] anchors. Repeated frames create
// eased "holds" so each location gets a still cinematic moment for the typography.
// Linear interpolation between anchors keeps the camera continuous (no dead gaps).
const BEATS: [number, number][] = [
  [0.0, 1],
  [0.1, 18], // India settles
  [0.15, 18], // hold — INDIA
  [0.34, 60], // pull back over the ocean
  [0.4, 72], // globe apex
  [0.46, 72], // hold — THE JOURNEY (route arc draws)
  [0.58, 88], // descend over Australia
  [0.63, 88], // hold — AUSTRALIA
  [0.72, 104], // sweep into Tasmania
  [0.77, 104], // hold — TASMANIA
  [0.88, 130], // arrive over Hobart
  [0.93, 134], // hold — HOBART
  [1.0, TOTAL_FRAMES], // settle into the brand reveal
];

function frameForProgress(p: number): number {
  if (p <= BEATS[0][0]) return BEATS[0][1];
  if (p >= BEATS[BEATS.length - 1][0]) return BEATS[BEATS.length - 1][1];
  for (let i = 0; i < BEATS.length - 1; i++) {
    const [p0, f0] = BEATS[i];
    const [p1, f1] = BEATS[i + 1];
    if (p >= p0 && p <= p1) {
      const t = p1 === p0 ? 0 : (p - p0) / (p1 - p0);
      return Math.round(f0 + t * (f1 - f0));
    }
  }
  return BEATS[BEATS.length - 1][1];
}

interface HeroSequenceProps {
  onProgress: (progress: number) => void;
  onPreloadComplete: () => void;
  onScrollProgress: (progress: number) => void;
}

export default function HeroSequence({
  onProgress,
  onPreloadComplete,
  onScrollProgress,
}: HeroSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const preloadedRef = useRef<boolean>(false);
  const preloadThreshold = Math.ceil(TOTAL_FRAMES * 0.45); // start once ~45% is buffered

  const [activeFrame, setActiveFrame] = useState(1);
  const [loadedCount, setLoadedCount] = useState(0);

  const loadFrameImage = (index: number): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (imagesRef.current[index - 1]) {
        resolve(imagesRef.current[index - 1] as HTMLImageElement);
        return;
      }
      const img = new Image();
      const frameNum = String(index).padStart(4, "0");
      img.src = `/frames/frame_${frameNum}.webp`;
      img.onload = () => {
        imagesRef.current[index - 1] = img;
        setLoadedCount((prev) => prev + 1);
        resolve(img);
      };
      img.onerror = () => {
        imagesRef.current[index - 1] = null;
        reject(new Error(`Failed to load frame ${index}`));
      };
    });
  };

  useEffect(() => {
    const loadAllFrames = async () => {
      let loaded = 0;
      const batchSize = 6;
      const tick = () => {
        loaded++;
        onProgress((loaded / TOTAL_FRAMES) * 100);
        if (loaded >= preloadThreshold && !preloadedRef.current) {
          preloadedRef.current = true;
          onPreloadComplete();
        }
      };
      for (let i = 1; i <= TOTAL_FRAMES; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j <= TOTAL_FRAMES; j++) {
          batch.push(
            loadFrameImage(i + j)
              .then(tick)
              .catch(tick)
          );
        }
        await Promise.all(batch);
      }
    };
    loadAllFrames();
  }, [onProgress, onPreloadComplete, preloadThreshold]);

  // Canvas drawing — raw frame + a subtle in-canvas grade for cinematic punch.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawImageCover = (img: HTMLImageElement) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const imgRatio = img.width / img.height;
      const canvasRatio = cw / ch;
      let drawWidth = cw;
      let drawHeight = ch;
      let offsetX = 0;
      let offsetY = 0;
      if (canvasRatio < imgRatio) {
        drawWidth = ch * imgRatio;
        offsetX = (cw - drawWidth) / 2;
      } else {
        drawHeight = cw / imgRatio;
        offsetY = (ch - drawHeight) / 2;
      }
      ctx.clearRect(0, 0, cw, ch);
      ctx.filter = "saturate(1.12) contrast(1.07) brightness(1.02)";
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = "none";
    };

    const drawFrame = (frameIndex: number) => {
      let img = imagesRef.current[frameIndex - 1];
      if (!img) {
        let left = frameIndex - 1;
        let right = frameIndex + 1;
        while (left >= 1 || right <= TOTAL_FRAMES) {
          if (left >= 1 && imagesRef.current[left - 1]) {
            img = imagesRef.current[left - 1];
            break;
          }
          if (right <= TOTAL_FRAMES && imagesRef.current[right - 1]) {
            img = imagesRef.current[right - 1];
            break;
          }
          left--;
          right++;
        }
      }
      if (img) drawImageCover(img);
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      drawFrame(activeFrame);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    drawFrame(activeFrame);

    return () => window.removeEventListener("resize", handleResize);
  }, [activeFrame, loadedCount]);

  // ScrollTrigger — Lenis provides the smoothing, so we scrub directly (no extra lag).
  useEffect(() => {
    if (!containerRef.current) return;
    const scrollObj = { progress: 0 };

    const anim = gsap.to(scrollObj, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=280%",
        pin: true,
        scrub: true,
        onUpdate: () => {
          setActiveFrame(frameForProgress(scrollObj.progress));
          onScrollProgress(scrollObj.progress);
        },
      },
    });

    return () => {
      anim.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [onScrollProgress]);

  return (
    <div ref={containerRef} className="hero-sequence-container">
      <canvas ref={canvasRef} className="hero-sequence-canvas" />
      {/* Cinematic grade stack — keeps raw frames, grades live */}
      <div className="hero-grade" />
      <div className="hero-vignette" />
      <div className="hero-grain" />
      <div className="hero-letterbox top" />
      <div className="hero-letterbox bottom" />
    </div>
  );
}
