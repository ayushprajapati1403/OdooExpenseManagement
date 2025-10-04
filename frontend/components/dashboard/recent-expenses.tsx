'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Coffee, Car, Music, Zap, ShoppingBag, Heart, GraduationCap, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Expense, ExpenseCategory } from '@/types';

interface RecentExpensesProps {
  expenses: Expense[];
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

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const recentExpenses = expenses.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="notebook-shadow">
        <CardHeader>
          <CardTitle className="handwriting-text text-2xl">
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses yet. Add your first expense!
            </p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn('p-2 rounded-lg', categoryColors[expense.category])}>
                      {categoryIcons[expense.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${Number(expense.amount || 0).toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {expense.category}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
