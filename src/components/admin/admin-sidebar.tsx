// src/components/admin/admin-sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Settings,
  BarChart3,
  Flag,
  MessageSquare,
  Globe,
  Zap,
  Database,
  Key,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface AdminSidebarProps {
  userRole: string
  className?: string
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Content',
    href: '/admin/content',
    icon: FileText,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: Flag,
    roles: ['ADMIN', 'MODERATOR'],
  },
  {
    title: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare,
    roles: ['ADMIN'],
  },
  {
    title: 'Site Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
  {
    title: 'Feature Flags',
    href: '/admin/features',
    icon: Zap,
    roles: ['ADMIN'],
  },
  {
    title: 'Database',
    href: '/admin/database',
    icon: Database,
    roles: ['ADMIN'],
  },
  {
    title: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
    roles: ['ADMIN'],
  },
]

export function AdminSidebar({ userRole, className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className={cn(
      "flex flex-col border-r bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="text-lg font-semibold">Admin Panel</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    "h-5 w-5",
                    !collapsed && "mr-2"
                  )} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-2 border-t">
        <Link href="/">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-destructive",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Exit Admin" : undefined}
          >
            <LogOut className={cn(
              "h-5 w-5",
              !collapsed && "mr-2"
            )} />
            {!collapsed && <span>Exit Admin</span>}
          </Button>
        </Link>
      </div>
    </div>
  )
}
