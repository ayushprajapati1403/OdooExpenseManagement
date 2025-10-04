'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  delay?: number;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="notebook-shadow hover:notebook-shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-3xl font-bold mb-2">{value}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {change >= 0 ? '+' : ''}
                    {change}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from last month
                  </span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-lg', colorClasses[color])}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
