'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        className="relative w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          className="absolute inset-0 border-4 border-primary/30 rounded-full"
          style={{ borderTopColor: 'hsl(var(--primary))' }}
        />
      </motion.div>
    </div>
  );
}
