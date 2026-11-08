"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedList({
  className,
  children,
  delay = 100,
}: AnimatedListProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      <AnimatePresence>
        {childrenArray.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 24,
              delay: (index * delay) / 1000,
            }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

