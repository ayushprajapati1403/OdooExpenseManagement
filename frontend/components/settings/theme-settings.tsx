'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light mode with bright colors',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode with muted colors',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system preferences',
    },
  ];

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="notebook-shadow">
        <CardHeader>
          <CardTitle className="handwriting-text text-xl flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Customization
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((themeOption, index) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;

              return (
                <motion.button
                  key={themeOption.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(themeOption.value)}
                  className={cn(
                    'relative p-6 rounded-lg border-2 transition-all text-left',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={cn(
                        'p-3 rounded-full',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent text-muted-foreground'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <Label className="text-base font-semibold">
                        {themeOption.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {themeOption.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="theme-indicator"
                      className="absolute top-2 right-2 h-3 w-3 bg-primary rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-accent/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Theme changes will be applied immediately across the entire application.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
