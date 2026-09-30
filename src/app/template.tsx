"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  // Opacity only: transforms here would change the containing block of GSAP's pin.
  return (
    <motion.div
      className="page-transition"
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      {children}
    </motion.div>
  );
}
