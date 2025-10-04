'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NotebookContainerProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function NotebookContainer({
  children,
  className,
  animate = true,
}: NotebookContainerProps) {
  const content = (
    <div
      className={cn(
        'notebook-paper notebook-shadow-lg rounded-lg p-6 md:p-8 lg:p-10',
        className
      )}
    >
      <div className="ml-20 md:ml-24">{children}</div>
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
}
