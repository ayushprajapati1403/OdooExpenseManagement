'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, SquareCheck as CheckSquare, Settings, User, Menu, X, GitBranch, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    title: 'Approvals',
    href: '/approvals',
    icon: <CheckSquare className="h-5 w-5" />,
    badge: 3,
  },
  {
    title: 'Flows',
    href: '/admin/flows',
    icon: <GitBranch className="h-5 w-5" />,
  },
  {
    title: 'Company',
    href: '/admin/company',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: <User className="h-5 w-5" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-20 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: 0 }}
        className={cn(
          'fixed left-0 top-16 bottom-0 z-40 w-64',
          'border-r bg-card notebook-shadow',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full overflow-y-auto py-6 px-3">
          <nav className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-all duration-200',
                      'hover:bg-accent hover:translate-x-1',
                      isActive
                        ? 'bg-primary text-primary-foreground notebook-shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item.icon}
                    </motion.div>
                    <span className="font-medium handwriting-text text-lg">
                      {item.title}
                    </span>
                    {item.badge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <div className="px-3 py-2 bg-accent/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Quick Tip</p>
              <p className="text-sm font-medium handwriting-text">
                Track expenses daily for better insights
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
