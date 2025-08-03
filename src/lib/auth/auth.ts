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
