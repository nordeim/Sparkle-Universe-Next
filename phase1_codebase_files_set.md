# package.json
```json
# File: package.json
{
  "name": "sparkle-universe",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate",
    "prepare": "husky install"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.0.12",
    "@hookform/resolvers": "^3.3.4",
    "@prisma/client": "^5.8.1",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.17.9",
    "@tanstack/react-query-devtools": "^5.17.9",
    "@tiptap/extension-link": "^2.1.16",
    "@tiptap/extension-placeholder": "^2.1.16",
    "@tiptap/pm": "^2.1.16",
    "@tiptap/react": "^2.1.16",
    "@tiptap/starter-kit": "^2.1.16",
    "@trpc/client": "^10.45.0",
    "@trpc/next": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "@vercel/analytics": "^1.1.1",
    "@vercel/speed-insights": "^1.0.2",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.2.0",
    "framer-motion": "^10.18.0",
    "googleapis": "^130.0.0",
    "ioredis": "^5.3.2",
    "lucide-react": "^0.312.0",
    "next": "^15.0.0",
    "next-auth": "^5.0.0-beta.4",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.2",
    "socket.io": "^4.7.4",
    "socket.io-client": "^4.7.4",
    "superjson": "^2.2.1",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/react": "^14.1.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.18.1",
    "@typescript-eslint/parser": "^6.18.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "lint-staged": "^15.2.0",
    "postcss": "^8.4.33",
    "prettier": "^3.2.2",
    "prettier-plugin-tailwindcss": "^0.5.11",
    "prisma": "^5.8.1",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.2.5"
}

```

# tsconfig.json
```json
# File: tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/server/*": ["./src/server/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/**/*",
    "prisma/**/*"
  ],
  "exclude": ["node_modules", "dist", ".next", "out", "coverage"]
}

```

# src/app/api-docs/page.tsx
```tsx
// src/app/api-docs/page.tsx
'use client'

import { useEffect } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  useEffect(() => {
    // Add custom styles
    const style = document.createElement('style')
    style.textContent = `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 50px }
      .swagger-ui .info .title { color: #8B5CF6 }
      .swagger-ui .btn.authorize { background-color: #8B5CF6; border-color: #8B5CF6 }
      .swagger-ui .btn.authorize:hover { background-color: #7C3AED; border-color: #7C3AED }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sparkle Universe API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete API reference for developers
          </p>
        </div>
        <SwaggerUI 
          url="/api/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={-1}
          displayRequestDuration={true}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          persistAuthorization={true}
        />
      </div>
    </div>
  )
}

```

# src/app/api/admin/jobs/route.ts
```ts
// src/app/api/admin/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/auth'
import { getQueueStats, jobs } from '@/lib/jobs/job-processor'
import { logger } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    // Get queue statistics
    const stats = await getQueueStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Failed to get job stats', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get job statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const body = await request.json()
    const { queue, job, data } = body

    // Validate queue and job exist
    if (!jobs[queue as keyof typeof jobs]) {
      return NextResponse.json(
        { success: false, error: 'Invalid queue' },
        { status: 400 }
      )
    }

    if (!jobs[queue as keyof typeof jobs][job as any]) {
      return NextResponse.json(
        { success: false, error: 'Invalid job type' },
        { status: 400 }
      )
    }

    // Create job
    const jobInstance = await jobs[queue as keyof typeof jobs][job as any](data)

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobInstance.id,
        queue,
        job,
      },
    })
  } catch (error) {
    logger.error('Failed to create job', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

```

# src/app/api/auth/[...nextauth]/route.ts
```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

```

# src/app/api/openapi.json/route.ts
```ts
// src/app/api/openapi.json/route.ts
import { NextResponse } from 'next/server'
import { generateOpenAPIDocument } from '@/lib/openapi'

export async function GET() {
  const document = generateOpenAPIDocument()
  return NextResponse.json(document)
}

```

# src/app/layout.tsx
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
import { trackPageView } from '@/lib/analytics'
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

// Track page views on route changes
function ClientAnalytics() {
  'use client'
  
  if (typeof window !== 'undefined') {
    trackPageView(window.location.pathname, document.referrer)
  }
  
  return null
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
                <ClientAnalytics />
              </ThemeProvider>
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

```

# src/components/error-boundary.tsx
```tsx
// src/components/error-boundary.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { trackError } from '@/lib/monitoring'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    trackError(error, {
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest,
    })
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Oops! Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We apologize for the inconvenience. An error occurred while loading this page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-6 max-w-full overflow-auto rounded-lg bg-gray-100 p-4 text-left text-sm dark:bg-gray-800">
            <code>{error.message}</code>
          </pre>
        )}
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Async error boundary for Next.js app directory
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

```

# src/components/providers/auth-provider.tsx
```tsx
// src/components/providers/auth-provider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Handle session refresh on focus
  useEffect(() => {
    const handleFocus = () => {
      // Trigger session refresh when window regains focus
      if (document.visibilityState === 'visible') {
        const event = new Event('visibilitychange')
        document.dispatchEvent(event)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <SessionProvider
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}

```

# src/components/ui/button.tsx
```tsx
// src/components/ui/button.tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        sparkle:
          'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300',
        glow:
          'relative bg-primary text-primary-foreground shadow-[0_0_1rem_0_rgba(var(--primary),0.5)] hover:shadow-[0_0_1.5rem_0_rgba(var(--primary),0.7)] transition-all duration-300',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }

```

# src/emails/templates/index.tsx
```tsx
// src/emails/templates/index.tsx
import React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Preview,
} from '@react-email/components'

// Base layout component
interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ preview, children }) => (
  <Html>
    <Head>
      <style>
        {`
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2') format('woff2');
          }
          
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `}
      </style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
            alt="Sparkle Universe"
            width="150"
            height="50"
          />
        </Section>
        {children}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            © 2025 Sparkle Universe. All rights reserved.
          </Text>
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`} style={footerLink}>
            Unsubscribe
          </Link>
          {' • '}
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/privacy`} style={footerLink}>
            Privacy Policy
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  padding: '40px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
}

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e8e8e8',
  margin: '40px 0 20px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8a8a8a',
  fontSize: '14px',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#8B5CF6',
  fontSize: '14px',
  textDecoration: 'none',
}

// Welcome Email Template
export const WelcomeEmail = ({ name, username, verificationUrl, profileUrl }: any) => (
  <BaseLayout preview="Welcome to Sparkle Universe! Verify your email to get started.">
    <Section>
      <Text style={heading}>Welcome to Sparkle Universe, {name}! 🎉</Text>
      <Text style={text}>
        We're thrilled to have you join our vibrant community of Sparkle fans!
        Your journey in the Sparkle Universe begins now.
      </Text>
      <Text style={text}>
        To get started, please verify your email address:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={verificationUrl} style={button}>
          Verify Email Address
        </Button>
      </Section>
      <Text style={text}>
        Here's what you can do next:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        <li>Complete your profile and earn your first achievement</li>
        <li>Follow your favorite creators and topics</li>
        <li>Create your first post and introduce yourself</li>
        <li>Join groups that match your interests</li>
      </ul>
      <Text style={text}>
        Your profile: <Link href={profileUrl}>@{username}</Link>
      </Text>
    </Section>
  </BaseLayout>
)

// Password Reset Email
export const PasswordResetEmail = ({ resetUrl, expiresIn }: any) => (
  <BaseLayout preview="Reset your Sparkle Universe password">
    <Section>
      <Text style={heading}>Reset Your Password</Text>
      <Text style={text}>
        We received a request to reset your password. If you didn't make this request,
        you can safely ignore this email.
      </Text>
      <Text style={text}>
        To reset your password, click the button below:
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetUrl} style={button}>
          Reset Password
        </Button>
      </Section>
      <Text style={text}>
        This link will expire in {expiresIn}. If the link has expired,
        you can request a new one from the login page.
      </Text>
      <Text style={{ ...text, fontSize: '14px', color: '#8a8a8a' }}>
        If you're having trouble clicking the button, copy and paste this URL
        into your browser: {resetUrl}
      </Text>
    </Section>
  </BaseLayout>
)

// Verification Email
export const VerificationEmail = ({ code, expiresIn }: any) => (
  <BaseLayout preview="Verify your email address">
    <Section>
      <Text style={heading}>Verify Your Email Address</Text>
      <Text style={text}>
        Enter this verification code to confirm your email address:
      </Text>
      <Section style={{ 
        textAlign: 'center', 
        margin: '32px 0',
        padding: '24px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
      }}>
        <Text style={{ 
          ...heading, 
          fontSize: '32px',
          letterSpacing: '8px',
          color: '#8B5CF6',
        }}>
          {code}
        </Text>
      </Section>
      <Text style={text}>
        This code will expire in {expiresIn}.
      </Text>
    </Section>
  </BaseLayout>
)

// Notification Emails
export const PostLikedEmail = ({ user, notification }: any) => (
  <BaseLayout preview="Someone liked your post!">
    <Section>
      <Text style={heading}>Your post got some love! ❤️</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} just liked your post "{notification.postTitle}".
        Your content is resonating with the community!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.postUrl} style={button}>
          View Your Post
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const CommentNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview="New comment on your post">
    <Section>
      <Text style={heading}>New comment on your post 💬</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.actorName} commented on your post "{notification.postTitle}":
      </Text>
      <Section style={{
        margin: '24px 0',
        padding: '16px',
        backgroundColor: '#f6f9fc',
        borderRadius: '8px',
        borderLeft: '4px solid #8B5CF6',
      }}>
        <Text style={{ ...text, margin: 0 }}>
          "{notification.commentPreview}"
        </Text>
      </Section>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.commentUrl} style={button}>
          Reply to Comment
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const NewFollowerEmail = ({ user, notification }: any) => (
  <BaseLayout preview="You have a new follower!">
    <Section>
      <Text style={heading}>You have a new follower! 🌟</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.followerName} is now following you. Check out their profile
        and see if you'd like to follow them back!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Profile
        </Button>
      </Section>
      <Text style={text}>
        You now have {notification.totalFollowers} followers. Keep creating great content!
      </Text>
    </Section>
  </BaseLayout>
)

export const AchievementEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Achievement Unlocked: ${notification.achievementName}!`}>
    <Section>
      <Text style={heading}>Achievement Unlocked! 🏆</Text>
      <Text style={text}>
        Congratulations {user.name}!
      </Text>
      <Text style={text}>
        You've unlocked the "{notification.achievementName}" achievement!
      </Text>
      <Section style={{
        textAlign: 'center',
        margin: '32px 0',
      }}>
        <Img
          src={notification.achievementImage}
          alt={notification.achievementName}
          width="120"
          height="120"
        />
      </Section>
      <Text style={text}>
        {notification.achievementDescription}
      </Text>
      <Text style={text}>
        Rewards: +{notification.xpReward} XP, +{notification.pointsReward} Sparkle Points
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.achievementsUrl} style={button}>
          View All Achievements
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const LevelUpEmail = ({ user, notification }: any) => (
  <BaseLayout preview={`Level ${notification.level} Reached!`}>
    <Section>
      <Text style={heading}>Level Up! You're now Level {notification.level}! 🎉</Text>
      <Text style={text}>
        Amazing work, {user.name}!
      </Text>
      <Text style={text}>
        You've reached Level {notification.level} in Sparkle Universe! 
        This is a testament to your dedication and contribution to our community.
      </Text>
      <Text style={text}>
        New perks unlocked:
      </Text>
      <ul style={{ ...text, paddingLeft: '20px' }}>
        {notification.perks.map((perk: string, index: number) => (
          <li key={index}>{perk}</li>
        ))}
      </ul>
      <Text style={text}>
        Bonus reward: +{notification.bonusPoints} Sparkle Points!
      </Text>
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={notification.profileUrl} style={button}>
          View Your Progress
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

export const WeeklyDigestEmail = ({ name, posts, newFollowers, achievementsUnlocked, week }: any) => (
  <BaseLayout preview="Your weekly Sparkle Universe digest">
    <Section>
      <Text style={heading}>Your Weekly Sparkle Digest ✨</Text>
      <Text style={text}>
        Hi {name},
      </Text>
      <Text style={text}>
        Here's what happened in your Sparkle Universe this week:
      </Text>
      
      <Section style={{ margin: '32px 0' }}>
        <Text style={{ ...heading, fontSize: '20px' }}>📊 Your Stats</Text>
        <ul style={{ ...text, paddingLeft: '20px' }}>
          <li>{newFollowers} new followers</li>
          <li>{achievementsUnlocked} achievements unlocked</li>
        </ul>
      </Section>

      {posts.length > 0 && (
        <Section style={{ margin: '32px 0' }}>
          <Text style={{ ...heading, fontSize: '20px' }}>🔥 Top Posts from People You Follow</Text>
          {posts.map((post: any, index: number) => (
            <Section key={index} style={{
              margin: '16px 0',
              padding: '16px',
              backgroundColor: '#f6f9fc',
              borderRadius: '8px',
            }}>
              <Text style={{ ...text, fontWeight: 'bold', margin: '0 0 8px' }}>
                {post.title}
              </Text>
              <Text style={{ ...text, fontSize: '14px', margin: '0 0 8px' }}>
                by {post.author.username} • {post.likes} likes
              </Text>
              <Link href={post.url} style={{ ...footerLink, fontSize: '14px' }}>
                Read more →
              </Link>
            </Section>
          ))}
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={`${process.env.NEXT_PUBLIC_APP_URL}/feed`} style={button}>
          Explore More Content
        </Button>
      </Section>
    </Section>
  </BaseLayout>
)

// System Notification Email (fallback)
export const SystemNotificationEmail = ({ user, notification }: any) => (
  <BaseLayout preview={notification.title}>
    <Section>
      <Text style={heading}>{notification.title}</Text>
      <Text style={text}>
        Hi {user.name},
      </Text>
      <Text style={text}>
        {notification.message}
      </Text>
      {notification.actionUrl && (
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={notification.actionUrl} style={button}>
            {notification.actionText || 'View Details'}
          </Button>
        </Section>
      )}
    </Section>
  </BaseLayout>
)

// Add more email templates as needed...
export const MentionEmail = SystemNotificationEmail
export const CommentLikedEmail = SystemNotificationEmail
export const GroupInviteEmail = SystemNotificationEmail
export const GroupPostEmail = SystemNotificationEmail
export const EventReminderEmail = SystemNotificationEmail
export const WatchPartyInviteEmail = SystemNotificationEmail
export const DirectMessageEmail = SystemNotificationEmail
export const YouTubePremiereEmail = SystemNotificationEmail
export const QuestCompleteEmail = SystemNotificationEmail
export const TradeRequestEmail = SystemNotificationEmail
export const ContentFeaturedEmail = SystemNotificationEmail
export const MilestoneEmail = SystemNotificationEmail

```

# src/hooks/use-auth.ts
```ts
// src/hooks/use-auth.ts
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { UserRole } from '@prisma/client'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const login = useCallback(
    async (provider?: string, options?: Record<string, any>) => {
      try {
        const result = await signIn(provider, {
          redirect: false,
          ...options,
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        if (result?.ok) {
          router.refresh()
          router.push(options?.callbackUrl || '/')
        }

        return result
      } catch (error) {
        console.error('Login error:', error)
        throw error
      }
    },
    [router]
  )

  const logout = useCallback(
    async (options?: { callbackUrl?: string }) => {
      try {
        await signOut({
          redirect: false,
          ...options,
        })
        router.push(options?.callbackUrl || '/')
      } catch (error) {
        console.error('Logout error:', error)
        throw error
      }
    },
    [router]
  )

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!session?.user) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(session.user.role)
    },
    [session]
  )

  const hasMinimumRole = useCallback(
    (minimumRole: UserRole) => {
      if (!session?.user) return false

      const roleHierarchy: Record<UserRole, number> = {
        USER: 1,
        CREATOR: 2,
        VERIFIED_CREATOR: 3,
        MODERATOR: 4,
        ADMIN: 5,
      }

      return roleHierarchy[session.user.role] >= roleHierarchy[minimumRole]
    },
    [session]
  )

  return {
    user: session?.user,
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    update,
    login,
    logout,
    hasRole,
    hasMinimumRole,
  }
}

```

# src/hooks/use-socket.ts
```ts
// src/hooks/use-socket.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/monitoring'
import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/socket/socket-server'

type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<SocketInstance | null>(null)

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !autoConnect) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: {
        token: session.user.id, // In production, use proper session token
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    }) as SocketInstance

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      logger.info('Socket connected', { socketId: socket.id })
      setIsConnected(true)
      setIsConnecting(false)
    })

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { reason })
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error)
      setIsConnecting(false)
    })

    socket.on('error', ({ message, code }) => {
      logger.error('Socket error:', { message, code })
    })

    // Set up global event handlers
    setupGlobalHandlers(socket, queryClient)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [session, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

  // Emit event helper
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (!socketRef.current?.connected) {
      logger.warn('Socket not connected, cannot emit event', { event })
      return
    }
    socketRef.current.emit(event, ...args)
  }, [])

  // Subscribe to event helper
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.on(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // One-time event listener
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.once(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) return
    
    if (handler) {
      socketRef.current.off(event, handler)
    } else {
      socketRef.current.off(event)
    }
  }, [])

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (!socketRef.current || socketRef.current.connected) return
    setIsConnecting(true)
    socketRef.current.connect()
  }, [])

  const disconnect = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return
    socketRef.current.disconnect()
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    emit,
    on,
    once,
    off,
    connect,
    disconnect,
  }
}

// Global event handlers that update React Query cache
function setupGlobalHandlers(socket: SocketInstance, queryClient: ReturnType<typeof useQueryClient>) {
  // Notification handlers
  socket.on('notification', (notification) => {
    // Update notifications query
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return { items: [notification], nextCursor: null, hasMore: false }
      return {
        ...old,
        items: [notification, ...old.items],
      }
    })

    // Show toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  })

  socket.on('unreadCountUpdate', (count) => {
    queryClient.setQueryData(['notifications', 'unreadCount'], count)
  })

  // Post updates
  socket.on('postUpdated', (post) => {
    queryClient.setQueryData(['post', post.id], post)
    
    // Update in lists
    queryClient.setQueriesData(
      { queryKey: ['posts'], exact: false },
      (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === post.id ? post : item
            ),
          })),
        }
      }
    )
  })

  // Comment updates
  socket.on('commentCreated', (comment) => {
    queryClient.setQueryData(
      ['comments', comment.postId],
      (old: any) => {
        if (!old) return { items: [comment], nextCursor: null, hasMore: false }
        return {
          ...old,
          items: [comment, ...old.items],
        }
      }
    )
  })

  // Reaction updates
  socket.on('reactionAdded', ({ entityType, entityId, counts }) => {
    const queryKey = entityType === 'post' 
      ? ['post', entityId] 
      : ['comment', entityId]
    
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      return {
        ...old,
        reactionCounts: counts,
      }
    })
  })
}

// Specialized hooks for specific features
export function usePresence() {
  const { emit, on, off } = useSocket()
  
  const updatePresence = useCallback((status: string, location?: string) => {
    emit('updatePresence', { status, location })
  }, [emit])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000) // Send heartbeat every 4 minutes

    return () => clearInterval(interval)
  }, [updatePresence])

  return { updatePresence }
}

export function useTypingIndicator(channelId: string, channelType: string = 'conversation') {
  const { emit, on, off } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string }>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = ({ userId, username }: any) => {
      setTypingUsers(prev => new Map(prev).set(userId, { username }))
    }

    const handleUserStoppedTyping = ({ userId }: any) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
    }

    const unsubscribeTyping = on('userTyping', handleUserTyping)
    const unsubscribeStoppedTyping = on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      unsubscribeTyping()
      unsubscribeStoppedTyping()
    }
  }, [on, channelId])

  const startTyping = useCallback(() => {
    emit('startTyping', { channelId, channelType })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { channelId, channelType })
    }, 3000)
  }, [emit, channelId, channelType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    emit('stopTyping', { channelId, channelType })
  }, [emit, channelId, channelType])

  return {
    typingUsers: Array.from(typingUsers.values()),
    startTyping,
    stopTyping,
  }
}

export function useRealtimePost(postId: string) {
  const { emit, on, off, isConnected } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to post updates
    emit('subscribeToPost', postId)

    // Set up specific handlers for this post
    const handleReaction = (data: any) => {
      if (data.entityType === 'post' && data.entityId === postId) {
        queryClient.setQueryData(['post', postId, 'reactions'], data.counts)
      }
    }

    const unsubscribe = on('reactionAdded', handleReaction)

    return () => {
      emit('unsubscribeFromPost', postId)
      unsubscribe()
    }
  }, [postId, isConnected, emit, on, queryClient])
}

```

# src/lib/analytics.ts
```ts
// src/lib/analytics.ts
import { logger } from '@/lib/monitoring'

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

// Page view event
export interface PageViewEvent {
  path: string
  referrer?: string
  userId?: string
}

// Custom events
export type CustomEventName =
  | 'user_signup'
  | 'user_login'
  | 'post_created'
  | 'post_liked'
  | 'post_shared'
  | 'comment_created'
  | 'profile_updated'
  | 'achievement_unlocked'
  | 'level_up'
  | 'purchase_completed'
  | 'search_performed'
  | 'video_watched'
  | 'feature_used'

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private queue: AnalyticsEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start flush interval
    if (!this.isDevelopment) {
      this.flushInterval = setInterval(() => this.flush(), 30000) // 30 seconds
    }
  }

  // Track page view
  trackPageView(event: PageViewEvent): void {
    this.track('page_view', {
      path: event.path,
      referrer: event.referrer,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      title: typeof document !== 'undefined' ? document.title : undefined,
    })
  }

  // Track custom event
  track(
    eventName: CustomEventName | string,
    properties?: Record<string, any>,
    userId?: string
  ): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      userId,
      timestamp: new Date(),
    }

    if (this.isDevelopment) {
      logger.debug('Analytics event', event)
      return
    }

    // Add to queue
    this.queue.push(event)

    // Flush if queue is getting large
    if (this.queue.length >= 50) {
      this.flush()
    }

    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties)
    }

    // Send to PostHog if available
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, properties)
    }
  }

  // Identify user
  identify(userId: string, traits?: Record<string, any>): void {
    if (this.isDevelopment) {
      logger.debug('Analytics identify', { userId, traits })
      return
    }

    // PostHog identify
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, traits)
    }

    // Google Analytics user ID
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
        user_id: userId,
      })
    }
  }

  // Track timing
  trackTiming(
    category: string,
    variable: string,
    value: number,
    label?: string
  ): void {
    this.track('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_value: value,
      timing_label: label,
    })
  }

  // Track error
  trackError(error: Error, fatal: boolean = false): void {
    this.track('exception', {
      description: error.message,
      stack: error.stack,
      fatal,
    })
  }

  // Flush events to analytics service
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      // Send to your analytics endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      })

      if (!response.ok) {
        throw new Error(`Analytics flush failed: ${response.status}`)
      }
    } catch (error) {
      logger.error('Failed to flush analytics', error)
      // Re-add events to queue for retry
      this.queue.unshift(...events)
    }
  }

  // Clean up
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush()
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Helper functions
export function trackPageView(path: string, referrer?: string): void {
  analytics.trackPageView({ path, referrer })
}

export function trackEvent(
  eventName: CustomEventName | string,
  properties?: Record<string, any>
): void {
  analytics.track(eventName, properties)
}

export function identifyUser(
  userId: string,
  traits?: Record<string, any>
): void {
  analytics.identify(userId, traits)
}

// React hook for analytics
export function useAnalytics() {
  return {
    track: trackEvent,
    trackPageView,
    identify: identifyUser,
    trackTiming: analytics.trackTiming.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  }
}

// Next.js specific helpers
export function trackServerEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  // Server-side tracking would go directly to analytics service
  logger.info('Server analytics event', { eventName, properties })
}

// Declare global types
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    posthog?: any
  }
}

```

# src/lib/auth/auth.config.ts
```ts
// src/lib/auth/auth.config.ts
import { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      username: string
      role: UserRole
      image: string | null
      email: string
    }
  }

  interface User {
    username: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/welcome',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0] + Math.random().toString(36).slice(2, 6),
          role: 'USER' as UserRole,
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
          role: 'USER' as UserRole,
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            username: true,
            hashedPassword: true,
            role: true,
            image: true,
            status: true,
            emailVerified: true,
          },
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials')
        }

        if (user.status === 'BANNED') {
          throw new Error('Account banned')
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Account suspended')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check if user is banned
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        select: { status: true },
      })

      if (existingUser?.status === 'BANNED') {
        return false
      }

      // For OAuth sign-ins, ensure username is unique
      if (account?.provider !== 'credentials') {
        const userWithUsername = await db.user.findUnique({
          where: { username: user.username },
        })

        if (userWithUsername && userWithUsername.email !== user.email) {
          // Generate a unique username
          user.username = user.username + Math.random().toString(36).slice(2, 6)
        }
      }

      return true
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }

      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
      }

      // Update user's last seen
      if (token.id) {
        await db.user.update({
          where: { id: token.id },
          data: { lastSeenAt: new Date() },
        }).catch(() => {
          // Silently fail - this is not critical
        })
      }

      return token
    },
    redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser) {
        // Create default profile
        await db.profile.create({
          data: {
            userId: user.id!,
            displayName: user.name || user.username,
          },
        })

        // Send welcome notification
        await db.notification.create({
          data: {
            type: 'SYSTEM',
            userId: user.id!,
            title: 'Welcome to Sparkle Universe!',
            message: "We're excited to have you join our community. Start by completing your profile and making your first post!",
          },
        })
      }
    },
    async createUser({ user }) {
      console.log('New user created:', user.email)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

```

# src/lib/auth/auth.ts
```ts
// src/lib/auth/auth.ts
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { authOptions } from './auth.config'
import { UserRole } from '@prisma/client'

/**
 * Get the current user's session on the server
 * This is cached per request
 */
export const getServerAuth = cache(async () => {
  const session = await getServerSession(authOptions)
  return session
})

/**
 * Get the current user or redirect to login
 */
export async function requireAuth() {
  const session = await getServerAuth()
  
  if (!session?.user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/'))
  }
  
  return session
}

/**
 * Require a specific role or redirect
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  
  if (!roles.includes(session.user.role)) {
    redirect('/unauthorized')
  }
  
  return session
}

/**
 * Get current user ID or null
 */
export async function getCurrentUserId() {
  const session = await getServerAuth()
  return session?.user?.id || null
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole | UserRole[]) {
  const session = await getServerAuth()
  if (!session) return false
  
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(session.user.role)
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getServerAuth()
  return !!session?.user
}

/**
 * Role hierarchy for permission checking
 */
const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  CREATOR: 2,
  VERIFIED_CREATOR: 3,
  MODERATOR: 4,
  ADMIN: 5,
}

/**
 * Check if user has at least the specified role level
 */
export async function hasMinimumRole(minimumRole: UserRole) {
  const session = await getServerAuth()
  if (!session) return false
  
  return roleHierarchy[session.user.role] >= roleHierarchy[minimumRole]
}

```

# src/lib/db.ts
```ts
// src/lib/db.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/monitoring'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with enhanced configuration
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Enhanced query logging in development
if (process.env.NODE_ENV === 'development') {
  db.$on('query' as never, (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    })
  })
}

// Error logging
db.$on('error' as never, (e: any) => {
  logger.error('Database error:', e)
})

// Middleware for soft deletes
db.$use(async (params, next) => {
  // Models that support soft delete
  const softDeleteModels = ['User', 'Post', 'Comment', 'Group', 'Event']
  
  if (softDeleteModels.includes(params.model || '')) {
    if (params.action === 'delete') {
      params.action = 'update'
      params.args['data'] = { deletedAt: new Date() }
    }
    
    if (params.action === 'deleteMany') {
      params.action = 'updateMany'
      if (params.args.data !== undefined) {
        params.args.data['deletedAt'] = new Date()
      } else {
        params.args['data'] = { deletedAt: new Date() }
      }
    }
    
    // Exclude soft deleted records from queries
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, deletedAt: null }
    }
    
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where['deletedAt'] = null
        }
      } else {
        params.args['where'] = { deletedAt: null }
      }
    }
  }
  
  return next(params)
})

// Middleware for automatic updatedAt
db.$use(async (params, next) => {
  if (params.action === 'update' || params.action === 'updateMany') {
    params.args.data = {
      ...params.args.data,
      updatedAt: new Date(),
    }
  }
  
  return next(params)
})

// Middleware for version control (optimistic locking)
db.$use(async (params, next) => {
  const versionedModels = ['User', 'Post', 'UserBalance', 'Trade']
  
  if (versionedModels.includes(params.model || '') && params.action === 'update') {
    const { where, data } = params.args
    
    // Increment version on update
    if (data.version === undefined) {
      data.version = { increment: 1 }
    }
    
    // Add version check to where clause
    if (where.version !== undefined) {
      const currentVersion = where.version
      delete where.version
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { version: currentVersion }
      ]
    }
  }
  
  const result = await next(params)
  
  // Check if update affected any rows
  if (params.action === 'update' && result === null) {
    throw new Error('Optimistic lock error: Record was modified by another process')
  }
  
  return result
})

// Database error handler with specific error types
export function handleDatabaseError(error: unknown): never {
  logger.error('Database error:', error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = error.meta?.target as string[]
        throw new Error(`Duplicate value for ${target?.join(', ') || 'field'}`)
      case 'P2025':
        throw new Error('Record not found')
      case 'P2003':
        throw new Error('Foreign key constraint failed')
      case 'P2014':
        throw new Error('Invalid ID provided')
      default:
        throw new Error(`Database error: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  if (error instanceof Error) {
    throw error
  }
  
  throw new Error('An unknown database error occurred')
}

// Enhanced transaction helper with retry logic
export async function transaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
    maxRetries?: number
  }
): Promise<T> {
  const { maxRetries = 3, ...txOptions } = options || {}
  
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        maxWait: txOptions.maxWait || 5000,
        timeout: txOptions.timeout || 10000,
        isolationLevel: txOptions.isolationLevel,
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw error
      }
      
      // Check if error is retryable
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2024'].includes(error.code) && // Transaction conflicts
        attempt < maxRetries
      ) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

// Batch operations helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await operation(batch)
    results.push(...batchResults)
  }
  
  return results
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database connection check failed:', error)
    return false
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect()
}

```

# src/lib/events/event-emitter.ts
```ts
// src/lib/events/event-emitter.ts
import { EventEmitter } from 'events'
import { logger } from '@/lib/monitoring'

export interface SystemEvents {
  // User events
  'user:created': { user: any }
  'user:updated': { user: any }
  'user:deleted': { userId: string }
  'user:statusChanged': { user: any; status: string; reason?: string }
  'user:levelUp': { userId: string; oldLevel: number; newLevel: number }
  
  // Auth events
  'auth:login': { userId: string; ipAddress: string }
  'auth:logout': { sessionToken: string }
  'auth:emailVerified': { userId: string }
  'auth:passwordReset': { userId: string }
  'auth:sendVerificationEmail': { userId: string; email: string; code: string }
  'auth:sendPasswordResetEmail': { userId: string; email: string; token: string }
  
  // Notification events
  'notification:created': { notification: any }
  'notification:read': { notification: any }
  'notification:allRead': { userId: string }
  'notification:deleted': { notification: any }
  
  // Post events
  'post:created': { post: any }
  'post:updated': { post: any }
  'post:deleted': { postId: string }
  'post:published': { post: any }
  'post:liked': { postId: string; userId: string }
  'post:viewed': { postId: string; userId: string }
  
  // Comment events
  'comment:created': { comment: any }
  'comment:updated': { comment: any }
  'comment:deleted': { commentId: string }
  
  // Achievement events
  'achievement:unlocked': { userId: string; achievementId: string }
  'achievement:progress': { userId: string; achievementId: string; progress: number }
  
  // System events
  'system:error': { error: Error; context?: any }
  'system:warning': { message: string; context?: any }
  'system:info': { message: string; context?: any }
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof SystemEvents>(
    event: K,
    data: SystemEvents[K]
  ): boolean {
    logger.debug(`Event emitted: ${event}`, data)
    return super.emit(event, data)
  }

  on<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.on(event, listener)
  }

  once<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.once(event, listener)
  }

  off<K extends keyof SystemEvents>(
    event: K,
    listener: (data: SystemEvents[K]) => void
  ): this {
    return super.off(event, listener)
  }

  removeAllListeners<K extends keyof SystemEvents>(event?: K): this {
    return super.removeAllListeners(event)
  }
}

// Create singleton instance
export const eventEmitter = new TypedEventEmitter()

// Set max listeners to prevent memory leaks warning
eventEmitter.setMaxListeners(50)

// Error handling
eventEmitter.on('error', (error) => {
  logger.error('EventEmitter error:', error)
})

// System event handlers
eventEmitter.on('system:error', ({ error, context }) => {
  logger.error('System error event:', error, context)
})

eventEmitter.on('system:warning', ({ message, context }) => {
  logger.warn('System warning event:', message, context)
})

eventEmitter.on('system:info', ({ message, context }) => {
  logger.info('System info event:', message, context)
})

// Export event types for use in other files
export type { SystemEvents }

```

# src/lib/jobs/job-processor.ts
```ts
// src/lib/jobs/job-processor.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { db } from '@/lib/db'
import { EmailService } from '@/services/email.service'
import { NotificationService } from '@/services/notification.service'
import { eventEmitter } from '@/lib/events/event-emitter'

// Job queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  IMAGE_PROCESSING: 'image-processing',
  VIDEO_PROCESSING: 'video-processing',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  ACHIEVEMENT: 'achievement',
  LEADERBOARD: 'leaderboard',
  YOUTUBE_SYNC: 'youtube-sync',
  CONTENT_MODERATION: 'content-moderation',
} as const

// Job types
export interface JobData {
  [QUEUE_NAMES.EMAIL]: {
    type: 'send' | 'bulk' | 'digest'
    payload: any
  }
  [QUEUE_NAMES.NOTIFICATION]: {
    type: 'create' | 'bulk' | 'cleanup'
    payload: any
  }
  [QUEUE_NAMES.IMAGE_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.VIDEO_PROCESSING]: {
    fileId: string
    operations: string[]
  }
  [QUEUE_NAMES.ANALYTICS]: {
    type: 'pageview' | 'event' | 'aggregate'
    payload: any
  }
  [QUEUE_NAMES.CLEANUP]: {
    type: 'expired-notifications' | 'old-logs' | 'temp-files'
  }
  [QUEUE_NAMES.ACHIEVEMENT]: {
    userId: string
    type: 'check' | 'unlock'
    achievementId?: string
  }
  [QUEUE_NAMES.LEADERBOARD]: {
    type: 'update' | 'calculate' | 'reset'
    leaderboardType: string
  }
  [QUEUE_NAMES.YOUTUBE_SYNC]: {
    channelId: string
    type: 'videos' | 'channel' | 'analytics'
  }
  [QUEUE_NAMES.CONTENT_MODERATION]: {
    contentType: 'post' | 'comment' | 'message'
    contentId: string
  }
}

// Job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 100,
  },
  removeOnFail: {
    age: 24 * 3600, // 24 hours
  },
}

// Create queues
export const queues: Record<keyof typeof QUEUE_NAMES, Queue> = {} as any

Object.entries(QUEUE_NAMES).forEach(([key, name]) => {
  queues[key as keyof typeof QUEUE_NAMES] = new Queue(name, {
    connection: redis.duplicate(),
    defaultJobOptions,
  })
})

// Queue events for monitoring
const queueEvents: Record<string, QueueEvents> = {}

Object.values(QUEUE_NAMES).forEach((name) => {
  const events = new QueueEvents(name, {
    connection: redis.duplicate(),
  })

  events.on('completed', ({ jobId, returnvalue }) => {
    logger.info(`Job completed: ${name}:${jobId}`)
  })

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed: ${name}:${jobId}`, { reason: failedReason })
  })

  events.on('stalled', ({ jobId }) => {
    logger.warn(`Job stalled: ${name}:${jobId}`)
  })

  queueEvents[name] = events
})

// Job processors
export function startJobProcessors() {
  // Email processor
  new Worker<JobData[typeof QUEUE_NAMES.EMAIL]>(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'send':
          await EmailService.sendEmail(payload)
          break
        case 'bulk':
          await EmailService.sendBulkEmails(
            payload.recipients,
            payload.template,
            payload.data,
            payload.options
          )
          break
        case 'digest':
          await EmailService.sendWeeklyDigest(payload.userId)
          break
        default:
          throw new Error(`Unknown email job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Notification processor
  new Worker<JobData[typeof QUEUE_NAMES.NOTIFICATION]>(
    QUEUE_NAMES.NOTIFICATION,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'create':
          await NotificationService.createNotification(payload.input, payload.options)
          break
        case 'bulk':
          await NotificationService.createBulkNotifications(
            payload.userIds,
            payload.template,
            payload.options
          )
          break
        case 'cleanup':
          await NotificationService.cleanupExpiredNotifications()
          break
        default:
          throw new Error(`Unknown notification job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 10,
    }
  )

  // Analytics processor
  new Worker<JobData[typeof QUEUE_NAMES.ANALYTICS]>(
    QUEUE_NAMES.ANALYTICS,
    async (job) => {
      const { type, payload } = job.data

      switch (type) {
        case 'pageview':
          await processPageView(payload)
          break
        case 'event':
          await processAnalyticsEvent(payload)
          break
        case 'aggregate':
          await aggregateAnalytics(payload)
          break
        default:
          throw new Error(`Unknown analytics job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 20,
    }
  )

  // Cleanup processor
  new Worker<JobData[typeof QUEUE_NAMES.CLEANUP]>(
    QUEUE_NAMES.CLEANUP,
    async (job) => {
      const { type } = job.data

      switch (type) {
        case 'expired-notifications':
          await cleanupExpiredNotifications()
          break
        case 'old-logs':
          await cleanupOldLogs()
          break
        case 'temp-files':
          await cleanupTempFiles()
          break
        default:
          throw new Error(`Unknown cleanup job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 1,
    }
  )

  // Achievement processor
  new Worker<JobData[typeof QUEUE_NAMES.ACHIEVEMENT]>(
    QUEUE_NAMES.ACHIEVEMENT,
    async (job) => {
      const { userId, type, achievementId } = job.data

      switch (type) {
        case 'check':
          await checkUserAchievements(userId)
          break
        case 'unlock':
          if (achievementId) {
            await unlockAchievement(userId, achievementId)
          }
          break
        default:
          throw new Error(`Unknown achievement job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  // Leaderboard processor
  new Worker<JobData[typeof QUEUE_NAMES.LEADERBOARD]>(
    QUEUE_NAMES.LEADERBOARD,
    async (job) => {
      const { type, leaderboardType } = job.data

      switch (type) {
        case 'update':
          await updateLeaderboard(leaderboardType)
          break
        case 'calculate':
          await calculateLeaderboard(leaderboardType)
          break
        case 'reset':
          await resetLeaderboard(leaderboardType)
          break
        default:
          throw new Error(`Unknown leaderboard job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 3,
    }
  )

  // YouTube sync processor
  new Worker<JobData[typeof QUEUE_NAMES.YOUTUBE_SYNC]>(
    QUEUE_NAMES.YOUTUBE_SYNC,
    async (job) => {
      const { channelId, type } = job.data

      switch (type) {
        case 'videos':
          await syncYouTubeVideos(channelId)
          break
        case 'channel':
          await syncYouTubeChannel(channelId)
          break
        case 'analytics':
          await syncYouTubeAnalytics(channelId)
          break
        default:
          throw new Error(`Unknown YouTube sync job type: ${type}`)
      }
    },
    {
      connection: redis.duplicate(),
      concurrency: 2,
    }
  )

  // Content moderation processor
  new Worker<JobData[typeof QUEUE_NAMES.CONTENT_MODERATION]>(
    QUEUE_NAMES.CONTENT_MODERATION,
    async (job) => {
      const { contentType, contentId } = job.data
      await moderateContent(contentType, contentId)
    },
    {
      connection: redis.duplicate(),
      concurrency: 5,
    }
  )

  logger.info('Job processors started')
}

// Helper functions for job processing
async function processPageView(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: 'pageview',
      eventType: 'pageview',
      properties: payload,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function processAnalyticsEvent(payload: any) {
  await db.analyticsEvent.create({
    data: {
      eventName: payload.name,
      eventType: 'custom',
      properties: payload.properties,
      context: payload.context,
      userId: payload.userId,
    },
  })
}

async function aggregateAnalytics(payload: any) {
  // Aggregate analytics data
  const { period, type } = payload
  logger.info('Aggregating analytics', { period, type })
  // Implementation would aggregate data into summary tables
}

async function cleanupExpiredNotifications() {
  const deleted = await db.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  logger.info(`Cleaned up ${deleted.count} expired notifications`)
}

async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [auditLogs, loginHistory, analyticsEvents] = await Promise.all([
    db.auditLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.loginHistory.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.analyticsEvent.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } },
    }),
  ])

  logger.info('Cleaned up old logs', {
    auditLogs: auditLogs.count,
    loginHistory: loginHistory.count,
    analyticsEvents: analyticsEvents.count,
  })
}

async function cleanupTempFiles() {
  // Clean up temporary files older than 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const tempFiles = await db.mediaFile.findMany({
    where: {
      metadata: { path: ['temp'], equals: true },
      createdAt: { lt: yesterday },
    },
  })

  for (const file of tempFiles) {
    // Delete from storage (implement storage deletion)
    await db.mediaFile.delete({ where: { id: file.id } })
  }

  logger.info(`Cleaned up ${tempFiles.length} temporary files`)
}

async function checkUserAchievements(userId: string) {
  // Check all achievement criteria for a user
  const achievements = await db.achievement.findMany({
    where: {
      userAchievements: {
        none: { userId },
      },
    },
  })

  for (const achievement of achievements) {
    // Check if user meets criteria (implement criteria checking)
    const meetsCriteria = await checkAchievementCriteria(userId, achievement)
    
    if (meetsCriteria) {
      await unlockAchievement(userId, achievement.id)
    }
  }
}

async function checkAchievementCriteria(userId: string, achievement: any): Promise<boolean> {
  // Implement achievement criteria checking based on achievement.criteria
  return false // Placeholder
}

async function unlockAchievement(userId: string, achievementId: string) {
  const achievement = await db.achievement.findUnique({
    where: { id: achievementId },
  })

  if (!achievement) return

  // Create user achievement
  await db.userAchievement.create({
    data: {
      userId,
      achievementId,
      progress: 1,
      showcased: false,
    },
  })

  // Award rewards
  await db.userBalance.update({
    where: { userId },
    data: {
      sparklePoints: { increment: achievement.sparklePointsReward },
    },
  })

  // Create notification
  await NotificationService.createNotification({
    type: 'ACHIEVEMENT_UNLOCKED',
    userId,
    title: `Achievement Unlocked: ${achievement.name}!`,
    message: achievement.description || '',
    data: {
      achievementId,
      achievementName: achievement.name,
      xpReward: achievement.xpReward,
      pointsReward: achievement.sparklePointsReward,
    },
  })

  eventEmitter.emit('achievement:unlocked', { userId, achievementId })
}

async function updateLeaderboard(type: string) {
  // Update specific leaderboard
  logger.info(`Updating leaderboard: ${type}`)
  // Implementation would update leaderboard entries
}

async function calculateLeaderboard(type: string) {
  // Calculate leaderboard from scratch
  logger.info(`Calculating leaderboard: ${type}`)
  // Implementation would recalculate entire leaderboard
}

async function resetLeaderboard(type: string) {
  // Reset leaderboard for new period
  logger.info(`Resetting leaderboard: ${type}`)
  // Implementation would archive old leaderboard and start new
}

async function syncYouTubeVideos(channelId: string) {
  // Sync videos from YouTube channel
  logger.info(`Syncing YouTube videos for channel: ${channelId}`)
  // Implementation would use YouTube API to sync videos
}

async function syncYouTubeChannel(channelId: string) {
  // Sync channel info from YouTube
  logger.info(`Syncing YouTube channel: ${channelId}`)
  // Implementation would use YouTube API to sync channel data
}

async function syncYouTubeAnalytics(channelId: string) {
  // Sync analytics from YouTube
  logger.info(`Syncing YouTube analytics for channel: ${channelId}`)
  // Implementation would use YouTube Analytics API
}

async function moderateContent(contentType: string, contentId: string) {
  // Moderate content using AI
  logger.info(`Moderating ${contentType}: ${contentId}`)
  // Implementation would use AI service for content moderation
}

// Job scheduling
export function scheduleRecurringJobs() {
  // Schedule cleanup jobs
  queues.CLEANUP.add(
    'expired-notifications',
    { type: 'expired-notifications' },
    {
      repeat: {
        pattern: '0 2 * * *', // 2 AM daily
      },
    }
  )

  queues.CLEANUP.add(
    'old-logs',
    { type: 'old-logs' },
    {
      repeat: {
        pattern: '0 3 * * 0', // 3 AM Sunday
      },
    }
  )

  queues.CLEANUP.add(
    'temp-files',
    { type: 'temp-files' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  // Schedule leaderboard updates
  queues.LEADERBOARD.add(
    'hourly-update',
    { type: 'update', leaderboardType: 'hourly' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  queues.LEADERBOARD.add(
    'daily-reset',
    { type: 'reset', leaderboardType: 'daily' },
    {
      repeat: {
        pattern: '0 0 * * *', // Midnight
      },
    }
  )

  queues.LEADERBOARD.add(
    'weekly-reset',
    { type: 'reset', leaderboardType: 'weekly' },
    {
      repeat: {
        pattern: '0 0 * * 1', // Monday midnight
      },
    }
  )

  logger.info('Recurring jobs scheduled')
}

// Queue monitoring
export async function getQueueStats() {
  const stats: Record<string, any> = {}

  for (const [name, queue] of Object.entries(queues)) {
    const counts = await queue.getJobCounts()
    const isPaused = await queue.isPaused()
    
    stats[name] = {
      ...counts,
      isPaused,
    }
  }

  return stats
}

// Graceful shutdown
export async function shutdownJobProcessors() {
  logger.info('Shutting down job processors...')

  // Close all workers
  for (const queue of Object.values(queues)) {
    await queue.close()
  }

  // Close all event listeners
  for (const events of Object.values(queueEvents)) {
    await events.close()
  }

  logger.info('Job processors shut down')
}

// Export job creation helpers
export const jobs = {
  email: {
    send: (payload: any) => queues.EMAIL.add('send', { type: 'send', payload }),
    bulk: (payload: any) => queues.EMAIL.add('bulk', { type: 'bulk', payload }),
    digest: (userId: string) => queues.EMAIL.add('digest', { type: 'digest', payload: { userId } }),
  },
  notification: {
    create: (input: any, options?: any) => 
      queues.NOTIFICATION.add('create', { type: 'create', payload: { input, options } }),
    bulk: (userIds: string[], template: any, options?: any) =>
      queues.NOTIFICATION.add('bulk', { type: 'bulk', payload: { userIds, template, options } }),
  },
  achievement: {
    check: (userId: string) => 
      queues.ACHIEVEMENT.add('check', { userId, type: 'check' }),
    unlock: (userId: string, achievementId: string) =>
      queues.ACHIEVEMENT.add('unlock', { userId, type: 'unlock', achievementId }),
  },
  youtube: {
    syncVideos: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-videos', { channelId, type: 'videos' }),
    syncChannel: (channelId: string) =>
      queues.YOUTUBE_SYNC.add('sync-channel', { channelId, type: 'channel' }),
  },
  moderation: {
    check: (contentType: 'post' | 'comment' | 'message', contentId: string) =>
      queues.CONTENT_MODERATION.add('moderate', { contentType, contentId }),
  },
}

```

# src/lib/monitoring.ts
```ts
// src/lib/monitoring.ts
import { headers } from 'next/headers'
import { eventEmitter } from '@/lib/events/event-emitter'

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log context interface
interface LogContext {
  [key: string]: any
}

// Performance timing interface
interface PerformanceTiming {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: any
}

// Logger class
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, context)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.log(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        // Send error to monitoring service
        this.sendToMonitoring('error', message, context)
        break
    }
  }

  private sendToMonitoring(type: string, message: string, context?: LogContext): void {
    // In production, send to monitoring service (e.g., Sentry, DataDog)
    if (!this.isDevelopment) {
      // Implementation would go here
      // Example: Sentry.captureException(new Error(message), { extra: context })
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, error?: any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    }
    this.log(LogLevel.ERROR, message, errorContext)
  }
}

// Performance monitoring
class PerformanceMonitor {
  private timings = new Map<string, PerformanceTiming>()

  start(name: string, metadata?: any): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    })
  }

  end(name: string): PerformanceTiming | null {
    const timing = this.timings.get(name)
    if (!timing) {
      logger.warn(`Performance timing '${name}' not found`)
      return null
    }

    timing.endTime = performance.now()
    timing.duration = timing.endTime - timing.startTime

    this.timings.delete(name)

    // Log slow operations
    if (timing.duration > 1000) {
      logger.warn(`Slow operation detected: ${name}`, {
        duration: `${timing.duration.toFixed(2)}ms`,
        metadata: timing.metadata,
      })
    }

    return timing
  }

  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      const timing = this.end(name)
      if (timing) {
        logger.debug(`Performance: ${name}`, {
          duration: `${timing.duration?.toFixed(2)}ms`,
        })
      }
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// Request tracking
export async function trackRequest(request: Request) {
  try {
    const url = new URL(request.url)
    const method = request.method
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'

    logger.info('Request', {
      method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent,
      referer,
    })
  } catch (error) {
    logger.error('Failed to track request', error)
  }
}

// Error tracking
export function trackError(error: Error, context?: any) {
  logger.error('Application error', error, context)
  
  // Emit error event
  eventEmitter.emit('system:error', { error, context })
}

// Custom metrics
class Metrics {
  private counters = new Map<string, number>()
  private gauges = new Map<string, number>()
  private histograms = new Map<string, number[]>()

  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)
  }

  decrement(name: string, value: number = 1): void {
    this.increment(name, -value)
  }

  gauge(name: string, value: number): void {
    this.gauges.set(name, value)
  }

  histogram(name: string, value: number): void {
    const values = this.histograms.get(name) || []
    values.push(value)
    this.histograms.set(name, values)
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    }
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
  }
}

// Web Vitals tracking
export function trackWebVitals(metric: {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
}) {
  logger.info('Web Vital', {
    name: metric.name,
    value: metric.value.toFixed(2),
    rating: metric.rating,
  })

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      non_interaction: true,
    })
  }
}

// Export instances
export const logger = new Logger()
export const performance = new PerformanceMonitor()
export const metrics = new Metrics()

// Re-export for convenience
export { trackError as captureException }

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
      type: 'unhandledRejection',
    })
  })

  window.addEventListener('error', (event) => {
    trackError(event.error, {
      type: 'windowError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}

```

# src/lib/openapi.ts
```ts
// src/lib/openapi.ts
import { OpenAPIV3 } from 'openapi-types'

export function generateOpenAPIDocument(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Sparkle Universe API',
      version: '1.0.0',
      description: 'The next-generation community platform for Sparkle YouTube fans',
      contact: {
        name: 'Sparkle Universe Support',
        email: 'support@sparkle-universe.com',
        url: 'https://sparkle-universe.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Current environment',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Posts',
        description: 'Blog post endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
      {
        name: 'Upload',
        description: 'File upload endpoints',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          description: 'Create a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'username'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                    username: {
                      type: 'string',
                      minLength: 3,
                      maxLength: 30,
                      pattern: '^[a-zA-Z0-9_]+$',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' },
                },
              },
            },
          },
        },
      },
      '/api/users/{username}': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          description: 'Get public user profile by username',
          parameters: [
            {
              name: 'username',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/UserProfile' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List posts',
          description: 'Get paginated list of posts',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: {
                type: 'integer',
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
                maximum: 100,
              },
            },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['recent', 'popular', 'trending'],
                default: 'recent',
              },
            },
            {
              name: 'category',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'tag',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of posts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Post' },
                          },
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Posts'],
          summary: 'Create post',
          description: 'Create a new blog post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: {
                      type: 'string',
                      maxLength: 255,
                    },
                    content: {
                      type: 'string',
                    },
                    excerpt: {
                      type: 'string',
                      maxLength: 500,
                    },
                    coverImage: {
                      type: 'string',
                      format: 'uri',
                    },
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    published: {
                      type: 'boolean',
                      default: false,
                    },
                    categoryId: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Post created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/posts/{id}': {
        get: {
          tags: ['Posts'],
          summary: 'Get post',
          description: 'Get a single post by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Post details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/PostDetail' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Post not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Posts'],
          summary: 'Update post',
          description: 'Update an existing post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    excerpt: { type: 'string' },
                    coverImage: { type: 'string' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    published: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Post updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Posts'],
          summary: 'Delete post',
          description: 'Delete a post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '204': {
              description: 'Post deleted successfully',
            },
          },
        },
      },
      '/api/posts/{id}/comments': {
        get: {
          tags: ['Comments'],
          summary: 'Get post comments',
          description: 'Get comments for a post',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
            {
              name: 'cursor',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of comments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Comment' },
                          },
                          nextCursor: { type: 'string', nullable: true },
                          hasMore: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Comments'],
          summary: 'Create comment',
          description: 'Add a comment to a post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 5000,
                    },
                    parentId: {
                      type: 'string',
                      nullable: true,
                    },
                    youtubeTimestamp: {
                      type: 'integer',
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Comment created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Comment' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/upload/presigned-url': {
        post: {
          tags: ['Upload'],
          summary: 'Get presigned upload URL',
          description: 'Get a presigned URL for direct file upload to S3',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filename', 'contentType', 'fileSize'],
                  properties: {
                    filename: {
                      type: 'string',
                    },
                    contentType: {
                      type: 'string',
                    },
                    fileSize: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Presigned URL generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          uploadUrl: { type: 'string' },
                          fileId: { type: 'string' },
                          key: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notifications',
          description: 'Get user notifications',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cursor',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
              },
            },
            {
              name: 'unreadOnly',
              in: 'query',
              schema: {
                type: 'boolean',
                default: false,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Notification' },
                          },
                          nextCursor: { type: 'string', nullable: true },
                          hasMore: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          description: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Notification marked as read',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            image: { type: 'string', nullable: true },
            role: {
              type: 'string',
              enum: ['USER', 'CREATOR', 'VERIFIED_CREATOR', 'MODERATOR', 'ADMIN'],
            },
            level: { type: 'integer' },
            experience: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                bio: { type: 'string', nullable: true },
                profile: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string' },
                    location: { type: 'string' },
                    website: { type: 'string' },
                    socialLinks: {
                      type: 'object',
                      properties: {
                        twitter: { type: 'string' },
                        instagram: { type: 'string' },
                        youtube: { type: 'string' },
                      },
                    },
                  },
                },
                stats: {
                  type: 'object',
                  properties: {
                    posts: { type: 'integer' },
                    followers: { type: 'integer' },
                    following: { type: 'integer' },
                  },
                },
              },
            },
          ],
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            coverImage: { type: 'string', nullable: true },
            published: { type: 'boolean' },
            views: { type: 'integer' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            _count: {
              type: 'object',
              properties: {
                comments: { type: 'integer' },
                reactions: { type: 'integer' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        PostDetail: {
          allOf: [
            { $ref: '#/components/schemas/Post' },
            {
              type: 'object',
              properties: {
                content: { type: 'string' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                    },
                  },
                },
                category: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
            },
          ],
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            edited: { type: 'boolean' },
            youtubeTimestamp: { type: 'integer', nullable: true },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            _count: {
              type: 'object',
              properties: {
                reactions: { type: 'integer' },
                replies: { type: 'integer' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            editedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: [
                'POST_LIKED',
                'POST_COMMENTED',
                'COMMENT_LIKED',
                'USER_FOLLOWED',
                'ACHIEVEMENT_UNLOCKED',
                'LEVEL_UP',
                'MENTION',
                'SYSTEM',
              ],
            },
            title: { type: 'string' },
            message: { type: 'string' },
            read: { type: 'boolean' },
            actor: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        ValidationError: {
          allOf: [
            { $ref: '#/components/schemas/Error' },
            {
              type: 'object',
              properties: {
                fields: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
              },
            },
          ],
        },
      },
    },
  }
}

```

# src/lib/rate-limit.ts
```ts
// src/lib/rate-limit.ts
import { redis, redisHelpers } from '@/lib/redis'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import { logger } from '@/lib/monitoring'

export interface RateLimitConfig {
  interval: number // Time window in seconds
  uniqueTokenPerInterval: number // Max requests per interval
  prefix?: string // Key prefix for Redis
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Default rate limit configurations
export const rateLimitConfigs = {
  api: {
    interval: 60, // 1 minute
    uniqueTokenPerInterval: 100,
    prefix: 'rl:api',
  },
  auth: {
    interval: 900, // 15 minutes
    uniqueTokenPerInterval: 5,
    prefix: 'rl:auth',
  },
  write: {
    interval: 60, // 1 minute
    uniqueTokenPerInterval: 10,
    prefix: 'rl:write',
  },
  upload: {
    interval: 3600, // 1 hour
    uniqueTokenPerInterval: 20,
    prefix: 'rl:upload',
  },
} as const

// Get identifier from request
export function getIdentifier(req?: NextRequest): string {
  if (!req) {
    // Server-side call, try to get from headers
    const headersList = headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    return ip
  }

  // Get IP from request
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  
  // You could also use user ID if authenticated
  // const userId = req.headers.get('x-user-id')
  // if (userId) return `user:${userId}`
  
  return ip
}

// Main rate limiting function
export async function rateLimit(
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const id = identifier || getIdentifier()
  const key = `${config.prefix}:${id}`
  
  try {
    const { allowed, remaining, resetAt } = await redisHelpers.rateLimiting.checkLimit(
      key,
      config.uniqueTokenPerInterval,
      config.interval
    )

    const result: RateLimitResult = {
      success: allowed,
      limit: config.uniqueTokenPerInterval,
      remaining,
      reset: resetAt,
    }

    if (!allowed) {
      result.retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
      logger.warn('Rate limit exceeded', { identifier: id, config: config.prefix })
    }

    return result
  } catch (error) {
    // If Redis is down, we'll allow the request but log the error
    logger.error('Rate limit check failed', error)
    
    return {
      success: true,
      limit: config.uniqueTokenPerInterval,
      remaining: config.uniqueTokenPerInterval,
      reset: new Date(Date.now() + config.interval * 1000),
    }
  }
}

// Rate limit middleware helper for API routes
export async function withRateLimit(
  config: RateLimitConfig,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await rateLimit(config)
  
  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  }
  
  if (!result.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        ...headers,
        'Retry-After': result.retryAfter!.toString(),
      },
    })
  }
  
  const response = await handler()
  
  // Add rate limit headers to successful responses
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

// User-specific rate limiting
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(config, `user:${userId}`)
}

// Action-specific rate limiting
export async function rateLimitByAction(
  userId: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(config, `${userId}:${action}`)
}

// Sliding window rate limiter for more accurate limiting
export async function slidingWindowRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs
  const key = `sliding:${identifier}`
  
  // Remove old entries
  await redis.zremrangebyscore(key, '-inf', windowStart)
  
  // Count current window
  const currentCount = await redis.zcard(key)
  
  if (currentCount >= maxRequests) {
    // Get oldest entry to calculate retry after
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES')
    const oldestTime = oldestEntry[1] ? parseInt(oldestEntry[1]) : now
    const retryAfter = Math.ceil((oldestTime + windowMs - now) / 1000)
    
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(oldestTime + windowMs),
      retryAfter,
    }
  }
  
  // Add current request
  await redis.zadd(key, now, `${now}:${Math.random()}`)
  await redis.expire(key, Math.ceil(windowMs / 1000))
  
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - currentCount - 1,
    reset: new Date(now + windowMs),
  }
}

// Reset rate limit for a specific identifier
export async function resetRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<void> {
  const key = `${config.prefix}:${identifier}`
  await redisHelpers.rateLimiting.resetLimit(key)
}

```

# src/lib/redis.ts
```ts
// src/lib/redis.ts
import Redis from 'ioredis'
import { logger } from '@/lib/monitoring'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisPassword = process.env.REDIS_PASSWORD

// Create Redis client with retry strategy
export const redis = new Redis(redisUrl, {
  password: redisPassword,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`)
    return delay
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true
    }
    return false
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Redis pub/sub client (separate connection)
export const redisPub = redis.duplicate()
export const redisSub = redis.duplicate()

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis connected')
})

redis.on('error', (error) => {
  logger.error('Redis error:', error)
})

redis.on('close', () => {
  logger.warn('Redis connection closed')
})

// Helper functions for common operations
export const redisHelpers = {
  // Set with expiration
  async setex(key: string, seconds: number, value: any): Promise<void> {
    await redis.setex(key, seconds, JSON.stringify(value))
  },

  // Get and parse JSON
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },

  // Set JSON with optional expiration
  async setJSON(key: string, value: any, expirationSeconds?: number): Promise<void> {
    const json = JSON.stringify(value)
    if (expirationSeconds) {
      await redis.setex(key, expirationSeconds, json)
    } else {
      await redis.set(key, json)
    }
  },

  // Increment with expiration
  async incrWithExpire(key: string, expirationSeconds: number): Promise<number> {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, expirationSeconds)
    const results = await multi.exec()
    return results?.[0]?.[1] as number
  },

  // Cache wrapper function
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await redisHelpers.getJSON<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache
    const value = await fetcher()
    await redisHelpers.setJSON(key, value, ttlSeconds)
    return value
  },

  // Delete keys by pattern
  async deletePattern(pattern: string): Promise<number> {
    const keys = await redis.keys(pattern)
    if (keys.length === 0) return 0
    return await redis.del(...keys)
  },

  // Session management
  session: {
    async set(sessionId: string, data: any, ttlSeconds: number = 86400): Promise<void> {
      await redisHelpers.setJSON(`session:${sessionId}`, data, ttlSeconds)
    },

    async get<T>(sessionId: string): Promise<T | null> {
      return await redisHelpers.getJSON<T>(`session:${sessionId}`)
    },

    async delete(sessionId: string): Promise<void> {
      await redis.del(`session:${sessionId}`)
    },

    async extend(sessionId: string, ttlSeconds: number = 86400): Promise<void> {
      await redis.expire(`session:${sessionId}`, ttlSeconds)
    },
  },

  // Rate limiting helpers
  rateLimiting: {
    async checkLimit(
      identifier: string,
      maxRequests: number,
      windowSeconds: number
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
      const key = `rate_limit:${identifier}`
      const current = await redisHelpers.incrWithExpire(key, windowSeconds)
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt: new Date(Date.now() + windowSeconds * 1000),
      }
    },

    async resetLimit(identifier: string): Promise<void> {
      await redis.del(`rate_limit:${identifier}`)
    },
  },

  // Leaderboard helpers
  leaderboard: {
    async addScore(
      leaderboardKey: string,
      userId: string,
      score: number
    ): Promise<void> {
      await redis.zadd(leaderboardKey, score, userId)
    },

    async getTopUsers(
      leaderboardKey: string,
      count: number = 10
    ): Promise<Array<{ userId: string; score: number; rank: number }>> {
      const results = await redis.zrevrange(leaderboardKey, 0, count - 1, 'WITHSCORES')
      const users: Array<{ userId: string; score: number; rank: number }> = []
      
      for (let i = 0; i < results.length; i += 2) {
        users.push({
          userId: results[i],
          score: parseFloat(results[i + 1]),
          rank: i / 2 + 1,
        })
      }
      
      return users
    },

    async getUserRank(leaderboardKey: string, userId: string): Promise<number | null> {
      const rank = await redis.zrevrank(leaderboardKey, userId)
      return rank === null ? null : rank + 1
    },
  },
}

// Connection check
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    logger.error('Redis connection check failed:', error)
    return false
  }
}

// Cleanup function
export async function disconnectRedis(): Promise<void> {
  await redis.quit()
  await redisPub.quit()
  await redisSub.quit()
}

```

# src/lib/security.ts
```ts
// src/lib/security.ts
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { logger } from '@/lib/monitoring'
import { LoginHistory, SecurityAlert } from '@prisma/client'

// Constants - UPDATED to match PRD requirements
const SALT_ROUNDS = 12
const PASSWORD_MIN_LENGTH = 12 // PRD requirement: 12 characters minimum
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Schema constraints from Prisma
export const SCHEMA_LIMITS = {
  USERNAME_MAX: 50,      // username VARCHAR(50)
  EMAIL_MAX: 255,        // email VARCHAR(255)
  POST_TITLE_MAX: 500,   // title VARCHAR(500)
  BIO_MAX: 5000,         // bio TEXT (practical limit)
  COMMENT_MAX: 10000,    // content TEXT (practical limit)
} as const

// IP address utilities
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  return 'unknown'
}

// Enhanced password hashing with pepper
export async function hashPassword(password: string): Promise<string> {
  const pepper = process.env.PASSWORD_PEPPER || ''
  const pepperedPassword = password + pepper
  return bcrypt.hash(pepperedPassword, SALT_ROUNDS)
}

// Verify password with pepper
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const pepper = process.env.PASSWORD_PEPPER || ''
  const pepperedPassword = password + pepper
  return bcrypt.compare(pepperedPassword, hashedPassword)
}

// Generate secure token with optional prefix
export function generateSecureToken(length: number = 32, prefix?: string): string {
  const token = randomBytes(length).toString('hex')
  return prefix ? `${prefix}_${token}` : token
}

// Generate verification code
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  const bytes = randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10]
  }
  
  return code
}

// Encryption utilities for sensitive data
export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const iv = randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = (cipher as any).getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

export function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  (decipher as any).setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Enhanced password validation with PRD requirements
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // PRD requirement: minimum 12 characters
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  } else {
    score += 20
  }

  // Additional length bonus
  if (password.length >= 16) score += 10
  if (password.length >= 20) score += 10

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 15
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 15
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 15
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else {
    score += 15
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'password123', '123456789012', 'qwerty123456',
    'sparkle123456', 'admin1234567', 'letmein12345', 'welcome12345',
    'password1234', '12345678901', 'qwertyuiop12', 'sparkleverse'
  ]
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common or contains common phrases')
    score = Math.max(0, score - 30)
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score = Math.max(0, score - 10)
  }

  return {
    valid: errors.length === 0 && score >= 60,
    errors,
    score: Math.min(100, score),
  }
}

// Field validation with schema constraints
export function validateField(field: string, value: string): {
  valid: boolean
  error?: string
} {
  switch (field) {
    case 'username':
      if (value.length > SCHEMA_LIMITS.USERNAME_MAX) {
        return { 
          valid: false, 
          error: `Username must be ${SCHEMA_LIMITS.USERNAME_MAX} characters or less` 
        }
      }
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        return { 
          valid: false, 
          error: 'Username can only contain letters, numbers, and underscores' 
        }
      }
      return { valid: true }

    case 'email':
      if (value.length > SCHEMA_LIMITS.EMAIL_MAX) {
        return { 
          valid: false, 
          error: `Email must be ${SCHEMA_LIMITS.EMAIL_MAX} characters or less` 
        }
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' }
      }
      return { valid: true }

    case 'postTitle':
      if (value.length > SCHEMA_LIMITS.POST_TITLE_MAX) {
        return { 
          valid: false, 
          error: `Title must be ${SCHEMA_LIMITS.POST_TITLE_MAX} characters or less` 
        }
      }
      return { valid: true }

    default:
      return { valid: true }
  }
}

// 2FA Implementation
export const twoFactorAuth = {
  // Generate 2FA secret
  generateSecret(email: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Sparkle Universe (${email})`,
      issuer: 'Sparkle Universe',
      length: 32,
    })

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    }
  },

  // Generate QR code for 2FA setup
  async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      logger.error('Failed to generate QR code', error)
      throw new Error('Failed to generate QR code')
    }
  },

  // Verify 2FA token
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps tolerance
    })
  },

  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
  },

  // Encrypt 2FA secret for storage
  encryptSecret(secret: string): string {
    const encrypted = encrypt(secret)
    return JSON.stringify(encrypted)
  },

  // Decrypt 2FA secret
  decryptSecret(encryptedSecret: string): string {
    const parsed = JSON.parse(encryptedSecret)
    return decrypt(parsed)
  },
}

// Login attempt tracking with enhanced security
export async function trackLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  reason?: string
): Promise<LoginHistory> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Parse user agent for better tracking
    const location = await getLocationFromIP(ipAddress)

    const loginHistory = await db.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        location,
        success,
        reason,
      },
    })

    // Check for suspicious activity
    if (!success) {
      await checkSuspiciousActivity(user.id, ipAddress)
    } else {
      // Check for new device/location
      await checkNewDeviceOrLocation(user.id, ipAddress, userAgent, location)
    }

    return loginHistory
  } catch (error) {
    logger.error('Failed to track login attempt:', error)
    throw error
  }
}

// Get approximate location from IP (placeholder)
async function getLocationFromIP(ip: string): Promise<string | null> {
  // In production, use a service like MaxMind or IPGeolocation
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
    return 'Local Development'
  }
  
  // Placeholder - would integrate with geolocation service
  return null
}

// Enhanced suspicious activity checking
async function checkSuspiciousActivity(
  userId: string,
  ipAddress: string
): Promise<void> {
  const recentAttempts = await db.loginHistory.count({
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - LOCKOUT_DURATION),
      },
    },
  })

  if (recentAttempts >= MAX_LOGIN_ATTEMPTS) {
    await createSecurityAlert(
      userId,
      'MULTIPLE_FAILED_LOGINS',
      'Multiple Failed Login Attempts',
      `${recentAttempts} failed login attempts detected from IP: ${ipAddress}`,
      'high'
    )

    // Lock account
    await db.user.update({
      where: { id: userId },
      data: { 
        accountLockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
        accountLockoutAttempts: recentAttempts,
      },
    })
  }

  // Check for rapid attempts from different IPs (possible attack)
  const differentIPs = await db.loginHistory.groupBy({
    by: ['ipAddress'],
    where: {
      userId,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - 3600000), // Last hour
      },
    },
    _count: true,
  })

  if (differentIPs.length > 5) {
    await createSecurityAlert(
      userId,
      'DISTRIBUTED_LOGIN_ATTEMPTS',
      'Login Attempts from Multiple IPs',
      `Failed login attempts from ${differentIPs.length} different IP addresses`,
      'critical'
    )
  }
}

// Check for new device or location
async function checkNewDeviceOrLocation(
  userId: string,
  ipAddress: string,
  userAgent: string,
  location: string | null
): Promise<void> {
  // Check if this is a new IP
  const knownIp = await db.loginHistory.findFirst({
    where: {
      userId,
      ipAddress,
      success: true,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
  })

  if (!knownIp) {
    await createSecurityAlert(
      userId,
      'NEW_IP_LOGIN',
      'Login from New IP Address',
      `Successful login from new IP address: ${ipAddress}${location ? ` (${location})` : ''}`,
      'medium'
    )
  }

  // Check for unusual time patterns
  const currentHour = new Date().getHours()
  const usualLoginHours = await db.loginHistory.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      success: true,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  })

  // Analyze login patterns (simplified)
  const hourCounts = new Map<number, number>()
  usualLoginHours.forEach(login => {
    const hour = new Date(login.createdAt).getHours()
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
  })

  const avgLogins = Array.from(hourCounts.values()).reduce((a, b) => a + b, 0) / hourCounts.size
  const currentHourLogins = hourCounts.get(currentHour) || 0

  if (currentHourLogins === 0 && hourCounts.size > 10) {
    await createSecurityAlert(
      userId,
      'UNUSUAL_LOGIN_TIME',
      'Login at Unusual Time',
      `Login detected at ${currentHour}:00, which is outside your usual login pattern`,
      'low'
    )
  }
}

// Enhanced security alert creation
export async function createSecurityAlert(
  userId: string,
  type: string,
  title: string,
  description: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<SecurityAlert> {
  const alert = await db.securityAlert.create({
    data: {
      userId,
      type,
      title,
      description,
      severity,
    },
  })

  // Send notification based on severity
  if (severity === 'high' || severity === 'critical') {
    await db.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: `🚨 Security Alert: ${title}`,
        message: description,
        data: { alertId: alert.id, severity },
        priority: severity === 'critical' ? 3 : 2,
      },
    })

    // For critical alerts, also send email immediately
    if (severity === 'critical') {
      // Queue email notification
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (user) {
        // This would trigger email service
        logger.warn('Critical security alert - email queued', { 
          userId, 
          email: user.email,
          alertType: type 
        })
      }
    }
  }

  logger.warn('Security alert created:', { userId, type, severity })
  return alert
}

// CSRF token generation and validation
export const csrf = {
  generate(): string {
    return generateSecureToken(32, 'csrf')
  },

  validate(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    return token === sessionToken
  },

  // Generate and store CSRF token in Redis
  async generateAndStore(sessionId: string): Promise<string> {
    const token = this.generate()
    const { redis } = await import('@/lib/redis')
    await redis.setex(`csrf:${sessionId}`, 3600, token) // 1 hour expiry
    return token
  },

  // Validate CSRF token from Redis
  async validateFromStore(sessionId: string, token: string): Promise<boolean> {
    const { redis } = await import('@/lib/redis')
    const storedToken = await redis.get(`csrf:${sessionId}`)
    return storedToken === token
  },
}

// Enhanced input sanitization
export function sanitizeInput(input: string, type: 'text' | 'html' | 'sql' = 'text'): string {
  let sanitized = input.trim()

  switch (type) {
    case 'html':
      // For HTML content, use a proper sanitizer in production (like DOMPurify)
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
      break

    case 'sql':
      // Basic SQL injection prevention
      sanitized = sanitized.replace(/'/g, "''")
      break

    case 'text':
    default:
      // Remove potential script tags and event handlers
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
      break
  }

  return sanitized
}

// Session fingerprinting with more entropy
export function generateSessionFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
  screenResolution?: string,
  timezone?: string
): string {
  const components = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    screenResolution || 'unknown',
    timezone || 'unknown',
    // Add canvas fingerprint or WebGL fingerprint in production
  ].join('|')
  
  return createHash('sha256').update(components).digest('hex')
}

// Enhanced VPN/Proxy detection
export async function isVpnOrProxy(ip: string): Promise<boolean> {
  // Known VPN/Proxy IP ranges (simplified)
  const vpnRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    // Add more known VPN provider ranges
  ]
  
  // In production, integrate with services like:
  // - IPQualityScore
  // - MaxMind Proxy Detection
  // - IP2Proxy
  
  // Check if IP is in known VPN ranges
  for (const range of vpnRanges) {
    if (isIpInRange(ip, range)) {
      return true
    }
  }
  
  return false
}

// Helper function to check if IP is in CIDR range
function isIpInRange(ip: string, cidr: string): boolean {
  // Simplified implementation - use proper IP range checking library in production
  const [range, bits] = cidr.split('/')
  return ip.startsWith(range.split('.').slice(0, -1).join('.'))
}

// Enhanced rate-limited password reset
const passwordResetAttempts = new Map<string, { count: number; resetAt: number }>()

export async function canRequestPasswordReset(email: string): Promise<boolean> {
  const now = Date.now()
  const attempt = passwordResetAttempts.get(email)
  
  if (!attempt || now > attempt.resetAt) {
    // Reset counter after 1 hour
    passwordResetAttempts.set(email, { 
      count: 1, 
      resetAt: now + 60 * 60 * 1000 
    })
    return true
  }
  
  if (attempt.count >= 3) {
    return false
  }
  
  attempt.count++
  return true
}

// Request ID generation for distributed tracing
export function generateRequestId(): string {
  return `req_${Date.now()}_${randomBytes(8).toString('hex')}`
}

// Correlation ID for tracking across services
export function generateCorrelationId(): string {
  return `corr_${randomBytes(16).toString('hex')}`
}

```

# src/lib/socket/socket-server.ts
```ts
// src/lib/socket/socket-server.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { parse } from 'cookie'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { redis, redisPub, redisSub } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { db } from '@/lib/db'
import { eventEmitter } from '@/lib/events/event-emitter'
import { createAdapter } from '@socket.io/redis-adapter'

// Socket event types
export interface ServerToClientEvents {
  // Connection events
  connected: (data: { socketId: string }) => void
  error: (error: { message: string; code: string }) => void

  // User presence
  userOnline: (data: { userId: string; status: string }) => void
  userOffline: (data: { userId: string }) => void
  presenceUpdate: (data: { userId: string; status: string; location?: string }) => void

  // Notifications
  notification: (notification: any) => void
  unreadCountUpdate: (count: number) => void

  // Real-time content updates
  postCreated: (post: any) => void
  postUpdated: (post: any) => void
  postDeleted: (postId: string) => void
  commentCreated: (comment: any) => void
  commentUpdated: (comment: any) => void
  commentDeleted: (commentId: string) => void

  // Reactions
  reactionAdded: (data: { 
    entityType: 'post' | 'comment'
    entityId: string
    reaction: any
    counts: Record<string, number>
  }) => void
  reactionRemoved: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
    counts: Record<string, number>
  }) => void

  // Typing indicators
  userTyping: (data: { userId: string; channelId: string; username: string }) => void
  userStoppedTyping: (data: { userId: string; channelId: string }) => void

  // Direct messages
  messageReceived: (message: any) => void
  messageRead: (data: { messageId: string; readBy: string }) => void
  conversationUpdated: (conversation: any) => void

  // Live features
  watchPartyUpdate: (data: any) => void
  liveViewerCount: (data: { entityId: string; count: number }) => void
}

export interface ClientToServerEvents {
  // User presence
  updatePresence: (data: { status: string; location?: string }) => void
  
  // Subscriptions
  subscribeToPost: (postId: string) => void
  unsubscribeFromPost: (postId: string) => void
  subscribeToUser: (userId: string) => void
  unsubscribeFromUser: (userId: string) => void
  subscribeToConversation: (conversationId: string) => void
  unsubscribeFromConversation: (conversationId: string) => void

  // Typing indicators
  startTyping: (data: { channelId: string; channelType: string }) => void
  stopTyping: (data: { channelId: string; channelType: string }) => void

  // Direct messages
  sendMessage: (data: { conversationId: string; content: string; type: string }) => void
  markMessageRead: (messageId: string) => void

  // Real-time interactions
  addReaction: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
  }) => void
  removeReaction: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reactionType: string
  }) => void

  // Live features
  joinWatchParty: (partyId: string) => void
  leaveWatchParty: (partyId: string) => void
  updateWatchPartyState: (data: { partyId: string; state: any }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  username: string
  sessionId: string
}

// Enhanced Socket class with authentication
class AuthenticatedSocket {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  private userSockets: Map<string, Set<string>> = new Map() // userId -> socketIds
  private socketRooms: Map<string, Set<string>> = new Map() // socketId -> rooms

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    })

    // Set up Redis adapter for horizontal scaling
    const pubClient = redisPub
    const subClient = redisSub
    this.io.adapter(createAdapter(pubClient, subClient))

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const sessionToken = this.extractSessionToken(socket)
        if (!sessionToken) {
          return next(new Error('Authentication required'))
        }

        const session = await this.validateSession(sessionToken)
        if (!session) {
          return next(new Error('Invalid session'))
        }

        // Attach user data to socket
        socket.data.userId = session.user.id
        socket.data.username = session.user.username
        socket.data.sessionId = sessionToken

        next()
      } catch (error) {
        logger.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    this.setupEventHandlers()
    this.setupCleanupHandlers()
  }

  private extractSessionToken(socket: Socket): string | null {
    // Try to get token from handshake auth
    const token = socket.handshake.auth?.token
    if (token) return token

    // Try to get from cookies
    const cookies = socket.handshake.headers.cookie
    if (cookies) {
      const parsed = parse(cookies)
      return parsed['next-auth.session-token'] || parsed['__Secure-next-auth.session-token'] || null
    }

    return null
  }

  private async validateSession(sessionToken: string) {
    // Validate session using NextAuth
    // In production, this would check the session from database/Redis
    const session = await getServerSession(authOptions)
    return session
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      const { userId, username } = socket.data
      logger.info('Socket connected', { socketId: socket.id, userId })

      // Track user socket
      this.addUserSocket(userId, socket.id)

      // Join user's personal room
      socket.join(`user:${userId}`)

      // Update presence
      await this.updateUserPresence(userId, 'online')

      // Send connection confirmation
      socket.emit('connected', { socketId: socket.id })

      // Set up event handlers
      this.handlePresenceEvents(socket)
      this.handleSubscriptionEvents(socket)
      this.handleTypingEvents(socket)
      this.handleMessageEvents(socket)
      this.handleReactionEvents(socket)
      this.handleLiveFeatureEvents(socket)

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        logger.info('Socket disconnected', { socketId: socket.id, userId, reason })
        
        this.removeUserSocket(userId, socket.id)
        
        // Check if user has no more active sockets
        const userSockets = this.userSockets.get(userId)
        if (!userSockets || userSockets.size === 0) {
          await this.updateUserPresence(userId, 'offline')
        }
      })
    })
  }

  private handlePresenceEvents(socket: Socket) {
    socket.on('updatePresence', async ({ status, location }) => {
      const { userId } = socket.data
      
      await this.updateUserPresence(userId, status, location)
      
      // Broadcast to user's followers
      const followers = await this.getUserFollowers(userId)
      followers.forEach(followerId => {
        this.io.to(`user:${followerId}`).emit('presenceUpdate', {
          userId,
          status,
          location,
        })
      })
    })
  }

  private handleSubscriptionEvents(socket: Socket) {
    socket.on('subscribeToPost', (postId) => {
      socket.join(`post:${postId}`)
      logger.debug('User subscribed to post', { userId: socket.data.userId, postId })
    })

    socket.on('unsubscribeFromPost', (postId) => {
      socket.leave(`post:${postId}`)
    })

    socket.on('subscribeToUser', (userId) => {
      socket.join(`user-updates:${userId}`)
    })

    socket.on('unsubscribeFromUser', (userId) => {
      socket.leave(`user-updates:${userId}`)
    })

    socket.on('subscribeToConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('unsubscribeFromConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
    })
  }

  private handleTypingEvents(socket: Socket) {
    const typingTimers = new Map<string, NodeJS.Timeout>()

    socket.on('startTyping', ({ channelId, channelType }) => {
      const { userId, username } = socket.data
      const key = `${userId}:${channelId}`

      // Clear existing timer
      const existingTimer = typingTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Broadcast typing indicator
      socket.to(channelId).emit('userTyping', {
        userId,
        channelId,
        username,
      })

      // Auto-stop typing after 5 seconds
      const timer = setTimeout(() => {
        socket.to(channelId).emit('userStoppedTyping', {
          userId,
          channelId,
        })
        typingTimers.delete(key)
      }, 5000)

      typingTimers.set(key, timer)
    })

    socket.on('stopTyping', ({ channelId }) => {
      const { userId } = socket.data
      const key = `${userId}:${channelId}`

      // Clear timer
      const timer = typingTimers.get(key)
      if (timer) {
        clearTimeout(timer)
        typingTimers.delete(key)
      }

      // Broadcast stop typing
      socket.to(channelId).emit('userStoppedTyping', {
        userId,
        channelId,
      })
    })

    // Clean up timers on disconnect
    socket.on('disconnect', () => {
      typingTimers.forEach(timer => clearTimeout(timer))
      typingTimers.clear()
    })
  }

  private handleMessageEvents(socket: Socket) {
    socket.on('sendMessage', async ({ conversationId, content, type }) => {
      const { userId } = socket.data

      try {
        // Validate user is part of conversation
        const participant = await db.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId,
            },
          },
        })

        if (!participant || !participant.isActive) {
          socket.emit('error', { 
            message: 'Not authorized to send messages in this conversation',
            code: 'UNAUTHORIZED',
          })
          return
        }

        // Create message (implement in message service)
        const message = await db.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            messageType: type,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        })

        // Broadcast to conversation participants
        this.io.to(`conversation:${conversationId}`).emit('messageReceived', message)

        // Update conversation
        await db.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            messageCount: { increment: 1 },
          },
        })

      } catch (error) {
        logger.error('Failed to send message:', error)
        socket.emit('error', { 
          message: 'Failed to send message',
          code: 'MESSAGE_SEND_FAILED',
        })
      }
    })

    socket.on('markMessageRead', async (messageId) => {
      const { userId } = socket.data

      try {
        await db.messageRead.create({
          data: {
            messageId,
            userId,
          },
        })

        // Notify sender
        const message = await db.message.findUnique({
          where: { id: messageId },
          select: { senderId: true, conversationId: true },
        })

        if (message) {
          this.io.to(`user:${message.senderId}`).emit('messageRead', {
            messageId,
            readBy: userId,
          })
        }
      } catch (error) {
        logger.error('Failed to mark message as read:', error)
      }
    })
  }

  private handleReactionEvents(socket: Socket) {
    socket.on('addReaction', async ({ entityType, entityId, reactionType }) => {
      const { userId } = socket.data

      try {
        // Add reaction to database
        await db.reaction.create({
          data: {
            type: reactionType as any,
            userId,
            ...(entityType === 'post' ? { postId: entityId } : { commentId: entityId }),
          },
        })

        // Get updated reaction counts
        const counts = await this.getReactionCounts(entityType, entityId)

        // Broadcast to relevant room
        const room = entityType === 'post' ? `post:${entityId}` : `comment:${entityId}`
        this.io.to(room).emit('reactionAdded', {
          entityType,
          entityId,
          reaction: { userId, type: reactionType },
          counts,
        })

      } catch (error) {
        logger.error('Failed to add reaction:', error)
        socket.emit('error', { 
          message: 'Failed to add reaction',
          code: 'REACTION_ADD_FAILED',
        })
      }
    })

    socket.on('removeReaction', async ({ entityType, entityId, reactionType }) => {
      const { userId } = socket.data

      try {
        // Remove reaction from database
        await db.reaction.deleteMany({
          where: {
            type: reactionType as any,
            userId,
            ...(entityType === 'post' ? { postId: entityId } : { commentId: entityId }),
          },
        })

        // Get updated reaction counts
        const counts = await this.getReactionCounts(entityType, entityId)

        // Broadcast to relevant room
        const room = entityType === 'post' ? `post:${entityId}` : `comment:${entityId}`
        this.io.to(room).emit('reactionRemoved', {
          entityType,
          entityId,
          reactionType,
          counts,
        })

      } catch (error) {
        logger.error('Failed to remove reaction:', error)
        socket.emit('error', { 
          message: 'Failed to remove reaction',
          code: 'REACTION_REMOVE_FAILED',
        })
      }
    })
  }

  private handleLiveFeatureEvents(socket: Socket) {
    socket.on('joinWatchParty', async (partyId) => {
      const { userId } = socket.data

      try {
        // Verify user can join
        const party = await db.watchParty.findUnique({
          where: { id: partyId },
          include: { participants: { where: { userId } } },
        })

        if (!party) {
          socket.emit('error', { 
            message: 'Watch party not found',
            code: 'PARTY_NOT_FOUND',
          })
          return
        }

        // Join party room
        socket.join(`party:${partyId}`)

        // Update participant count
        const participantCount = await db.watchPartyParticipant.count({
          where: { partyId, isActive: true },
        })

        this.io.to(`party:${partyId}`).emit('watchPartyUpdate', {
          type: 'userJoined',
          userId,
          participantCount,
        })

      } catch (error) {
        logger.error('Failed to join watch party:', error)
        socket.emit('error', { 
          message: 'Failed to join watch party',
          code: 'PARTY_JOIN_FAILED',
        })
      }
    })

    socket.on('leaveWatchParty', (partyId) => {
      socket.leave(`party:${partyId}`)
      
      this.io.to(`party:${partyId}`).emit('watchPartyUpdate', {
        type: 'userLeft',
        userId: socket.data.userId,
      })
    })
  }

  private async updateUserPresence(userId: string, status: string, location?: string) {
    const key = `presence:${userId}`
    
    if (status === 'online') {
      await redis.setex(key, 300, JSON.stringify({ status, location, lastSeen: new Date() }))
      
      // Update user record
      await db.user.update({
        where: { id: userId },
        data: { 
          onlineStatus: true,
          lastSeenAt: new Date(),
        },
      })

      // Emit online event
      this.io.emit('userOnline', { userId, status })
    } else {
      await redis.del(key)
      
      // Update user record
      await db.user.update({
        where: { id: userId },
        data: { 
          onlineStatus: false,
          lastSeenAt: new Date(),
        },
      })

      // Emit offline event
      this.io.emit('userOffline', { userId })
    }
  }

  private async getReactionCounts(entityType: string, entityId: string) {
    const reactions = await db.reaction.groupBy({
      by: ['type'],
      where: entityType === 'post' ? { postId: entityId } : { commentId: entityId },
      _count: { type: true },
    })

    return reactions.reduce((acc, { type, _count }) => {
      acc[type] = _count.type
      return acc
    }, {} as Record<string, number>)
  }

  private async getUserFollowers(userId: string): Promise<string[]> {
    const followers = await db.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    })
    return followers.map(f => f.followerId)
  }

  private addUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId) || new Set()
    sockets.add(socketId)
    this.userSockets.set(userId, sockets)
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.delete(socketId)
      if (sockets.size === 0) {
        this.userSockets.delete(userId)
      }
    }
  }

  private setupCleanupHandlers() {
    // Clean up stale presence data periodically
    setInterval(async () => {
      const keys = await redis.keys('presence:*')
      for (const key of keys) {
        const data = await redis.get(key)
        if (data) {
          const presence = JSON.parse(data)
          const lastSeen = new Date(presence.lastSeen)
          const now = new Date()
          const diff = now.getTime() - lastSeen.getTime()
          
          // Remove if not seen for more than 5 minutes
          if (diff > 5 * 60 * 1000) {
            await redis.del(key)
            const userId = key.split(':')[1]
            this.io.emit('userOffline', { userId })
          }
        }
      }
    }, 60000) // Run every minute
  }

  // Public methods for external use
  public getIO() {
    return this.io
  }

  public async emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  public async emitToPost(postId: string, event: keyof ServerToClientEvents, data: any) {
    this.io.to(`post:${postId}`).emit(event, data)
  }

  public async getOnlineUsers(): Promise<string[]> {
    const keys = await redis.keys('presence:*')
    return keys.map(key => key.split(':')[1])
  }

  public async getUserPresence(userId: string) {
    const data = await redis.get(`presence:${userId}`)
    return data ? JSON.parse(data) : null
  }
}

// Export singleton instance
let socketServer: AuthenticatedSocket | null = null

export function initializeSocketServer(httpServer: HTTPServer): AuthenticatedSocket {
  if (!socketServer) {
    socketServer = new AuthenticatedSocket(httpServer)
    logger.info('Socket.io server initialized')
  }
  return socketServer
}

export function getSocketServer(): AuthenticatedSocket | null {
  return socketServer
}

```

# src/lib/utils.ts
```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistance, formatRelative, isValid } from 'date-fns'

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return format(d, 'MMMM d, yyyy')
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeDate(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return formatDistance(d, new Date(), { addSuffix: true })
}

/**
 * Format a date with full relative context
 */
export function formatRelativeDateTime(date: Date | string | number): string {
  const d = new Date(date)
  if (!isValid(d)) return 'Invalid date'
  
  return formatRelative(d, new Date())
}

/**
 * Generate an absolute URL
 */
export function absoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Generate a username from an email
 */
export function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase()
  const cleanBase = base.replace(/[^a-z0-9]/g, '')
  const random = Math.random().toString(36).substring(2, 6)
  return `${cleanBase}${random}`
}

/**
 * Generate a slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Format a number to a human-readable string
 */
export function formatNumber(num: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter.format(num)
}

/**
 * Format a number with full formatting
 */
export function formatLongNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format duration in seconds to a readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  if (typeof window !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Check if running on client
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if running on server
 */
export const isServer = !isClient

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    maxDelay?: number
    factor?: number
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === retries) {
        throw lastError
      }

      const waitTime = Math.min(delay * Math.pow(factor, attempt), maxDelay)
      
      if (onRetry) {
        onRetry(lastError, attempt + 1)
      }

      await sleep(waitTime)
    }
  }

  throw lastError!
}

/**
 * Create a cancellable promise
 */
export function makeCancellable<T>(promise: Promise<T>) {
  let hasCancelled = false

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      value => (hasCancelled ? reject({ isCancelled: true }) : resolve(value)),
      error => (hasCancelled ? reject({ isCancelled: true }) : reject(error))
    )
  })

  return {
    promise: wrappedPromise,
    cancel() {
      hasCancelled = true
    },
  }
}

/**
 * Get YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Generate a random color
 */
export function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

/**
 * Merge and deduplicate arrays
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Group array items by key
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Omit specific keys from an object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result as Omit<T, K>
}

```

# src/middleware.ts
```ts
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/security'
import { logger } from '@/lib/monitoring'

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const pathname = request.nextUrl.pathname

  try {
    // Security headers
    const headers = new Headers(request.headers)
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-XSS-Protection', '1; mode=block')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    )

    // CORS headers for API routes
    if (pathname.startsWith('/api')) {
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*')
      headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
      headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      )

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers })
      }
    }

    // Rate limiting for different routes
    let rateLimitConfig = rateLimitConfigs.api

    if (pathname.startsWith('/api/auth')) {
      rateLimitConfig = rateLimitConfigs.auth
    } else if (
      pathname.startsWith('/api/posts') && 
      request.method === 'POST'
    ) {
      rateLimitConfig = rateLimitConfigs.write
    } else if (pathname.startsWith('/api/upload')) {
      rateLimitConfig = rateLimitConfigs.upload
    }

    // Apply rate limiting
    const identifier = getClientIp(request) || 'anonymous'
    const rateLimitResult = await rateLimit(rateLimitConfig, identifier)

    // Set rate limit headers
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())

    if (!rateLimitResult.success) {
      headers.set('Retry-After', rateLimitResult.retryAfter!.toString())
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers,
      })
    }

    // Logging
    const duration = Date.now() - start
    logger.info('Middleware processed request', {
      method: request.method,
      pathname,
      duration: `${duration}ms`,
      ip: identifier,
    })

    // Continue with modified headers
    return NextResponse.next({
      headers,
    })
  } catch (error) {
    logger.error('Middleware error', error, {
      method: request.method,
      pathname,
    })

    // Don't block requests on middleware errors
    return NextResponse.next()
  }
}

```

# src/services/auth.service.ts
```ts
// src/services/auth.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureToken,
  generateVerificationCode,
  trackLoginAttempt,
  createSecurityAlert,
  twoFactorAuth,
  generateCorrelationId,
  generateRequestId
} from '@/lib/security'
import { UserService } from './user.service'
import { logger, performance } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { UserStatus, Prisma } from '@prisma/client'
import { jobs } from '@/lib/jobs/job-processor'

export interface LoginInput {
  email: string
  password: string
  ipAddress: string
  userAgent: string
  twoFactorCode?: string
  rememberMe?: boolean
}

export interface RegisterInput {
  email: string
  password: string
  username?: string
  agreeToTerms: boolean
  referralCode?: string
}

export interface PasswordResetInput {
  email: string
  token: string
  newPassword: string
}

export interface Enable2FAResult {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export class AuthService {
  private static readonly VERIFICATION_CODE_TTL = 600 // 10 minutes
  private static readonly PASSWORD_RESET_TTL = 3600 // 1 hour
  private static readonly LOGIN_LOCKOUT_DURATION = 900 // 15 minutes
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly SESSION_TTL = 30 * 24 * 60 * 60 // 30 days
  private static readonly REMEMBER_ME_TTL = 90 * 24 * 60 * 60 // 90 days

  // Register new user with enhanced validation
  static async register(input: RegisterInput) {
    const correlationId = generateCorrelationId()
    const timer = performance.start('auth.register')
    
    logger.info('User registration attempt', { 
      email: input.email,
      correlationId 
    })

    try {
      // Validate agreement to terms
      if (!input.agreeToTerms) {
        throw new Error('You must agree to the terms and conditions')
      }

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      })

      if (existingUser) {
        throw new Error('Email already registered')
      }

      // Process referral if provided
      let referrerId: string | undefined
      if (input.referralCode) {
        const referral = await db.referral.findUnique({
          where: { referralCode: input.referralCode },
          include: { referrer: { select: { id: true } } },
        })

        if (referral && referral.status === 'PENDING') {
          referrerId = referral.referrer.id
        }
      }

      // Create user
      const user = await UserService.createUser({
        email: input.email,
        password: input.password,
        username: input.username,
      })

      // Update referral if applicable
      if (referrerId && input.referralCode) {
        await transaction(async (tx) => {
          // Update referral
          await tx.referral.update({
            where: { referralCode: input.referralCode },
            data: {
              referredUserId: user.id,
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          })

          // Award referral bonus to referrer
          await tx.userBalance.update({
            where: { userId: referrerId },
            data: {
              sparklePoints: { increment: 500 },
              lifetimeEarned: { increment: 500 },
            },
          })

          // Create notification for referrer
          await tx.notification.create({
            data: {
              type: 'SYSTEM',
              userId: referrerId,
              title: 'Referral Bonus Earned! 🎉',
              message: `You earned 500 Sparkle Points for referring a new user!`,
              data: { referredUserId: user.id, bonus: 500 },
            },
          })
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        })
      }

      // Generate verification code
      const verificationCode = generateVerificationCode()
      await redisHelpers.setJSON(
        `email_verify:${user.id}`,
        { code: verificationCode, email: user.email },
        this.VERIFICATION_CODE_TTL
      )

      // Queue verification email
      await jobs.email.send({
        to: user.email,
        subject: 'Verify Your Email - Sparkle Universe',
        template: 'VerificationEmail',
        data: {
          code: verificationCode,
          expiresIn: '10 minutes',
        },
      })

      const timing = performance.end('auth.register')
      logger.info('User registered successfully', { 
        userId: user.id,
        duration: timing?.duration,
        correlationId 
      })
      
      return user
    } catch (error) {
      const timing = performance.end('auth.register')
      logger.error('Registration failed', error, {
        duration: timing?.duration,
        correlationId,
      })
      throw error
    }
  }

  // Enhanced login with 2FA support
  static async login(input: LoginInput) {
    const { email, password, ipAddress, userAgent, twoFactorCode, rememberMe } = input
    const correlationId = generateCorrelationId()
    const requestId = generateRequestId()

    logger.info('Login attempt', { email, ipAddress, correlationId, requestId })

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      await trackLoginAttempt(email, ipAddress, userAgent, false, 'User not found')
      throw new Error('Invalid credentials')
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new Error('Account temporarily locked due to multiple failed attempts')
    }

    // Check user status
    if (user.status === UserStatus.BANNED) {
      throw new Error('Account has been banned')
    }

    if (user.status === UserStatus.SUSPENDED) {
      if (user.banExpiresAt && user.banExpiresAt > new Date()) {
        throw new Error(`Account suspended until ${user.banExpiresAt.toLocaleDateString()}`)
      }
    }

    // Verify password
    if (!user.hashedPassword) {
      throw new Error('Please use social login for this account')
    }

    const isValidPassword = await verifyPassword(password, user.hashedPassword)
    if (!isValidPassword) {
      await this.handleFailedLogin(user.id, email, ipAddress, userAgent)
      throw new Error('Invalid credentials')
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Return indicator that 2FA is required
        return {
          requiresTwoFactor: true,
          userId: user.id,
        }
      }

      // Verify 2FA code
      if (!user.twoFactorSecret) {
        throw new Error('2FA configuration error')
      }

      const decryptedSecret = twoFactorAuth.decryptSecret(user.twoFactorSecret)
      const isValid2FA = twoFactorAuth.verifyToken(decryptedSecret, twoFactorCode)

      if (!isValid2FA) {
        // Check backup codes
        const isBackupCode = user.twoFactorBackupCodes.includes(twoFactorCode)
        
        if (!isBackupCode) {
          await this.handleFailedLogin(user.id, email, ipAddress, userAgent)
          throw new Error('Invalid 2FA code')
        }

        // Remove used backup code
        await db.user.update({
          where: { id: user.id },
          data: {
            twoFactorBackupCodes: {
              set: user.twoFactorBackupCodes.filter(code => code !== twoFactorCode),
            },
          },
        })

        // Alert user about backup code usage
        await createSecurityAlert(
          user.id,
          'BACKUP_CODE_USED',
          'Backup Code Used',
          'A backup code was used to access your account',
          'medium'
        )
      }
    }

    // Track successful login
    await trackLoginAttempt(email, ipAddress, userAgent, true)

    // Update user
    await db.user.update({
      where: { id: user.id },
      data: { 
        lastSeenAt: new Date(),
        failedLoginAttempts: 0,
        accountLockoutAttempts: 0,
      },
    })

    // Clear any failed login attempts
    await redis.del(`failed_attempts:${user.id}`)

    // Generate session token
    const sessionToken = generateSecureToken(32, 'sess')
    const sessionData = {
      userId: user.id,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      correlationId,
    }

    // Store session in Redis with appropriate TTL
    const ttl = rememberMe ? this.REMEMBER_ME_TTL : this.SESSION_TTL
    await redisHelpers.session.set(sessionToken, sessionData, ttl)

    // Store session in database for audit
    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + ttl * 1000),
        ipAddress,
        userAgent,
      },
    })

    eventEmitter.emit('auth:login', { userId: user.id, ipAddress, correlationId })

    return {
      user,
      sessionToken,
      requiresTwoFactor: false,
    }
  }

  // Enable 2FA for user
  static async enableTwoFactor(userId: string): Promise<Enable2FAResult> {
    const correlationId = generateCorrelationId()
    
    logger.info('Enabling 2FA', { userId, correlationId })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA is already enabled')
    }

    // Generate secret and QR code
    const { secret, qrCode } = twoFactorAuth.generateSecret(user.email)
    const qrCodeDataUrl = await twoFactorAuth.generateQRCode(qrCode)
    
    // Generate backup codes
    const backupCodes = twoFactorAuth.generateBackupCodes(10)
    
    // Encrypt secret for storage
    const encryptedSecret = twoFactorAuth.encryptSecret(secret)

    // Store temporarily in Redis (user must verify before enabling)
    await redisHelpers.setJSON(
      `2fa_setup:${userId}`,
      {
        secret: encryptedSecret,
        backupCodes,
      },
      600 // 10 minutes to complete setup
    )

    return {
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
    }
  }

  // Verify and complete 2FA setup
  static async verifyTwoFactorSetup(
    userId: string,
    verificationCode: string
  ): Promise<boolean> {
    const correlationId = generateCorrelationId()
    
    logger.info('Verifying 2FA setup', { userId, correlationId })

    // Get setup data from Redis
    const setupData = await redisHelpers.getJSON<{
      secret: string
      backupCodes: string[]
    }>(`2fa_setup:${userId}`)

    if (!setupData) {
      throw new Error('2FA setup expired or not found')
    }

    // Verify the code
    const decryptedSecret = twoFactorAuth.decryptSecret(setupData.secret)
    const isValid = twoFactorAuth.verifyToken(decryptedSecret, verificationCode)

    if (!isValid) {
      throw new Error('Invalid verification code')
    }

    // Enable 2FA for user
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: setupData.secret,
        twoFactorBackupCodes: setupData.backupCodes,
      },
    })

    // Clean up Redis
    await redis.del(`2fa_setup:${userId}`)

    // Create security alert
    await createSecurityAlert(
      userId,
      '2FA_ENABLED',
      'Two-Factor Authentication Enabled',
      'Two-factor authentication has been successfully enabled on your account',
      'low'
    )

    eventEmitter.emit('auth:2faEnabled', { userId, correlationId })

    return true
  }

  // Disable 2FA
  static async disableTwoFactor(
    userId: string,
    password: string,
    twoFactorCode: string
  ): Promise<void> {
    const correlationId = generateCorrelationId()
    
    logger.info('Disabling 2FA', { userId, correlationId })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        hashedPassword: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user || !user.twoFactorEnabled) {
      throw new Error('2FA is not enabled')
    }

    // Verify password
    if (!user.hashedPassword || !await verifyPassword(password, user.hashedPassword)) {
      throw new Error('Invalid password')
    }

    // Verify 2FA code
    if (!user.twoFactorSecret) {
      throw new Error('2FA configuration error')
    }

    const decryptedSecret = twoFactorAuth.decryptSecret(user.twoFactorSecret)
    const isValid = twoFactorAuth.verifyToken(decryptedSecret, twoFactorCode)

    if (!isValid) {
      throw new Error('Invalid 2FA code')
    }

    // Disable 2FA
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    })

    // Create security alert
    await createSecurityAlert(
      userId,
      '2FA_DISABLED',
      'Two-Factor Authentication Disabled',
      'Two-factor authentication has been disabled on your account',
      'high'
    )

    eventEmitter.emit('auth:2faDisabled', { userId, correlationId })
  }

  // Handle failed login attempt
  private static async handleFailedLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string
  ) {
    const attemptsKey = `failed_attempts:${userId}`
    
    // Increment failed attempts
    const attempts = await redisHelpers.incrWithExpire(
      attemptsKey,
      this.LOGIN_LOCKOUT_DURATION
    )

    await trackLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password')

    // Update user record
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLoginAt: new Date(),
      },
    })

    // Lock account if too many attempts
    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutKey = `lockout:${userId}`
      await redis.setex(lockoutKey, this.LOGIN_LOCKOUT_DURATION, '1')
      
      await db.user.update({
        where: { id: userId },
        data: {
          accountLockedUntil: new Date(Date.now() + this.LOGIN_LOCKOUT_DURATION * 1000),
          accountLockoutAttempts: attempts,
        },
      })
      
      await createSecurityAlert(
        userId,
        'ACCOUNT_LOCKED',
        'Account Locked',
        `Account locked due to ${attempts} failed login attempts`,
        'high'
      )
    }
  }

  // Verify email
  static async verifyEmail(userId: string, code: string) {
    const correlationId = generateCorrelationId()
    
    const storedData = await redisHelpers.getJSON<{ code: string; email: string }>(
      `email_verify:${userId}`
    )

    if (!storedData || storedData.code !== code) {
      throw new Error('Invalid or expired verification code')
    }

    // Update user
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: new Date(),
        status: UserStatus.ACTIVE,
      },
    })

    // Delete verification code
    await redis.del(`email_verify:${userId}`)

    // Award XP for email verification
    await UserService.addExperience(userId, 20, 'email_verified')

    // Queue achievement check
    await jobs.achievement.check(userId)

    eventEmitter.emit('auth:emailVerified', { userId, correlationId })
  }

  // Request password reset with enhanced security
  static async requestPasswordReset(email: string) {
    const correlationId = generateCorrelationId()
    
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    if (!user) {
      // Don't reveal if email exists
      logger.info('Password reset requested for non-existent email', { 
        email,
        correlationId 
      })
      return
    }

    // Check rate limit
    const { canRequestPasswordReset } = await import('@/lib/security')
    if (!await canRequestPasswordReset(email)) {
      logger.warn('Password reset rate limit exceeded', { email, correlationId })
      return
    }

    // Generate reset token
    const resetToken = generateSecureToken(32, 'reset')
    const resetData = {
      userId: user.id,
      email: user.email,
      token: resetToken,
      requestedAt: new Date(),
    }

    // Store in Redis with TTL
    await redisHelpers.setJSON(
      `password_reset:${resetToken}`,
      resetData,
      this.PASSWORD_RESET_TTL
    )

    // Also store in database for audit
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: new Date(Date.now() + this.PASSWORD_RESET_TTL * 1000),
      },
    })

    // Queue reset email
    await jobs.email.send({
      to: user.email,
      subject: 'Reset Your Password - Sparkle Universe',
      template: 'PasswordResetEmail',
      data: {
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
        expiresIn: '1 hour',
      },
    })

    eventEmitter.emit('auth:passwordResetRequested', { userId: user.id, correlationId })
  }

  // Reset password with validation
  static async resetPassword(input: PasswordResetInput) {
    const correlationId = generateCorrelationId()
    
    const resetData = await redisHelpers.getJSON<{
      userId: string
      email: string
      token: string
    }>(`password_reset:${input.token}`)

    if (!resetData || resetData.email !== input.email) {
      throw new Error('Invalid or expired reset token')
    }

    // Validate new password
    const { validatePasswordStrength } = await import('@/lib/security')
    const validation = validatePasswordStrength(input.newPassword)
    
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // Hash new password
    const hashedPassword = await hashPassword(input.newPassword)

    // Update password and clear reset token
    await db.user.update({
      where: { id: resetData.userId },
      data: { 
        hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        lastPasswordChangedAt: new Date(),
      },
    })

    // Delete reset token from Redis
    await redis.del(`password_reset:${input.token}`)

    // Invalidate all existing sessions for security
    const sessions = await db.session.findMany({
      where: { userId: resetData.userId },
      select: { sessionToken: true },
    })

    for (const session of sessions) {
      await redisHelpers.session.delete(session.sessionToken)
    }

    await db.session.deleteMany({
      where: { userId: resetData.userId },
    })

    // Create security alert
    await createSecurityAlert(
      resetData.userId,
      'PASSWORD_CHANGED',
      'Password Changed',
      'Your password was successfully changed. All sessions have been terminated.',
      'medium'
    )

    eventEmitter.emit('auth:passwordReset', { 
      userId: resetData.userId,
      correlationId 
    })
  }

  // Logout with session cleanup
  static async logout(sessionToken: string) {
    const correlationId = generateCorrelationId()
    
    // Get session data before deletion
    const sessionData = await redisHelpers.session.get(sessionToken)
    
    // Delete from Redis
    await redisHelpers.session.delete(sessionToken)
    
    // Delete from database
    await db.session.delete({
      where: { sessionToken },
    }).catch(() => {
      // Session might not exist in DB
    })
    
    eventEmitter.emit('auth:logout', { 
      sessionToken,
      userId: sessionData?.userId,
      correlationId 
    })
  }

  // Validate session with refresh
  static async validateSession(sessionToken: string) {
    const sessionData = await redisHelpers.session.get(sessionToken)
    
    if (!sessionData) {
      // Check database as fallback
      const dbSession = await db.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      })

      if (!dbSession || dbSession.expires < new Date()) {
        return null
      }

      // Restore to Redis
      await redisHelpers.session.set(sessionToken, {
        userId: dbSession.userId,
        ipAddress: dbSession.ipAddress || 'unknown',
        userAgent: dbSession.userAgent || 'unknown',
        createdAt: dbSession.createdAt,
      })

      return dbSession
    }

    // Extend session
    await redisHelpers.session.extend(sessionToken)

    return sessionData
  }
}

```

# src/services/email.service.ts
```ts
// src/services/email.service.ts
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { eventEmitter } from '@/lib/events/event-emitter'
import { NotificationType } from '@prisma/client'
import * as templates from '@/emails/templates'

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Sparkle Universe <noreply@sparkle-universe.com>'
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@sparkle-universe.com'
const BATCH_SIZE = 50
const RATE_LIMIT_PER_HOUR = 1000

// Email provider configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

// Backup transporter (e.g., SendGrid)
const backupTransporter = process.env.SENDGRID_API_KEY
  ? nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: keyof typeof templates
  data: any
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  headers?: Record<string, string>
  priority?: 'high' | 'normal' | 'low'
  category?: string
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface EmailResult {
  messageId: string
  accepted: string[]
  rejected: string[]
  response: string
}

export class EmailService {
  // Send single email
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Check rate limit
      await this.checkRateLimit(options.to)

      // Render email template
      const { html, text } = await this.renderTemplate(options.template, options.data)

      // Prepare email
      const mailOptions = {
        from: options.from || EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        replyTo: options.replyTo || EMAIL_REPLY_TO,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
        headers: {
          ...options.headers,
          'X-Priority': options.priority || 'normal',
          'X-Category': options.category || 'transactional',
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe>`,
        },
      }

      // Add tracking pixels if enabled
      if (options.trackOpens) {
        mailOptions.html = this.addTrackingPixel(mailOptions.html, options.to as string)
      }

      if (options.trackClicks) {
        mailOptions.html = this.addClickTracking(mailOptions.html, options.to as string)
      }

      // Send email
      let result: EmailResult
      try {
        const info = await transporter.sendMail(mailOptions)
        result = {
          messageId: info.messageId,
          accepted: info.accepted as string[],
          rejected: info.rejected as string[],
          response: info.response,
        }
      } catch (error) {
        // Try backup transporter
        if (backupTransporter) {
          logger.warn('Primary email provider failed, trying backup', error)
          const info = await backupTransporter.sendMail(mailOptions)
          result = {
            messageId: info.messageId,
            accepted: info.accepted as string[],
            rejected: info.rejected as string[],
            response: info.response,
          }
        } else {
          throw error
        }
      }

      // Log email sent
      await this.logEmailSent(options, result)

      // Update rate limit
      await this.updateRateLimit(options.to)

      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        messageId: result.messageId,
      })

      return result

    } catch (error) {
      logger.error('Failed to send email', error, { 
        to: options.to, 
        subject: options.subject 
      })
      throw error
    }
  }

  // Send bulk emails
  static async sendBulkEmails(
    recipients: string[],
    template: keyof typeof templates,
    baseData: any,
    options: Partial<EmailOptions> = {}
  ): Promise<{ sent: number; failed: number; errors: any[] }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as any[],
    }

    // Process in batches
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            await this.sendEmail({
              to: recipient,
              template,
              data: { ...baseData, email: recipient },
              ...options,
              subject: options.subject || 'Update from Sparkle Universe',
            })
            results.sent++
          } catch (error) {
            results.failed++
            results.errors.push({ recipient, error: (error as Error).message })
          }
        })
      )

      // Rate limit between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    logger.info('Bulk email completed', results)
    return results
  }

  // Process email queue
  static async processEmailQueue(): Promise<void> {
    const queue = await db.notificationQueue.findMany({
      where: {
        channel: 'email',
        processedAt: null,
        attempts: { lt: 3 },
        scheduledFor: { lte: new Date() },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: BATCH_SIZE,
    })

    for (const item of queue) {
      try {
        await this.processQueueItem(item)
      } catch (error) {
        logger.error('Failed to process email queue item', error, { 
          queueId: item.id 
        })
      }
    }
  }

  // Process single queue item
  private static async processQueueItem(item: any): Promise<void> {
    try {
      const { userId, type, payload } = item

      // Get user details
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { 
          profile: true,
          notificationPrefs: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Check if user wants email notifications
      if (!user.notificationPrefs?.emailNotifications) {
        await db.notificationQueue.update({
          where: { id: item.id },
          data: { 
            processedAt: new Date(),
            error: 'User has disabled email notifications',
          },
        })
        return
      }

      // Select template based on notification type
      const template = this.getTemplateForNotificationType(type)
      const subject = this.getSubjectForNotificationType(type, payload)

      // Send email
      await this.sendEmail({
        to: user.email,
        subject,
        template,
        data: {
          user: {
            name: user.profile?.displayName || user.username,
            email: user.email,
          },
          notification: payload,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`,
        },
        category: type.toLowerCase(),
      })

      // Mark as processed
      await db.notificationQueue.update({
        where: { id: item.id },
        data: { 
          processedAt: new Date(),
          attempts: { increment: 1 },
        },
      })

    } catch (error) {
      // Update failure
      await db.notificationQueue.update({
        where: { id: item.id },
        data: {
          attempts: { increment: 1 },
          failedAt: new Date(),
          error: (error as Error).message,
        },
      })

      throw error
    }
  }

  // Render email template
  private static async renderTemplate(
    templateName: keyof typeof templates,
    data: any
  ): Promise<{ html: string; text: string }> {
    const Template = templates[templateName]
    
    if (!Template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const html = render(Template(data))
    const text = this.htmlToText(html)

    return { html, text }
  }

  // Check rate limit
  private static async checkRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count + recipients.length > RATE_LIMIT_PER_HOUR) {
      throw new Error('Email rate limit exceeded')
    }
  }

  // Update rate limit
  private static async updateRateLimit(to: string | string[]): Promise<void> {
    const recipients = Array.isArray(to) ? to : [to]
    const key = `email_rate_limit:${new Date().getHours()}`
    
    await redis.incrby(key, recipients.length)
    await redis.expire(key, 3600) // Expire after 1 hour
  }

  // Log email sent
  private static async logEmailSent(
    options: EmailOptions,
    result: EmailResult
  ): Promise<void> {
    // Store in analytics
    eventEmitter.emit('email:sent', {
      to: options.to,
      subject: options.subject,
      template: options.template,
      category: options.category,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    })

    // Store recent emails for debugging
    const key = `recent_emails:${Array.isArray(options.to) ? options.to[0] : options.to}`
    await redis.lpush(key, JSON.stringify({
      subject: options.subject,
      template: options.template,
      messageId: result.messageId,
      sentAt: new Date(),
    }))
    await redis.ltrim(key, 0, 9) // Keep last 10 emails
    await redis.expire(key, 86400 * 7) // Expire after 7 days
  }

  // Get template for notification type
  private static getTemplateForNotificationType(
    type: NotificationType
  ): keyof typeof templates {
    const templateMap: Record<NotificationType, keyof typeof templates> = {
      [NotificationType.POST_LIKED]: 'PostLikedEmail',
      [NotificationType.POST_COMMENTED]: 'CommentNotificationEmail',
      [NotificationType.COMMENT_LIKED]: 'CommentLikedEmail',
      [NotificationType.USER_FOLLOWED]: 'NewFollowerEmail',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'AchievementEmail',
      [NotificationType.LEVEL_UP]: 'LevelUpEmail',
      [NotificationType.MENTION]: 'MentionEmail',
      [NotificationType.SYSTEM]: 'SystemNotificationEmail',
      [NotificationType.GROUP_INVITE]: 'GroupInviteEmail',
      [NotificationType.GROUP_POST]: 'GroupPostEmail',
      [NotificationType.EVENT_REMINDER]: 'EventReminderEmail',
      [NotificationType.WATCH_PARTY_INVITE]: 'WatchPartyInviteEmail',
      [NotificationType.DIRECT_MESSAGE]: 'DirectMessageEmail',
      [NotificationType.YOUTUBE_PREMIERE]: 'YouTubePremiereEmail',
      [NotificationType.QUEST_COMPLETE]: 'QuestCompleteEmail',
      [NotificationType.TRADE_REQUEST]: 'TradeRequestEmail',
      [NotificationType.CONTENT_FEATURED]: 'ContentFeaturedEmail',
      [NotificationType.MILESTONE_REACHED]: 'MilestoneEmail',
    }

    return templateMap[type] || 'SystemNotificationEmail'
  }

  // Get subject for notification type
  private static getSubjectForNotificationType(
    type: NotificationType,
    payload: any
  ): string {
    const subjectMap: Record<NotificationType, string> = {
      [NotificationType.POST_LIKED]: `Someone liked your post!`,
      [NotificationType.POST_COMMENTED]: `New comment on your post`,
      [NotificationType.COMMENT_LIKED]: `Someone liked your comment!`,
      [NotificationType.USER_FOLLOWED]: `You have a new follower!`,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: `Achievement Unlocked: ${payload.achievementName}!`,
      [NotificationType.LEVEL_UP]: `Congratulations! You've reached level ${payload.level}!`,
      [NotificationType.MENTION]: `${payload.mentionerName} mentioned you`,
      [NotificationType.SYSTEM]: payload.title || 'Important Update from Sparkle Universe',
      [NotificationType.GROUP_INVITE]: `You're invited to join ${payload.groupName}`,
      [NotificationType.GROUP_POST]: `New post in ${payload.groupName}`,
      [NotificationType.EVENT_REMINDER]: `Reminder: ${payload.eventName} is starting soon`,
      [NotificationType.WATCH_PARTY_INVITE]: `Join the watch party for ${payload.videoTitle}`,
      [NotificationType.DIRECT_MESSAGE]: `New message from ${payload.senderName}`,
      [NotificationType.YOUTUBE_PREMIERE]: `${payload.channelName} is premiering soon!`,
      [NotificationType.QUEST_COMPLETE]: `Quest Complete: ${payload.questName}!`,
      [NotificationType.TRADE_REQUEST]: `${payload.traderName} wants to trade with you`,
      [NotificationType.CONTENT_FEATURED]: `Your content has been featured!`,
      [NotificationType.MILESTONE_REACHED]: `Milestone Reached: ${payload.milestoneName}!`,
    }

    return subjectMap[type] || 'Update from Sparkle Universe'
  }

  // Convert HTML to plain text
  private static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Add tracking pixel
  private static addTrackingPixel(html: string, recipient: string): string {
    const trackingId = Buffer.from(`${recipient}:${Date.now()}`).toString('base64')
    const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/open?id=${trackingId}`
    const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" />`
    
    return html.replace('</body>', `${pixel}</body>`)
  }

  // Add click tracking
  private static addClickTracking(html: string, recipient: string): string {
    const trackingId = Buffer.from(recipient).toString('base64')
    
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track/click?url=${encodeURIComponent(url)}&id=${trackingId}`
        return `href="${trackedUrl}"`
      }
    )
  }

  // Send welcome email
  static async sendWelcomeEmail(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Sparkle Universe! ✨',
      template: 'WelcomeEmail',
      data: {
        name: user.profile?.displayName || user.username,
        username: user.username,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=...`,
        profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.username}`,
      },
      category: 'onboarding',
      priority: 'high',
    })
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Sparkle Universe',
      template: 'PasswordResetEmail',
      data: {
        resetUrl,
        expiresIn: '1 hour',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send verification code email
  static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Sparkle Universe',
      template: 'VerificationEmail',
      data: {
        code,
        expiresIn: '10 minutes',
      },
      category: 'security',
      priority: 'high',
    })
  }

  // Send weekly digest
  static async sendWeeklyDigest(userId: string): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) return

    // Get weekly stats
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [posts, followers, achievements] = await Promise.all([
      db.post.findMany({
        where: {
          createdAt: { gte: weekAgo },
          author: { followers: { some: { followerId: userId } } },
        },
        take: 5,
        orderBy: { likes: 'desc' },
        include: { author: true },
      }),
      db.follow.count({
        where: {
          followingId: userId,
          createdAt: { gte: weekAgo },
        },
      }),
      db.userAchievement.count({
        where: {
          userId,
          unlockedAt: { gte: weekAgo },
        },
      }),
    ])

    await this.sendEmail({
      to: user.email,
      subject: 'Your Weekly Sparkle Universe Digest ✨',
      template: 'WeeklyDigestEmail',
      data: {
        name: user.profile?.displayName || user.username,
        posts,
        newFollowers: followers,
        achievementsUnlocked: achievements,
        week: weekAgo.toLocaleDateString(),
      },
      category: 'digest',
      trackOpens: true,
      trackClicks: true,
    })
  }
}

```

# src/services/notification.service.ts
```ts
// src/services/notification.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { 
  NotificationType, 
  NotificationPreference,
  Prisma 
} from '@prisma/client'
import { eventEmitter } from '@/lib/events/event-emitter'

export interface CreateNotificationInput {
  type: NotificationType
  userId: string
  actorId?: string
  entityId?: string
  entityType?: string
  title: string
  message: string
  data?: any
  imageUrl?: string
  actionUrl?: string
  priority?: number
}

export interface NotificationOptions {
  email?: boolean
  push?: boolean
  sms?: boolean
}

export class NotificationService {
  private static readonly CACHE_PREFIX = 'notifications:'
  private static readonly UNREAD_COUNT_KEY = 'unread_count:'

  // Create notification
  static async createNotification(
    input: CreateNotificationInput,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating notification', { 
      type: input.type, 
      userId: input.userId 
    })

    // Check user preferences
    const preferences = await this.getUserPreferences(input.userId)
    if (!preferences) {
      logger.warn('User preferences not found', { userId: input.userId })
      return null
    }

    // Check if user wants this type of notification
    if (!this.shouldSendNotification(input.type, preferences)) {
      logger.info('Notification skipped due to user preferences', {
        type: input.type,
        userId: input.userId,
      })
      return null
    }

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        ...input,
        expiresAt: this.calculateExpiryDate(input.type),
      },
    })

    // Update unread count in cache
    await this.incrementUnreadCount(input.userId)

    // Send real-time notification if user is online
    await this.sendRealtimeNotification(notification)

    // Queue for other channels based on preferences and options
    if (options.email || (options.email === undefined && preferences.emailNotifications)) {
      await this.queueEmailNotification(notification)
    }

    if (options.push || (options.push === undefined && preferences.pushNotifications)) {
      await this.queuePushNotification(notification)
    }

    if (options.sms || (options.sms === undefined && preferences.smsNotifications)) {
      await this.queueSmsNotification(notification)
    }

    // Emit notification created event
    eventEmitter.emit('notification:created', { notification })

    return notification
  }

  // Create bulk notifications
  static async createBulkNotifications(
    userIds: string[],
    template: Omit<CreateNotificationInput, 'userId'>,
    options: NotificationOptions = {}
  ) {
    logger.info('Creating bulk notifications', { 
      userCount: userIds.length,
      type: template.type 
    })

    const notifications = await transaction(async (tx) => {
      const created = await Promise.all(
        userIds.map((userId) =>
          tx.notification.create({
            data: {
              ...template,
              userId,
              expiresAt: this.calculateExpiryDate(template.type),
            },
          })
        )
      )
      return created
    })

    // Update unread counts
    await Promise.all(
      userIds.map((userId) => this.incrementUnreadCount(userId))
    )

    // Send realtime notifications
    await Promise.all(
      notifications.map((notification) =>
        this.sendRealtimeNotification(notification)
      )
    )

    return notifications
  }

  // Get user preferences
  private static async getUserPreferences(
    userId: string
  ): Promise<NotificationPreference | null> {
    return db.notificationPreference.findUnique({
      where: { userId },
    })
  }

  // Check if notification should be sent based on type and preferences
  private static shouldSendNotification(
    type: NotificationType,
    preferences: NotificationPreference
  ): boolean {
    const typePreferenceMap: Record<NotificationType, keyof NotificationPreference> = {
      [NotificationType.POST_LIKED]: 'postLikes',
      [NotificationType.POST_COMMENTED]: 'postComments',
      [NotificationType.COMMENT_LIKED]: 'postLikes',
      [NotificationType.USER_FOLLOWED]: 'newFollowers',
      [NotificationType.MENTION]: 'mentions',
      [NotificationType.DIRECT_MESSAGE]: 'directMessages',
      [NotificationType.GROUP_INVITE]: 'groupInvites',
      [NotificationType.EVENT_REMINDER]: 'eventReminders',
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 'emailNotifications',
      [NotificationType.LEVEL_UP]: 'emailNotifications',
      [NotificationType.SYSTEM]: 'emailNotifications',
      [NotificationType.GROUP_POST]: 'groupInvites',
      [NotificationType.WATCH_PARTY_INVITE]: 'eventReminders',
      [NotificationType.YOUTUBE_PREMIERE]: 'eventReminders',
      [NotificationType.QUEST_COMPLETE]: 'emailNotifications',
      [NotificationType.TRADE_REQUEST]: 'directMessages',
      [NotificationType.CONTENT_FEATURED]: 'emailNotifications',
      [NotificationType.MILESTONE_REACHED]: 'emailNotifications',
    }

    const preferenceKey = typePreferenceMap[type]
    return preferences[preferenceKey] as boolean
  }

  // Calculate notification expiry date
  private static calculateExpiryDate(type: NotificationType): Date {
    const expiryDays = {
      [NotificationType.SYSTEM]: 30,
      [NotificationType.ACHIEVEMENT_UNLOCKED]: 90,
      [NotificationType.LEVEL_UP]: 90,
      [NotificationType.CONTENT_FEATURED]: 90,
      [NotificationType.MILESTONE_REACHED]: 90,
      // Most notifications expire after 7 days
      default: 7,
    }

    const days = expiryDays[type] || expiryDays.default
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  // Send realtime notification
  private static async sendRealtimeNotification(notification: any) {
    const isOnline = await redis.exists(`presence:${notification.userId}`)
    
    if (isOnline) {
      // Publish to user's channel
      await redis.publish(
        `notifications:${notification.userId}`,
        JSON.stringify(notification)
      )
    }
  }

  // Queue email notification
  private static async queueEmailNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'email',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue push notification
  private static async queuePushNotification(notification: any) {
    await db.notificationQueue.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        channel: 'push',
        payload: notification,
        priority: notification.priority || 0,
      },
    })
  }

  // Queue SMS notification
  private static async queueSmsNotification(notification: any) {
    // Only for high priority notifications
    if (notification.priority >= 2) {
      await db.notificationQueue.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          channel: 'sms',
          payload: notification,
          priority: notification.priority,
        },
      })
    }
  }

  // Get notifications for user
  static async getNotifications(
    userId: string,
    options: {
      limit?: number
      cursor?: string
      unreadOnly?: boolean
      types?: NotificationType[]
    } = {}
  ) {
    const { limit = 20, cursor, unreadOnly = false, types } = options

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly && { read: false }),
      ...(types && { type: { in: types } }),
      ...(cursor && { id: { lt: cursor } }),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, -1) : notifications
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      hasMore,
    }
  }

  // Mark notification as read
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Update unread count
    await this.decrementUnreadCount(userId)

    eventEmitter.emit('notification:read', { notification })
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Clear unread count
    await redis.del(`${this.UNREAD_COUNT_KEY}${userId}`)

    eventEmitter.emit('notification:allRead', { userId })
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    // Try cache first
    const cached = await redis.get(`${this.UNREAD_COUNT_KEY}${userId}`)
    if (cached !== null) {
      return parseInt(cached, 10)
    }

    // Count from database
    const count = await db.notification.count({
      where: {
        userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    // Cache for 5 minutes
    await redis.setex(`${this.UNREAD_COUNT_KEY}${userId}`, 300, count)
    return count
  }

  // Update unread count
  private static async incrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      await redis.incr(key)
    }
  }

  private static async decrementUnreadCount(userId: string): Promise<void> {
    const key = `${this.UNREAD_COUNT_KEY}${userId}`
    const exists = await redis.exists(key)
    
    if (exists) {
      const count = await redis.decr(key)
      if (count < 0) {
        await redis.set(key, 0)
      }
    }
  }

  // Delete notification
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const notification = await db.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user owns this notification
      },
    })

    if (!notification.read) {
      await this.decrementUnreadCount(userId)
    }

    eventEmitter.emit('notification:deleted', { notification })
  }

  // Clean up expired notifications
  static async cleanupExpiredNotifications(): Promise<number> {
    const result = await db.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    logger.info('Cleaned up expired notifications', { count: result.count })
    return result.count
  }
}

```

# src/services/upload.service.ts
```ts
// src/services/upload.service.ts
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { eventEmitter } from '@/lib/events/event-emitter'

// Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET!
const S3_REGION = process.env.AWS_S3_REGION!
const CDN_URL = process.env.CDN_URL!
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Image optimization presets
const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 320, height: 320, quality: 85 },
  medium: { width: 640, height: 640, quality: 85 },
  large: { width: 1280, height: 1280, quality: 90 },
  original: { quality: 95 },
}

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface UploadOptions {
  userId: string
  file: Buffer | Uint8Array
  filename: string
  mimeType: string
  category?: 'avatar' | 'post' | 'message' | 'document' | 'video'
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface UploadResult {
  id: string
  url: string
  cdnUrl: string
  thumbnailUrl?: string
  fileSize: number
  mimeType: string
  dimensions?: { width: number; height: number }
  duration?: number
  blurhash?: string
  variants?: Record<string, string>
}

export interface UploadProgress {
  uploadId: string
  progress: number
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export class UploadService {
  // Track upload progress
  private static uploadProgress = new Map<string, UploadProgress>()

  // Main upload method
  static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const uploadId = uuidv4()
    logger.info('Starting file upload', { uploadId, userId: options.userId, filename: options.filename })

    try {
      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'preparing' 
      })

      // Validate file
      await this.validateFile(options)

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(options.file)
      
      // Check if file already exists
      const existingFile = await this.checkExistingFile(fileHash, options.userId)
      if (existingFile) {
        logger.info('File already exists, returning existing', { fileHash })
        return this.formatUploadResult(existingFile)
      }

      // Process file based on type
      let result: UploadResult
      
      if (ALLOWED_IMAGE_TYPES.includes(options.mimeType)) {
        result = await this.processImageUpload(options, uploadId)
      } else if (ALLOWED_VIDEO_TYPES.includes(options.mimeType)) {
        result = await this.processVideoUpload(options, uploadId)
      } else {
        result = await this.processDocumentUpload(options, uploadId)
      }

      // Save to database
      await this.saveFileRecord(result, options, fileHash)

      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 100, 
        status: 'completed' 
      })

      // Emit upload complete event
      eventEmitter.emit('file:uploaded', { 
        userId: options.userId, 
        fileId: result.id,
        fileType: options.category,
      })

      logger.info('File upload completed', { uploadId, fileId: result.id })
      return result

    } catch (error) {
      logger.error('File upload failed', error, { uploadId })
      
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      })

      throw error
    } finally {
      // Clean up progress after delay
      setTimeout(() => {
        this.uploadProgress.delete(uploadId)
      }, 60000) // Keep for 1 minute
    }
  }

  // Process image upload with optimization
  private static async processImageUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const image = sharp(options.file)
    const metadata = await image.metadata()
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file')
    }

    const fileId = uuidv4()
    const baseKey = `${options.category || 'general'}/${options.userId}/${fileId}`
    const variants: Record<string, string> = {}

    // Generate blurhash for placeholder
    const blurhash = await this.generateBlurhash(options.file)

    // Upload original
    const originalKey = `${baseKey}/original.${metadata.format}`
    await this.uploadToS3(originalKey, options.file, options.mimeType)
    
    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 30, 
      status: 'uploading' 
    })

    // Process and upload variants
    let processedCount = 0
    const totalVariants = Object.keys(IMAGE_PRESETS).length - 1 // Exclude original

    for (const [preset, config] of Object.entries(IMAGE_PRESETS)) {
      if (preset === 'original') continue

      try {
        const processedBuffer = await sharp(options.file)
          .resize(config.width, config.height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer()

        const variantKey = `${baseKey}/${preset}.jpg`
        await this.uploadToS3(variantKey, processedBuffer, 'image/jpeg')
        variants[preset] = `${CDN_URL}/${variantKey}`

        processedCount++
        const progress = 30 + (processedCount / totalVariants * 60)
        this.updateProgress(uploadId, { 
          uploadId, 
          progress, 
          status: 'processing' 
        })

      } catch (error) {
        logger.error(`Failed to process ${preset} variant`, error)
      }
    }

    return {
      id: fileId,
      url: `${CDN_URL}/${originalKey}`,
      cdnUrl: `${CDN_URL}/${originalKey}`,
      thumbnailUrl: variants.thumbnail,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      dimensions: { width: metadata.width, height: metadata.height },
      blurhash,
      variants,
    }
  }

  // Process video upload
  private static async processVideoUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const key = `${options.category || 'video'}/${options.userId}/${fileId}/original.mp4`

    // Upload video
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 80, 
      status: 'processing' 
    })

    // Generate thumbnail (would use ffmpeg in production)
    // For now, we'll use a placeholder
    const thumbnailUrl = `${CDN_URL}/video-thumbnail-placeholder.jpg`

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      thumbnailUrl,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      duration: 0, // Would extract from video metadata
    }
  }

  // Process document upload
  private static async processDocumentUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const extension = this.getFileExtension(options.filename)
    const key = `${options.category || 'document'}/${options.userId}/${fileId}/original.${extension}`

    // Upload document
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 90, 
      status: 'processing' 
    })

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      fileSize: options.file.length,
      mimeType: options.mimeType,
    }
  }

  // Upload to S3
  private static async uploadToS3(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    })

    await s3Client.send(command)
  }

  // Generate presigned upload URL for direct client uploads
  static async generatePresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; fileId: string; key: string }> {
    // Validate
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.isAllowedFileType(contentType)) {
      throw new Error('File type not allowed')
    }

    const fileId = uuidv4()
    const extension = this.getFileExtension(filename)
    const key = `uploads/${userId}/${fileId}/original.${extension}`

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

    return { uploadUrl, fileId, key }
  }

  // Delete file
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await db.mediaFile.findFirst({
      where: { id: fileId, userId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.storagePath,
    })

    await s3Client.send(deleteCommand)

    // Delete from database
    await db.mediaFile.delete({ where: { id: fileId } })

    // Clear cache
    await redis.del(`file:${fileId}`)

    logger.info('File deleted', { fileId, userId })
  }

  // Validate file
  private static async validateFile(options: UploadOptions): Promise<void> {
    // Check file size
    if (options.file.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Check file type
    if (!this.isAllowedFileType(options.mimeType)) {
      throw new Error('File type not allowed')
    }

    // Virus scan placeholder
    // In production, integrate with ClamAV or similar
    await this.scanForViruses(options.file)
  }

  // Check if file type is allowed
  private static isAllowedFileType(mimeType: string): boolean {
    return [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ].includes(mimeType)
  }

  // Generate file hash
  private static generateFileHash(buffer: Buffer | Uint8Array): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  // Check for existing file
  private static async checkExistingFile(hash: string, userId: string) {
    // Check cache first
    const cached = await redisHelpers.getJSON(`file:hash:${hash}`)
    if (cached) return cached

    // Check database
    return db.mediaFile.findFirst({
      where: { 
        metadata: { 
          path: ['hash'], 
          equals: hash 
        },
      },
    })
  }

  // Generate blurhash
  private static async generateBlurhash(buffer: Buffer): Promise<string> {
    // In production, use blurhash library
    // For now, return placeholder
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
  }

  // Get file extension
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts[parts.length - 1].toLowerCase()
  }

  // Save file record to database
  private static async saveFileRecord(
    result: UploadResult,
    options: UploadOptions,
    hash: string
  ): Promise<void> {
    await db.mediaFile.create({
      data: {
        id: result.id,
        userId: options.userId,
        fileType: this.getFileType(options.mimeType),
        fileSize: BigInt(result.fileSize),
        mimeType: options.mimeType,
        originalName: options.filename,
        storagePath: result.url.replace(CDN_URL + '/', ''),
        cdnUrl: result.cdnUrl,
        thumbnailUrl: result.thumbnailUrl,
        blurhash: result.blurhash,
        dimensions: result.dimensions,
        duration: result.duration,
        metadata: {
          hash,
          variants: result.variants,
          ...options.metadata,
        },
        isPublic: options.isPublic ?? true,
        processedAt: new Date(),
      },
    })

    // Cache file info
    await redisHelpers.setJSON(`file:${result.id}`, result, 3600)
    await redisHelpers.setJSON(`file:hash:${hash}`, result, 3600)
  }

  // Get file type category
  private static getFileType(mimeType: string): string {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document'
    return 'other'
  }

  // Scan for viruses (placeholder)
  private static async scanForViruses(buffer: Buffer | Uint8Array): Promise<void> {
    // In production, integrate with ClamAV or similar
    // For now, just log
    logger.debug('Virus scan placeholder - would scan file in production')
  }

  // Update upload progress
  private static updateProgress(uploadId: string, progress: UploadProgress): void {
    this.uploadProgress.set(uploadId, progress)
    
    // Emit progress event
    eventEmitter.emit('upload:progress', progress)
  }

  // Get upload progress
  static getUploadProgress(uploadId: string): UploadProgress | null {
    return this.uploadProgress.get(uploadId) || null
  }

  // Format upload result from database record
  private static formatUploadResult(file: any): UploadResult {
    return {
      id: file.id,
      url: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      cdnUrl: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      thumbnailUrl: file.thumbnailUrl,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      dimensions: file.dimensions as any,
      duration: file.duration,
      blurhash: file.blurhash,
      variants: file.metadata?.variants,
    }
  }

  // Get file by ID
  static async getFile(fileId: string): Promise<UploadResult | null> {
    // Check cache
    const cached = await redisHelpers.getJSON<UploadResult>(`file:${fileId}`)
    if (cached) return cached

    // Get from database
    const file = await db.mediaFile.findUnique({
      where: { id: fileId },
    })

    if (!file) return null

    const result = this.formatUploadResult(file)
    
    // Cache for future requests
    await redisHelpers.setJSON(`file:${fileId}`, result, 3600)
    
    return result
  }
}

```

# src/services/user.service.ts
```ts
// src/services/user.service.ts
import { db, transaction } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger, performance } from '@/lib/monitoring'
import { 
  User, 
  UserRole, 
  UserStatus, 
  Prisma,
  NotificationType 
} from '@prisma/client'
import { 
  hashPassword, 
  validatePasswordStrength,
  validateField,
  SCHEMA_LIMITS,
  generateCorrelationId
} from '@/lib/security'
import { generateUsername, generateSlug } from '@/lib/utils'
import { eventEmitter } from '@/lib/events/event-emitter'

// Cache configuration
const CACHE_CONFIG = {
  USER_TTL: 300,        // 5 minutes for user data
  PROFILE_TTL: 600,     // 10 minutes for profiles
  STATS_TTL: 60,        // 1 minute for stats (changes frequently)
  LIST_TTL: 120,        // 2 minutes for lists
} as const

// User creation input with validation
export interface CreateUserInput {
  email: string
  password?: string
  username?: string
  provider?: string
  providerId?: string
  image?: string
  emailVerified?: boolean
}

// User update input with validation
export interface UpdateUserInput {
  username?: string
  bio?: string
  image?: string
  displayName?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// Cache keys generator
const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByUsername: (username: string) => `user:username:${username}`,
  userProfile: (id: string) => `user:profile:${id}`,
  userStats: (id: string) => `user:stats:${id}`,
  userList: (params: string) => `user:list:${params}`,
} as const

// Enhanced User service class
export class UserService {
  // Create a new user with comprehensive validation
  static async createUser(input: CreateUserInput): Promise<User> {
    const correlationId = generateCorrelationId()
    const timer = performance.start('user.create')
    
    logger.info('Creating new user', { 
      email: input.email, 
      correlationId 
    })

    try {
      // Validate email
      const emailValidation = validateField('email', input.email)
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error)
      }

      // Validate username if provided
      if (input.username) {
        const usernameValidation = validateField('username', input.username)
        if (!usernameValidation.valid) {
          throw new Error(usernameValidation.error)
        }
      } else {
        input.username = generateUsername(input.email)
      }

      // Ensure username is unique
      let username = input.username
      let attempts = 0
      while (attempts < 5) {
        const existing = await db.user.findUnique({ 
          where: { username },
          select: { id: true } // Only select what we need
        })
        if (!existing) break
        username = `${input.username}${Math.random().toString(36).substring(2, 6)}`
        attempts++
      }

      if (attempts === 5) {
        throw new Error('Failed to generate unique username')
      }

      // Hash password if provided
      let hashedPassword: string | undefined
      if (input.password) {
        const passwordValidation = validatePasswordStrength(input.password)
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors.join(', '))
        }
        hashedPassword = await hashPassword(input.password)
      }

      // Create user with profile in transaction with proper isolation
      const user = await transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email: input.email,
            username,
            hashedPassword,
            authProvider: input.provider as any || 'LOCAL',
            emailVerified: input.emailVerified ? new Date() : null,
            image: input.image,
            status: input.emailVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
            role: UserRole.USER,
          },
        })

        // Create related records
        const [profile, stats, balance, notificationPrefs] = await Promise.all([
          // Create profile
          tx.profile.create({
            data: {
              userId: newUser.id,
              displayName: username,
              profileCompleteness: 20, // Basic profile created
            },
          }),
          
          // Create user stats
          tx.userStats.create({
            data: {
              userId: newUser.id,
            },
          }),
          
          // Create user balance
          tx.userBalance.create({
            data: {
              userId: newUser.id,
              sparklePoints: 100, // Welcome bonus
              lifetimeEarned: 100,
            },
          }),
          
          // Create notification preferences
          tx.notificationPreference.create({
            data: {
              userId: newUser.id,
            },
          }),
        ])

        // Create currency transaction for welcome bonus
        await tx.currencyTransaction.create({
          data: {
            userId: newUser.id,
            amount: 100,
            currencyType: 'sparkle',
            transactionType: 'earn',
            source: 'welcome_bonus',
            description: 'Welcome to Sparkle Universe!',
            balanceBefore: 0,
            balanceAfter: 100,
          },
        })

        // Send welcome notification
        await tx.notification.create({
          data: {
            type: NotificationType.SYSTEM,
            userId: newUser.id,
            title: 'Welcome to Sparkle Universe! ✨',
            message: 'Your journey in the Sparkle community begins now. Complete your profile to earn your first achievement!',
            priority: 1,
          },
        })

        // Log XP for account creation
        await tx.xpLog.create({
          data: {
            userId: newUser.id,
            amount: 10,
            source: 'account_created',
            reason: 'Created account',
            totalXp: 10,
          },
        })

        return newUser
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      })

      // Emit user created event
      eventEmitter.emit('user:created', { user, correlationId })

      const timing = performance.end('user.create')
      logger.info('User created successfully', { 
        userId: user.id, 
        duration: timing?.duration,
        correlationId 
      })
      
      return user

    } catch (error) {
      const timing = performance.end('user.create')
      logger.error('Failed to create user', error, { 
        correlationId,
        duration: timing?.duration 
      })
      throw error
    }
  }

  // Get user by ID with smart caching
  static async getUserById(
    userId: string, 
    include?: Prisma.UserInclude,
    options?: { 
      skipCache?: boolean
      correlationId?: string 
    }
  ): Promise<User | null> {
    const correlationId = options?.correlationId || generateCorrelationId()
    
    // Generate cache key based on include params
    const cacheKey = include 
      ? `${CacheKeys.user(userId)}:${JSON.stringify(include)}`
      : CacheKeys.user(userId)
    
    // Try cache first (only for basic queries or if not skipped)
    if (!options?.skipCache) {
      const cached = await redisHelpers.getJSON<User>(cacheKey)
      if (cached) {
        logger.debug('User cache hit', { userId, correlationId })
        return cached
      }
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include,
    })

    // Cache the result with appropriate TTL
    if (user && !options?.skipCache) {
      const ttl = include ? CACHE_CONFIG.PROFILE_TTL : CACHE_CONFIG.USER_TTL
      await redisHelpers.setJSON(cacheKey, user, ttl)
    }

    return user
  }

  // Get user by username with caching
  static async getUserByUsername(
    username: string,
    include?: Prisma.UserInclude
  ): Promise<User | null> {
    // Check cache for user ID
    const cachedId = await redis.get(CacheKeys.userByUsername(username))
    
    if (cachedId) {
      return this.getUserById(cachedId, include)
    }

    // Fetch from database
    const user = await db.user.findUnique({
      where: { username },
      include,
    })

    if (user) {
      // Cache username -> ID mapping
      await redis.setex(
        CacheKeys.userByUsername(username), 
        CACHE_CONFIG.USER_TTL,
        user.id
      )
      
      // Also cache the full user object
      await redisHelpers.setJSON(
        CacheKeys.user(user.id),
        user,
        CACHE_CONFIG.USER_TTL
      )
    }

    return user
  }

  // Update user with validation and cache invalidation
  static async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<User> {
    const correlationId = generateCorrelationId()
    logger.info('Updating user', { userId, correlationId })

    // Validate input fields
    if (input.username) {
      const validation = validateField('username', input.username)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }

    if (input.bio && input.bio.length > SCHEMA_LIMITS.BIO_MAX) {
      throw new Error(`Bio must be ${SCHEMA_LIMITS.BIO_MAX} characters or less`)
    }

    const user = await transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          username: input.username,
          bio: input.bio,
          image: input.image,
        },
      })

      // Update profile if social links provided
      if (input.displayName || input.location || input.website || input.socialLinks) {
        const profileCompleteness = await this.calculateProfileCompleteness(userId, input)
        
        await tx.profile.update({
          where: { userId },
          data: {
            displayName: input.displayName,
            location: input.location,
            website: input.website,
            twitterUsername: input.socialLinks?.twitter,
            instagramUsername: input.socialLinks?.instagram,
            tiktokUsername: input.socialLinks?.tiktok,
            discordUsername: input.socialLinks?.discord,
            youtubeChannelId: input.socialLinks?.youtube,
            profileCompleteness,
            profileCompleted: profileCompleteness >= 80,
          },
        })
      }

      return updatedUser
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    })

    // Invalidate all caches for this user
    await this.invalidateUserCache(userId)

    // If username changed, invalidate old username cache
    const oldUser = await db.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    
    if (oldUser && oldUser.username !== input.username) {
      await redis.del(CacheKeys.userByUsername(oldUser.username))
    }

    // Emit user updated event
    eventEmitter.emit('user:updated', { user, correlationId })

    return user
  }

  // Calculate profile completeness
  private static async calculateProfileCompleteness(
    userId: string,
    updates?: UpdateUserInput
  ): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user || !user.profile) return 0

    const profile = { ...user.profile, ...updates }
    let score = 20 // Base score for account creation

    // Check each field
    if (user.image) score += 15
    if (user.bio) score += 10
    if (profile.displayName) score += 10
    if (profile.location) score += 5
    if (profile.website) score += 5
    if (profile.twitterUsername) score += 5
    if (profile.instagramUsername) score += 5
    if (profile.youtubeChannelId) score += 10
    if (user.emailVerified) score += 15

    return Math.min(100, score)
  }

  // Invalidate all caches for a user
  private static async invalidateUserCache(userId: string): Promise<void> {
    const keys = [
      CacheKeys.user(userId),
      CacheKeys.userProfile(userId),
      CacheKeys.userStats(userId),
      `${CacheKeys.user(userId)}:*`, // All variations with includes
    ]

    // Delete all matching keys
    for (const pattern of keys) {
      if (pattern.includes('*')) {
        const matchingKeys = await redis.keys(pattern)
        if (matchingKeys.length > 0) {
          await redis.del(...matchingKeys)
        }
      } else {
        await redis.del(pattern)
      }
    }
  }

  // Update user status with proper state management
  static async updateUserStatus(
    userId: string,
    status: UserStatus,
    reason?: string
  ): Promise<User> {
    const correlationId = generateCorrelationId()
    
    // Validate status transition
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { status: true },
    })

    if (!currentUser) {
      throw new Error('User not found')
    }

    // Check if status transition is valid
    if (!this.isValidStatusTransition(currentUser.status, status)) {
      throw new Error(`Invalid status transition from ${currentUser.status} to ${status}`)
    }

    const user = await db.user.update({
      where: { id: userId },
      data: {
        status,
        banReason: status === UserStatus.BANNED ? reason : null,
        banExpiresAt: status === UserStatus.SUSPENDED 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          : null,
      },
    })

    // Invalidate cache
    await this.invalidateUserCache(userId)

    // Emit status change event
    eventEmitter.emit('user:statusChanged', { 
      user, 
      status, 
      reason,
      correlationId 
    })

    return user
  }

  // Check if status transition is valid
  private static isValidStatusTransition(
    from: UserStatus,
    to: UserStatus
  ): boolean {
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING_VERIFICATION]: [UserStatus.ACTIVE, UserStatus.DELETED],
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.BANNED, UserStatus.DELETED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.BANNED, UserStatus.DELETED],
      [UserStatus.BANNED]: [UserStatus.ACTIVE, UserStatus.DELETED],
      [UserStatus.DELETED]: [], // No transitions from deleted
    }

    return validTransitions[from]?.includes(to) || false
  }

  // Get user stats with caching
  static async getUserStats(userId: string) {
    const cacheKey = CacheKeys.userStats(userId)
    
    // Try cache first
    const cached = await redisHelpers.getJSON(cacheKey)
    if (cached) return cached

    const stats = await db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) {
      // Create stats if they don't exist
      const newStats = await db.userStats.create({
        data: { userId },
      })
      
      await redisHelpers.setJSON(cacheKey, newStats, CACHE_CONFIG.STATS_TTL)
      return newStats
    }

    // Cache stats with short TTL as they change frequently
    await redisHelpers.setJSON(cacheKey, stats, CACHE_CONFIG.STATS_TTL)
    return stats
  }

  // Update user experience and level with proper calculations
  static async addExperience(
    userId: string,
    amount: number,
    source: string,
    reason?: string
  ): Promise<void> {
    const correlationId = generateCorrelationId()
    
    await transaction(async (tx) => {
      // Get current user data
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, level: true },
      })

      if (!user) throw new Error('User not found')

      const newExperience = user.experience + amount
      const newLevel = this.calculateLevel(newExperience)

      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          experience: newExperience,
          level: newLevel,
        },
      })

      // Log XP gain
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          source,
          reason,
          totalXp: newExperience,
        },
      })

      // Check for level up
      if (newLevel > user.level) {
        // Create level up notification
        await tx.notification.create({
          data: {
            type: NotificationType.LEVEL_UP,
            userId,
            title: `Level Up! You're now level ${newLevel}! 🎉`,
            message: `Congratulations on reaching level ${newLevel}! Keep up the great work!`,
            data: { 
              oldLevel: user.level, 
              newLevel,
              experience: newExperience 
            },
            priority: 1,
          },
        })

        // Award level up bonus using proper transaction
        await tx.userBalance.update({
          where: { userId },
          data: {
            sparklePoints: { increment: newLevel * 10 },
            lifetimeEarned: { increment: newLevel * 10 },
          },
        })

        // Log currency transaction
        const balance = await tx.userBalance.findUnique({
          where: { userId },
          select: { sparklePoints: true },
        })

        await tx.currencyTransaction.create({
          data: {
            userId,
            amount: newLevel * 10,
            currencyType: 'sparkle',
            transactionType: 'earn',
            source: 'level_up',
            description: `Level ${newLevel} reward`,
            balanceBefore: (balance?.sparklePoints || 0) - (newLevel * 10),
            balanceAfter: balance?.sparklePoints || 0,
          },
        })

        // Emit level up event
        eventEmitter.emit('user:levelUp', { 
          userId, 
          oldLevel: user.level, 
          newLevel,
          correlationId 
        })
      }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // For financial operations
    })

    // Invalidate stats cache
    await redis.del(CacheKeys.userStats(userId))
  }

  // Enhanced level calculation with progressive curve
  private static calculateLevel(experience: number): number {
    // Progressive level curve: each level requires more XP
    // Level 1: 0-100 XP
    // Level 2: 100-250 XP (150 required)
    // Level 3: 250-450 XP (200 required)
    // And so on...
    
    let level = 1
    let totalRequired = 0
    let increment = 100

    while (totalRequired <= experience) {
      totalRequired += increment
      if (totalRequired <= experience) {
        level++
        increment += 50 // Each level requires 50 more XP than the previous
      }
    }

    return level
  }

  // Enhanced user search with caching
  static async searchUsers(
    query: string,
    options: {
      limit?: number
      offset?: number
      role?: UserRole
      status?: UserStatus
    } = {}
  ) {
    const { limit = 20, offset = 0, role, status } = options
    
    // Generate cache key for search results
    const cacheKey = CacheKeys.userList(
      `search:${query}:${limit}:${offset}:${role || ''}:${status || ''}`
    )

    // Try cache first
    const cached = await redisHelpers.getJSON(cacheKey)
    if (cached) return cached

    const results = await db.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
            ],
          },
          role ? { role } : {},
          status ? { status } : {},
          { deletedAt: null },
        ],
      },
      include: {
        profile: {
          select: {
            displayName: true,
            location: true,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: {
              where: { published: true },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: [
        { verified: 'desc' }, // Verified users first
        { followers: { _count: 'desc' } }, // Then by follower count
      ],
    })

    // Cache results with short TTL
    await redisHelpers.setJSON(cacheKey, results, CACHE_CONFIG.LIST_TTL)

    return results
  }

  // Get user's public profile with optimized queries
  static async getPublicProfile(username: string) {
    const correlationId = generateCorrelationId()
    const timer = performance.start('user.getPublicProfile')

    try {
      const user = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          image: true,
          bio: true,
          role: true,
          verified: true,
          level: true,
          createdAt: true,
          lastSeenAt: true,
          profile: {
            select: {
              displayName: true,
              location: true,
              website: true,
              twitterUsername: true,
              instagramUsername: true,
              youtubeChannelId: true,
              interests: true,
              skills: true,
            },
          },
          stats: {
            select: {
              totalPosts: true,
              totalFollowers: true,
              totalFollowing: true,
              totalLikesReceived: true,
            },
          },
          _count: {
            select: {
              posts: {
                where: { published: true },
              },
              followers: true,
              following: true,
            },
          },
        },
      })

      if (!user || user.status === UserStatus.BANNED) {
        return null
      }

      const timing = performance.end('user.getPublicProfile')
      logger.debug('Public profile fetched', {
        username,
        duration: timing?.duration,
        correlationId,
      })

      return user
    } catch (error) {
      const timing = performance.end('user.getPublicProfile')
      logger.error('Failed to get public profile', error, {
        username,
        duration: timing?.duration,
        correlationId,
      })
      throw error
    }
  }

  // Check if username is available with caching
  static async isUsernameAvailable(username: string): Promise<boolean> {
    // Validate username format
    const validation = validateField('username', username)
    if (!validation.valid) {
      return false
    }

    // Check cache first
    const cached = await redis.exists(CacheKeys.userByUsername(username))
    if (cached) return false

    const user = await db.user.findUnique({
      where: { username },
      select: { id: true },
    })
    
    return !user
  }

  // Soft delete user with cleanup
  static async deleteUser(userId: string): Promise<void> {
    const correlationId = generateCorrelationId()
    
    await transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DELETED,
          deletedAt: new Date(),
          email: `deleted_${userId}@deleted.com`, // Anonymize email
          username: `deleted_${userId}`, // Anonymize username
        },
      })

      // Anonymize profile
      await tx.profile.updateMany({
        where: { userId },
        data: {
          displayName: 'Deleted User',
          location: null,
          website: null,
          twitterUsername: null,
          instagramUsername: null,
          youtubeChannelId: null,
        },
      })

      // Cancel active subscriptions
      await tx.userSubscription.updateMany({
        where: { userId },
        data: {
          status: 'CANCELLED' as any,
          cancelledAt: new Date(),
        },
      })
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    })

    // Clear all caches
    await this.invalidateUserCache(userId)

    // Emit user deleted event
    eventEmitter.emit('user:deleted', { userId, correlationId })
  }
}

```

# src/types/index.ts
```ts
// src/types/index.ts
import { User, Post, Comment, Notification } from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasMore: boolean
}

export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

// User types
export interface UserWithProfile extends User {
  profile: {
    displayName: string | null
    location: string | null
    website: string | null
    bannerImage: string | null
  } | null
}

export interface PublicUser {
  id: string
  username: string
  image: string | null
  bio: string | null
  verified: boolean
  level: number
  createdAt: Date
}

export interface UserStats {
  posts: number
  followers: number
  following: number
  likes: number
}

// Post types
export interface PostWithAuthor extends Post {
  author: PublicUser
  _count: {
    comments: number
    reactions: number
  }
}

export interface PostWithDetails extends PostWithAuthor {
  tags: Array<{
    tag: {
      id: string
      name: string
      slug: string
    }
  }>
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Comment types
export interface CommentWithAuthor extends Comment {
  author: PublicUser
  _count: {
    reactions: number
    replies: number
  }
}

export interface CommentWithReplies extends CommentWithAuthor {
  replies: CommentWithAuthor[]
  reactions: Array<{
    type: string
    userId: string
  }>
}

// Notification types
export interface NotificationWithActor extends Notification {
  actor: PublicUser | null
}

// Form types
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export interface PostFormData {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags: string[]
  published: boolean
}

export interface ProfileFormData {
  displayName?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    tiktok?: string
    discord?: string
    youtube?: string
  }
}

// Search types
export interface SearchFilters {
  query: string
  type?: 'posts' | 'users' | 'tags'
  sortBy?: 'relevance' | 'recent' | 'popular'
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  tags?: string[]
}

// WebSocket event types
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  error: (error: Error) => void

  // User events
  userOnline: (userId: string) => void
  userOffline: (userId: string) => void
  userTyping: (data: { userId: string; channelId: string }) => void

  // Notification events
  notification: (notification: NotificationWithActor) => void

  // Real-time updates
  postUpdate: (post: PostWithAuthor) => void
  commentUpdate: (comment: CommentWithAuthor) => void
  reactionUpdate: (data: { 
    entityType: 'post' | 'comment'
    entityId: string
    reactions: Record<string, number>
  }) => void
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Too many requests', 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?:
      Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

```

