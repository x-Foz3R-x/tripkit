export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const MOTION_TRANSITIONS = {
  quick: { duration: 0.16, ease: MOTION_EASE },
  base: { duration: 0.26, ease: MOTION_EASE },
  spring: { type: "spring", stiffness: 420, damping: 34, mass: 0.7 },
} as const;
