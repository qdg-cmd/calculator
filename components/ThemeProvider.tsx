'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore, THEMES } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Set theme on <html> root element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Dynamically update mobile browser address bar / PWA status bar theme color
    const currentTheme = THEMES.find((t) => t.id === theme);
    if (currentTheme) {
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute(
        'content',
        currentTheme.isDark ? currentTheme.previewBg : currentTheme.previewPrimary
      );
    }
  }, [theme]);

  return <>{children}</>;
}
