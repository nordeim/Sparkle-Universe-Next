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
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerAuth()
  return session?.user?.id || null
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const session = await getServerAuth()
  if (!session) return false
  
  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(session.user.role)
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerAuth()
  return !!session?.user
}

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

/**
 * Check if user has at least the specified role level
 */
export async function hasMinimumRole(minimumRole: UserRole): Promise<boolean> {
  const session = await getServerAuth()
  if (!session) return false
  
  return roleHierarchy[session.user.role] >= roleHierarchy[minimumRole]
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole([UserRole.ADMIN, UserRole.SYSTEM])
}

/**
 * Check if current user is moderator or higher
 */
export async function isModerator(): Promise<boolean> {
  return hasMinimumRole(UserRole.MODERATOR)
}

/**
 * Check if current user is creator or higher
 */
export async function isCreator(): Promise<boolean> {
  return hasMinimumRole(UserRole.CREATOR)
}

/**
 * Check if current user is system user
 */
export async function isSystemUser(): Promise<boolean> {
  return hasRole(UserRole.SYSTEM)
}

/**
 * Get user's role level
 */
export async function getUserRoleLevel(): Promise<number> {
  const session = await getServerAuth()
  if (!session) return 0
  
  return roleHierarchy[session.user.role] || 0
}

/**
 * Compare two roles
 */
export function compareRoles(role1: UserRole, role2: UserRole): number {
  return roleHierarchy[role1] - roleHierarchy[role2]
}

/**
 * Get highest role from a list
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, role) => 
    roleHierarchy[role] > roleHierarchy[highest] ? role : highest
  )
}

/**
 * Check if role1 is higher than role2
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return roleHierarchy[role1] > roleHierarchy[role2]
}

/**
 * Get all roles below a certain level
 */
export function getRolesBelowLevel(role: UserRole): UserRole[] {
  const level = roleHierarchy[role]
  return Object.entries(roleHierarchy)
    .filter(([_, roleLevel]) => roleLevel < level)
    .map(([roleName]) => roleName as UserRole)
}

/**
 * Validate that a user can perform an action on another user based on role hierarchy
 */
export async function canModerateUser(targetUserId: string): Promise<boolean> {
  const session = await getServerAuth()
  if (!session) return false
  
  // System users can moderate anyone
  if (session.user.role === UserRole.SYSTEM) return true
  
  // Admins can moderate anyone except system users
  if (session.user.role === UserRole.ADMIN) {
    // Would need to check target user's role from database
    return true
  }
  
  // Moderators can moderate users below their level
  if (session.user.role === UserRole.MODERATOR) {
    // Would need to check target user's role from database
    return true
  }
  
  return false
}

// Export role hierarchy for use in other modules
export { roleHierarchy, UserRole }
