// src/app/(auth)/layout.tsx
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-cyan-50 dark:from-violet-950/20 dark:via-pink-950/20 dark:to-cyan-950/20">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-400/20 to-pink-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-cyan-400/20 to-violet-400/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-r from-pink-400/10 to-violet-400/10 blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity">
          <div className="relative">
            <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            <Sparkles className="absolute top-0 left-0 h-8 w-8 text-pink-600 dark:text-pink-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <span className="bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
            Sparkle Universe
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center p-4">
        {children}
      </main>
    </div>
  )
}
