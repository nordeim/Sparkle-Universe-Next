// src/hooks/use-auth.ts
'use client'

import * as React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { UserRole } from '@prisma/client'

/**
 * Role hierarchy for permission checking
 * SYSTEM has highest privileges for automated operations
 */
const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  CREATOR: 2,
  VERIFIED_CREATOR: 3,
  MODERATOR: 4,
  ADMIN: 5,
  SYSTEM: 6, // Highest level for system operations
}

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
    (role: UserRole | UserRole[]): boolean => {
      if (!session?.user) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(session.user.role)
    },
    [session]
  )

  const hasMinimumRole = useCallback(
    (minimumRole: UserRole): boolean => {
      if (!session?.user) return false
      return roleHierarchy[session.user.role] >= roleHierarchy[minimumRole]
    },
    [session]
  )

  const getUserRoleLevel = useCallback((): number => {
    if (!session?.user) return 0
    return roleHierarchy[session.user.role] || 0
  }, [session])

  const isHigherRole = useCallback(
    (targetRole: UserRole): boolean => {
      if (!session?.user) return false
      return roleHierarchy[session.user.role] > roleHierarchy[targetRole]
    },
    [session]
  )

  const canModerate = useCallback(
    (targetRole?: UserRole): boolean => {
      if (!session?.user) return false
      
      // System users can moderate anyone
      if (session.user.role === UserRole.SYSTEM) return true
      
      // Admins can moderate anyone except system users
      if (session.user.role === UserRole.ADMIN) {
        return !targetRole || targetRole !== UserRole.SYSTEM
      }
      
      // Moderators can moderate users, creators, and verified creators
      if (session.user.role === UserRole.MODERATOR) {
        return !targetRole || roleHierarchy[targetRole] < roleHierarchy[UserRole.MODERATOR]
      }
      
      return false
    },
    [session]
  )

  // Memoized role checks
  const roleChecks = useMemo(() => {
    const userRole = session?.user?.role
    return {
      isUser: userRole === UserRole.USER,
      isCreator: userRole ? [UserRole.CREATOR, UserRole.VERIFIED_CREATOR].includes(userRole) : false,
      isVerifiedCreator: userRole === UserRole.VERIFIED_CREATOR,
      isModerator: hasMinimumRole(UserRole.MODERATOR),
      isAdmin: hasRole([UserRole.ADMIN, UserRole.SYSTEM]),
      isSystem: userRole === UserRole.SYSTEM,
    }
  }, [session, hasRole, hasMinimumRole])

  // Permission checks
  const permissions = useMemo(() => ({
    canCreateContent: !!session?.user,
    canModerateContent: hasMinimumRole(UserRole.MODERATOR),
    canManageUsers: hasRole([UserRole.ADMIN, UserRole.SYSTEM]),
    canAccessAdminPanel: hasMinimumRole(UserRole.MODERATOR),
    canEditSystemSettings: hasRole([UserRole.ADMIN, UserRole.SYSTEM]),
    canImpersonateUsers: session?.user?.role === UserRole.SYSTEM,
    canBypassRateLimits: hasRole([UserRole.ADMIN, UserRole.SYSTEM]),
    canViewAnalytics: hasMinimumRole(UserRole.CREATOR),
    canMonetizeContent: hasMinimumRole(UserRole.CREATOR),
    canVerifyCreators: hasRole([UserRole.ADMIN, UserRole.SYSTEM]),
  }), [session, hasRole, hasMinimumRole])

  return {
    // Session data
    user: session?.user,
    session,
    status,
    
    // Loading states
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated',
    
    // Actions
    update,
    login,
    logout,
    
    // Role checks
    hasRole,
    hasMinimumRole,
    getUserRoleLevel,
    isHigherRole,
    canModerate,
    
    // Convenience role booleans
    ...roleChecks,
    
    // Permission booleans
    ...permissions,
  }
}

// Export types for use in components
export type AuthHookReturn = ReturnType<typeof useAuth>
export type RoleChecks = AuthHookReturn['isUser'] | AuthHookReturn['isCreator'] | AuthHookReturn['isVerifiedCreator'] | AuthHookReturn['isModerator'] | AuthHookReturn['isAdmin'] | AuthHookReturn['isSystem']

// Helper hook for requiring authentication
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// Helper hook for requiring specific role
export function useRequireRole(role: UserRole | UserRole[], redirectTo = '/unauthorized') {
  const { hasRole, isLoading } = useAuth()
  const router = useRouter()
  const hasRequiredRole = hasRole(role)

  React.useEffect(() => {
    if (!isLoading && !hasRequiredRole) {
      router.push(redirectTo)
    }
  }, [hasRequiredRole, isLoading, router, redirectTo])

  return { hasRequiredRole, isLoading }
}

// Helper hook for requiring minimum role
export function useRequireMinimumRole(minimumRole: UserRole, redirectTo = '/unauthorized') {
  const { hasMinimumRole, isLoading } = useAuth()
  const router = useRouter()
  const hasRequiredRole = hasMinimumRole(minimumRole)

  React.useEffect(() => {
    if (!isLoading && !hasRequiredRole) {
      router.push(redirectTo)
    }
  }, [hasRequiredRole, isLoading, router, redirectTo])

  return { hasRequiredRole, isLoading }
}
