'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = requirements.filter((req) => req.test(password)).length;
  const percentage = (strength / requirements.length) * 100;

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn('font-medium', getStrengthColor().replace('bg-', 'text-'))}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
            className={cn('h-full', getStrengthColor())}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {requirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <motion.div
              key={requirement.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-2 text-xs"
            >
              <div
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded-full transition-colors',
                  isMet ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                )}
              >
                {isMet ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <span className={cn(isMet ? 'text-foreground' : 'text-muted-foreground')}>
                {requirement.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
