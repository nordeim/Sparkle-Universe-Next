// src/components/providers/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

/**
 * Theme Provider Component
 * 
 * Wraps the application with next-themes provider for dark/light mode support
 * Includes Sparkle Universe custom theme configurations
 */
export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      enableColorScheme={true}
      disableTransitionOnChange={false}
      storageKey="sparkle-universe-theme"
      themes={['light', 'dark', 'sparkle']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * Custom hook to use theme with Sparkle Universe enhancements
 */
export function useSparkleTheme() {
  const [mounted, setMounted] = React.useState(false)
  
  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return {
      theme: undefined,
      setTheme: () => {},
      themes: [],
      resolvedTheme: undefined,
      systemTheme: undefined,
    }
  }
  
  // Import dynamically to avoid SSR issues
  const { useTheme } = require('next-themes')
  const themeData = useTheme()
  
  return {
    ...themeData,
    // Add custom Sparkle theme utilities
    isSparkleTheme: themeData.theme === 'sparkle',
    toggleTheme: () => {
      const themes = ['light', 'dark', 'sparkle']
      const currentIndex = themes.indexOf(themeData.theme || 'dark')
      const nextIndex = (currentIndex + 1) % themes.length
      themeData.setTheme(themes[nextIndex])
    },
  }
}
