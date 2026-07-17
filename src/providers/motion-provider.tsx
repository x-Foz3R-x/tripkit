"use client";

import { MotionConfig } from "framer-motion";
import { MOTION_TRANSITIONS } from "~/lib/motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={MOTION_TRANSITIONS.base}>
      {children}
    </MotionConfig>
  );
}
