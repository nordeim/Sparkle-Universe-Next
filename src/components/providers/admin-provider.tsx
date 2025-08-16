// src/components/providers/admin-provider.tsx
'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { User } from '@prisma/client'
import { useSocket } from '@/hooks/use-socket'

interface AdminPermissions {
  canAccessDashboard: boolean
  canManageUsers: boolean
  canModerateContent: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
  canViewLogs: boolean
  canManageRoles: boolean
  canExportData: boolean
}

interface AdminContextType {
  user: User
  permissions: AdminPermissions
  notifications: AdminNotification[]
  addNotification: (notification: AdminNotification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message?: string
  timestamp: Date
  actionUrl?: string
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({
  children,
  user,
  permissions,
}: {
  children: ReactNode
  user: User
  permissions: AdminPermissions
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const socket = useSocket()

  useEffect(() => {
    if (!socket.isConnected) return

    const handleAdminNotification = (notification: any) => {
      addNotification({
        id: Math.random().toString(36).substr(2, 9),
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        timestamp: new Date(),
        actionUrl: notification.actionUrl,
      })
    }

    const unsubscribe = socket.on('admin:notification', handleAdminNotification)
    return () => {
      unsubscribe()
    }
  }, [socket])

  const addNotification = (notification: AdminNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <AdminContext.Provider
      value={{
        user,
        permissions,
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
