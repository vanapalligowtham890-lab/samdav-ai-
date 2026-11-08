"use client";

import { useEffect, useState } from "react";

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypingAnimation({
  text,
  duration = 20,
  className,
  onComplete,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedText(text);
      if (onComplete) onComplete();
      return;
    }

    if (i < text.length) {
      const typingEffect = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(i));
        setI((prev) => prev + 1);
      }, duration);

      return () => {
        clearInterval(typingEffect);
      };
    } else if (onComplete && text.length > 0 && i >= text.length) {
      onComplete();
    }
  }, [duration, i, text, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {i < text.length && <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent animate-pulse" />}
    </span>
  );
}

