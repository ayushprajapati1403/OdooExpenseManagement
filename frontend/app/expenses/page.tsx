'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ExpenseForm } from '@/components/expense/expense-form';
import { ExpenseCard } from '@/components/expense/expense-card';
import { ExpenseSummary } from '@/components/expense/expense-summary';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { NotebookContainer } from '@/components/layout/notebook-container';
import { apiClient } from '@/lib/prisma';
import type { Expense } from '@/types';
import type { ExpenseFormValues } from '@/lib/validations';

function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getExpenses();
      setExpenses(response.expenses || []);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (data: ExpenseFormValues) => {
    try {
      setIsLoading(true);
      const expenseData = {
        amount: data.amount,
        currency: data.currency || 'USD',
        category: data.category,
        description: data.description,
        date: data.date,
        expenseLines: data.lineItems || []
      };
      
      const response = await apiClient.createExpense(expenseData);
      setExpenses((prev) => [response.expense, ...prev]);
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await apiClient.deleteExpense(id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const summary = React.useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    return { total, count, average };
  }, [expenses]);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <NotebookContainer>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 handwriting-text">
                  My Expenses
                </h2>
                <p className="text-muted-foreground">
                  Track and manage your daily expenses
                </p>
              </div>
              <ExpenseForm onSubmit={handleAddExpense} isLoading={isLoading} />
            </div>

            {expenses.length > 0 && (
              <ExpenseSummary
                total={summary.total}
                count={summary.count}
                average={summary.average}
              />
            )}

            {expenses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <p className="text-muted-foreground text-lg">
                  No expenses yet. Click &quot;Add Expense&quot; to get started!
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onDelete={handleDeleteExpense}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </NotebookContainer>
      </motion.div>
    </DashboardLayout>
  );
}

export default function Expenses() {
  return (
    <ProtectedRoute>
      <ExpensesPage />
    </ProtectedRoute>
  );
}
