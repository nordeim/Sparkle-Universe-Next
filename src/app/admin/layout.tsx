// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getServerAuth } from '@/lib/auth/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminProvider } from '@/components/providers/admin-provider'
import { Toaster } from '@/components/ui/toaster'
import { AdminNotifications } from '@/components/admin/admin-notifications'
import { AdminActivityMonitor } from '@/components/admin/admin-activity-monitor'
import { UserRole, UserStatus, AuthProvider } from '@prisma/client'
import type { ExtendedUser } from '@/types/global'

interface AdminLayoutErrorBoundaryProps {
  error: Error
  reset: () => void
}

function AdminLayoutErrorBoundary({ error, reset }: AdminLayoutErrorBoundaryProps) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          Admin Panel Error
        </h2>
        <p className="text-muted-foreground max-w-md">
          {error?.message || 'An unexpected error occurred in the admin panel.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Admin Dashboard - Sparkle Universe',
  description: 'Admin panel for Sparkle Universe',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuth()
  
  // Check if user is admin or moderator
  if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/')
  }

  // Additional security check for admin features
  const isAdmin = session.user.role === 'ADMIN'
  const isModerator = session.user.role === 'MODERATOR'

  // Create a properly typed admin user object
  const adminUser: ExtendedUser = {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    role: session.user.role as UserRole,
    image: session.user.image,
    level: session.user.level,
    sparklePoints: session.user.sparklePoints,
    premiumPoints: session.user.premiumPoints,
    status: (session.user as any).status as UserStatus || UserStatus.ACTIVE,
    createdAt: (session.user as any).createdAt || new Date(),
    updatedAt: (session.user as any).updatedAt || new Date(),
    hashedPassword: (session.user as any).hashedPassword,
    authProvider: (session.user as any).authProvider as AuthProvider || AuthProvider.LOCAL,
    deleted: (session.user as any).deleted || false,
    deletedAt: (session.user as any).deletedAt,
    deletedBy: (session.user as any).deletedBy,
    bio: (session.user as any).bio,
    verified: (session.user as any).verified || false,
    verifiedAt: (session.user as any).verifiedAt,
    experience: (session.user as any).experience || 0,
    reputationScore: (session.user as any).reputationScore || 0,
    lastSeenAt: (session.user as any).lastSeenAt,
    loginStreak: (session.user as any).loginStreak || 0,
    lastLoginAt: (session.user as any).lastLoginAt,
    emailVerified: (session.user as any).emailVerified,
    emailVerificationToken: (session.user as any).emailVerificationToken,
    emailVerificationExpires: (session.user as any).emailVerificationExpires,
    resetPasswordToken: (session.user as any).resetPasswordToken,
    resetPasswordExpires: (session.user as any).resetPasswordExpires,
    phoneNumber: (session.user as any).phoneNumber,
    phoneNumberHash: (session.user as any).phoneNumberHash,
    phoneVerified: (session.user as any).phoneVerified,
    twoFactorEnabled: (session.user as any).twoFactorEnabled || false,
    twoFactorSecret: (session.user as any).twoFactorSecret,
    twoFactorBackupCodes: (session.user as any).twoFactorBackupCodes || [],
    accountLockoutAttempts: (session.user as any).accountLockoutAttempts || 0,
    accountLockedUntil: (session.user as any).accountLockedUntil,
    lastPasswordChangedAt: (session.user as any).lastPasswordChangedAt,
    lastFailedLoginAt: (session.user as any).lastFailedLoginAt,
    failedLoginAttempts: (session.user as any).failedLoginAttempts || 0,
    onlineStatus: (session.user as any).onlineStatus || 'offline',
    creatorRevenueShare: (session.user as any).creatorRevenueShare,
    totalRevenueEarned: (session.user as any).totalRevenueEarned,
    lastPayoutDate: (session.user as any).lastPayoutDate,
    banned: (session.user as any).banned || false,
    banReason: (session.user as any).banReason,
    banExpiresAt: (session.user as any).banExpiresAt,
    preferredLanguage: (session.user as any).preferredLanguage || 'en',
    timezone: (session.user as any).timezone || 'UTC',
  }

  return (
    <AdminProvider 
      user={adminUser}
      permissions={{
        canAccessDashboard: true,
        canManageUsers: isAdmin,
        canModerateContent: true,
        canViewAnalytics: true,
        canManageSettings: isAdmin,
        canViewLogs: isAdmin,
        canManageRoles: isAdmin,
        canExportData: isAdmin,
      }}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar 
          userRole={session.user.role}
          className="hidden lg:flex"
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <AdminHeader 
            user={adminUser}
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 max-w-7xl">
              {children}
            </div>
          </main>
          
          {/* Real-time activity monitor */}
          {isAdmin && <AdminActivityMonitor />}
        </div>
        
        {/* Notifications */}
        <AdminNotifications />
        
        {/* Toaster for admin-specific notifications */}
        <Toaster />
      </div>
    </AdminProvider>
  )
}
