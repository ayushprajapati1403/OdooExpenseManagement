'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Car, Music, Zap, ShoppingBag, Heart, GraduationCap, MoveHorizontal as MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Expense, ExpenseCategory } from '@/types';
import { format } from 'date-fns';

interface ExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  food: <Coffee className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  entertainment: <Music className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const categoryColors: Record<ExpenseCategory, string> = {
  food: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  transport: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  entertainment: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  utilities: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  shopping: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  health: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  education: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const formattedDate = format(new Date(expense.date), 'MMM dd, yyyy');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
    >
      <Card className="notebook-shadow hover:notebook-shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={categoryColors[expense.category]} variant="secondary">
                  {categoryIcons[expense.category]}
                  <span className="ml-1.5 capitalize">{expense.category}</span>
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1 truncate">{expense.title}</h3>
              {expense.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {expense.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-xl font-bold text-primary">
                ${expense.amount.toFixed(2)}
              </p>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(expense.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
