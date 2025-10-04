'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { DollarSign, TrendingUp, Receipt, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { StatsCard } from '@/components/dashboard/stats-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentExpenses } from '@/components/dashboard/recent-expenses';
import { ExpenseForm } from '@/components/expense/expense-form';
import { SkeletonCard, SkeletonList } from '@/components/dashboard/skeleton-card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { apiClient } from '@/lib/prisma';
import type { Expense } from '@/types';
import type { ExpenseFormValues } from '@/lib/validations';

function HomePage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showExpenseForm, setShowExpenseForm] = React.useState(false);

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
      setShowExpenseForm(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = React.useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;
    const lastMonthTotal = total * 0.85;
    const change = lastMonthTotal > 0 ? ((total - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    return { 
      total: Number(total) || 0, 
      count: Number(count) || 0, 
      average: Number(average) || 0, 
      change: Number(change) || 0 
    };
  }, [expenses]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WelcomeBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Expenses"
                value={`$${stats.total.toFixed(2)}`}
                change={stats.change}
                icon={DollarSign}
                color="blue"
                delay={0}
              />
              <StatsCard
                title="Average Expense"
                value={`$${stats.average.toFixed(2)}`}
                icon={TrendingUp}
                color="green"
                delay={0.1}
              />
              <StatsCard
                title="Total Count"
                value={stats.count}
                icon={Receipt}
                color="orange"
                delay={0.2}
              />
              <StatsCard
                title="Pending Approval"
                value="0"
                icon={Clock}
                color="red"
                delay={0.3}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isLoading ? <SkeletonList /> : <RecentExpenses expenses={expenses} />}
          </div>
          <div>
            <QuickActions onAddExpense={() => setShowExpenseForm(true)} />
          </div>
        </div>
      </div>

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full">
            <ExpenseForm
              onSubmit={handleAddExpense}
              isLoading={isLoading}
              open={showExpenseForm}
              onClose={() => setShowExpenseForm(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const DynamicHomePage = dynamic(() => Promise.resolve(HomePage), {
  ssr: false,
  loading: () => (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </DashboardLayout>
  )
});

export default function Home() {
  return (
    <ProtectedRoute>
      <DynamicHomePage />
    </ProtectedRoute>
  );
}
