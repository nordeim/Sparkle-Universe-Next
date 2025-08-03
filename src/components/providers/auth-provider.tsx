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
