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

// Enhanced font configuration with fallbacks for better reliability
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true, // Added for performance
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'], // Added for reliability
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Sparkle Universe - Where Fans Become Stars',
    template: '%s | Sparkle Universe',
  },
  description: 'The next-generation community platform for Sparkle YouTube fans. Connect, create, and celebrate your passion in a vibrant, feature-rich environment.',
  keywords: ['Sparkle', 'YouTube', 'community', 'blog', 'forum', 'fan platform', 'content creation', 'gamification'], // Enhanced keywords
  authors: [{ name: 'Sparkle Universe Team' }],
  creator: 'Sparkle Universe',
  publisher: 'Sparkle Universe',
  formatDetection: { // Added to prevent auto-detection issues
    email: false,
    address: false,
    telephone: false,
  },
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
      { url: '/favicon.ico', sizes: 'any' }, // Added sizes for clarity
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' }, // Added for PWA
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' }, // Added for PWA
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }, // Added specifications
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#8B5CF6', // Added theme color
      },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  verification: { // Added for search console verification
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
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
                // Also set color-scheme for native elements
                document.documentElement.style.colorScheme = theme;
              } catch (e) {
                // Fallback to dark theme if localStorage fails
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              }
            `,
          }}
        />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <link rel="preconnect" href="https://www.google-analytics.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" />
          </>
        )}
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
                storageKey="theme" // Added to match FOUC prevention script
              >
                <div className="relative flex min-h-screen flex-col">
                  <div className="flex-1">
                    {children}
                  </div>
                </div>
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
