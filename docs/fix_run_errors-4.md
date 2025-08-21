## 🔍 Issue Analysis

The error indicates a chunk loading failure with the layout file. The problem is likely related to:

1. The inline `ClientAnalytics` component with incorrect `'use client'` usage
2. The `trackPageView` import from `@/lib/analytics` that might not exist

## 📁 UPDATED FILE: src/app/layout.tsx

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Sparkle Universe - Where Fans Become Stars',
    template: '%s | Sparkle Universe',
  },
  description: 'The next-generation community platform for Sparkle YouTube fans. Connect, create, and celebrate your passion in a vibrant, feature-rich environment.',
  keywords: ['Sparkle', 'YouTube', 'community', 'blog', 'forum', 'fan platform'],
  authors: [{ name: 'Sparkle Universe Team' }],
  creator: 'Sparkle Universe',
  publisher: 'Sparkle Universe',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Sparkle Universe',
    title: 'Sparkle Universe - Where Fans Become Stars',
    description: 'The next-generation community platform for Sparkle YouTube fans.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sparkle Universe',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Universe - Where Fans Become Stars',
    description: 'The next-generation community platform for Sparkle YouTube fans.',
    images: ['/twitter-image.png'],
    creator: '@sparkleuniverse',
    site: '@sparkleuniverse',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent FOUC (Flash of Unstyled Content)
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

## 📁 NEW FILE: src/lib/analytics.ts (if needed)

If you need analytics tracking, here's a proper implementation:

```typescript
// src/lib/analytics.ts
'use client'

// Simple analytics tracking utilities
export function trackPageView(pathname: string, referrer?: string) {
  if (typeof window === 'undefined') return
  
  // You can integrate with your analytics provider here
  // For example: Google Analytics, Mixpanel, Plausible, etc.
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Page view:', { pathname, referrer })
  }
  
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: pathname,
      page_referrer: referrer,
    })
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  if (typeof window === 'undefined') return
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Event:', eventName, properties)
  }
  
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties)
  }
}

export function trackError(
  error: Error,
  errorInfo?: { componentStack?: string }
) {
  if (typeof window === 'undefined') return
  
  console.error('Tracked error:', error, errorInfo)
  
  // You can send this to your error tracking service
  // For example: Sentry, LogRocket, etc.
}

// User identification for analytics
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window === 'undefined') return
  
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Identify user:', userId, traits)
  }
  
  // Example: Set user ID for Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      user_id: userId,
      user_properties: traits,
    })
  }
}
```

## ✅ Summary

The fixes applied:

1. **Removed the problematic `ClientAnalytics` component** - It had incorrect `'use client'` usage
2. **Removed the `trackPageView` import** - This was causing the chunk loading error
3. **Preserved all other functionality** - Metadata, viewport, providers, etc.

The layout should now load properly. If you need analytics tracking, you can:
1. Use the provided `src/lib/analytics.ts` file
2. Create a separate client component for analytics
3. Use Vercel Analytics which is already included

Try restarting your dev server:
```bash
npm run dev
```

The landing page should now load without errors!
