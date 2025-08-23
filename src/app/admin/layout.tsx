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

  // Create admin user object for AdminHeader (simplified version)
  const adminHeaderUser = {
    id: session.user.id,
    name: session.user.username || session.user.email,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role as UserRole,
  }

  // Create full user object for AdminProvider (with all necessary fields)
  const adminProviderUser = {
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    role: session.user.role as UserRole,
    image: session.user.image,
    level: session.user.level,
    sparklePoints: session.user.sparklePoints,
    premiumPoints: session.user.premiumPoints,
    status: UserStatus.ACTIVE,
    // Add any additional fields that AdminProvider might need
    verified: (session.user as any).verified || false,
    experience: (session.user as any).experience || 0,
    reputationScore: (session.user as any).reputationScore || 0,
  }

  return (
    <AdminProvider 
      user={adminProviderUser}
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
            user={adminHeaderUser}
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
