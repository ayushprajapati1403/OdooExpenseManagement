'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/navigation/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-x-hidden"
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
