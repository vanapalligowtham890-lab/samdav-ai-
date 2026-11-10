"use client";

import React from "react";

interface BrandLogoProps {
  isAditya?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

/**
 * High-fidelity, self-contained vector Brand Logo for Aditya University & Samvad AI.
 * Completely immune to 404 errors, network latency, or broken image placeholders.
 */
export function BrandLogo({ isAditya = false, className = "", size = "md" }: BrandLogoProps) {
  if (isAditya) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-surface border border-border/80 p-0.5 flex items-center justify-center shadow-xs shrink-0 select-none overflow-hidden ${className}`}
        title="Aditya University · Admissions Desk"
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="auBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d2137" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="auGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Rounded Tile */}
          <rect width="100" height="100" rx="22" fill="url(#auBgGrad)" />
          <rect x="2" y="2" width="96" height="96" rx="20" stroke="url(#auGoldGrad)" strokeWidth="2.5" strokeOpacity="0.5" />
          
          {/* Inner Shield */}
          <path
            d="M50 18 C66 18 76 23 76 33 C76 58 50 82 50 84 C50 82 24 58 24 33 C24 23 34 18 50 18 Z"
            fill="#09182b"
            stroke="url(#auGoldGrad)"
            strokeWidth="2.5"
          />
          
          {/* Graduation Cap */}
          <path d="M50 24 L64 30 L50 36 L36 30 Z" fill="url(#auGoldGrad)" />
          <path d="M64 30 L64 36" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="64" cy="37" r="1.5" fill="#fbbf24" />
          
          {/* Central Monogram 'A' */}
          <path d="M50 36 L63 68 L56 68 L52 58 L48 58 L44 68 L37 68 Z M50 45 L46 54 L54 54 Z" fill="url(#auGoldGrad)" />
          
          {/* Academic Book Base */}
          <path d="M40 70 C45 68 49 69 50 71 C51 69 55 68 60 70 L60 75 C55 73 51 74 50 76 C49 74 45 73 40 75 Z" fill="#ffffff" opacity="0.9" />

          {/* Stars */}
          <circle cx="32" cy="74" r="2" fill="#fbbf24" />
          <circle cx="68" cy="74" r="2" fill="#fbbf24" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg bg-surface border border-border/80 p-0.5 flex items-center justify-center shadow-xs shrink-0 select-none overflow-hidden ${className}`}
      title="Samvad AI · Gnani Prisma & Timbre"
    >
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="svBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <linearGradient id="svWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="svGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        {/* Tile */}
        <rect width="100" height="100" rx="22" fill="url(#svBgGrad)" />
        <rect x="2" y="2" width="96" height="96" rx="20" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.4" />

        {/* Speech Bubble Contour */}
        <path
          d="M22 26 C22 18 28 12 36 12 L64 12 C72 12 78 18 78 26 L78 52 C78 60 72 66 64 66 L42 66 L30 76 L32 66 L22 66 Z"
          fill="#0f172a"
          fillOpacity="0.4"
          stroke="url(#svWaveGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Soundwave bars */}
        <rect x="33" y="38" width="4.5" height="16" rx="2.25" fill="url(#svGoldGrad)" />
        <rect x="41.5" y="29" width="4.5" height="34" rx="2.25" fill="url(#svWaveGrad)" />
        <rect x="50" y="22" width="4.5" height="46" rx="2.25" fill="#ffffff" />
        <rect x="58.5" y="31" width="4.5" height="30" rx="2.25" fill="url(#svWaveGrad)" />
        <rect x="67" y="40" width="4.5" height="12" rx="2.25" fill="url(#svGoldGrad)" />

        {/* AI Sparkle */}
        <path d="M78 20 L80 25 L85 27 L80 29 L78 34 L76 29 L71 27 L76 25 Z" fill="#fbbf24" />
      </svg>
    </div>
  );
}
