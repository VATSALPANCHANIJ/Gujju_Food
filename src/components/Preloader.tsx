"use client";

import React, { useEffect, useState } from "react";

interface PreloaderProps {
  progress: number;
  loadingFinished: boolean;
}

export default function Preloader({ progress, loadingFinished }: PreloaderProps) {
  const [shouldRender, setShouldRender] = useState(true);
  const [fadeClass, setFadeClass] = useState("");

  useEffect(() => {
    if (loadingFinished) {
      // Add fade-out transition class
      setFadeClass("fade-out");
      const timer = setTimeout(() => {
        setShouldRender(false);
        // Enable scrolling on the body once loader is gone
        document.body.style.overflow = "";
      }, 1000); // 1s matches CSS transition duration
      return () => clearTimeout(timer);
    } else {
      // Prevent scrolling while loading
      document.body.style.overflow = "hidden";
    }
  }, [loadingFinished]);

  if (!shouldRender) return null;

  return (
    <div className={`preloader-overlay ${fadeClass}`}>
      <div className="preloader-glow" />
      <div className="preloader-content">
        <div className="preloader-logo-wrapper">
          <h1 className="preloader-logo">GUJJU FOOD HUB</h1>
          <p className="preloader-subtitle">A CINEMATIC STORY OF FLAVOURS</p>
        </div>
        
        <div className="preloader-progress-wrapper">
          <div className="preloader-progress-container">
            <div 
              className="preloader-progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="preloader-status">
            <span className="preloader-step">PRELOADING THE JOURNEY...</span>
            <span className="preloader-percentage">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
