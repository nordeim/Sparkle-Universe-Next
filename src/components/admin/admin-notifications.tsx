// src/components/admin/admin-notifications.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell,
  BellOff,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  User,
  Shield,
  Server,
  TrendingUp,
  MessageSquare,
  Settings,
  Archive,
  Trash2
} from 'lucide-react'
import { formatRelativeTime, cn } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'

interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  category: 'user' | 'content' | 'system' | 'security' | 'performance'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionRequired: boolean
  actions?: Array<{
    label: string
    action: string
    variant?: 'default' | 'destructive' | 'outline'
  }>
  metadata?: Record<string, any>
}

const categoryIcons = {
  user: User,
  content: MessageSquare,
  system: Server,
  security: Shield,
  performance: TrendingUp,
}

const typeColors = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  success: 'text-green-500',
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [notificationSettings, setNotificationSettings] = useState({
    user: true,
    content: true,
    system: true,
    security: true,
    performance: true,
    email: false,
    push: true,
    sound: true,
  })
  const { on, off } = useSocket()

  useEffect(() => {
    // Generate mock notifications
    const mockNotifications: AdminNotification[] = [
      {
        id: '1',
        type: 'warning',
        category: 'security',
        title: 'Suspicious Login Activity',
        message: 'Multiple failed login attempts detected from IP 192.168.1.100',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionRequired: true,
        actions: [
          { label: 'Block IP', action: 'block_ip', variant: 'destructive' },
          { label: 'View Details', action: 'view_details', variant: 'outline' },
        ],
      },
      {
        id: '2',
        type: 'success',
        category: 'system',
        title: 'Backup Completed',
        message: 'Daily backup completed successfully',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        actionRequired: false,
      },
      {
        id: '3',
        type: 'error',
        category: 'performance',
        title: 'High Memory Usage',
        message: 'Memory usage has exceeded 90% threshold',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: false,
        actionRequired: true,
        actions: [
          { label: 'Restart Service', action: 'restart', variant: 'default' },
          { label: 'Investigate', action: 'investigate', variant: 'outline' },
        ],
      },
      {
        id: '4',
        type: 'info',
        category: 'user',
        title: 'New Verified Creator',
        message: 'User "SparkleCreator123" has been verified',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        actionRequired: false,
      },
      {
        id: '5',
        type: 'warning',
        category: 'content',
        title: 'Content Flagged',
        message: '5 posts have been flagged for review',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        read: false,
        actionRequired: true,
        actions: [
          { label: 'Review Queue', action: 'review', variant: 'default' },
        ],
      },
    ]

    setNotifications(mockNotifications)

    // Subscribe to real-time notifications
    const handleNewNotification = (notification: any) => {
      setNotifications(prev => [notification, ...prev])
    }

    const unsubscribe = on('admin:notification', handleNewNotification)
    return () => {
      unsubscribe()
    }
  }, [on, off])

  const handleAction = (notificationId: string, action: string) => {
    console.log(`Action ${action} triggered for notification ${notificationId}`)
    // Implement action logic
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false
    if (filter === 'actionRequired' && !n.actionRequired) return false
    if (selectedCategory !== 'all' && n.category !== selectedCategory) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const actionRequiredCount = notifications.filter(n => n.actionRequired).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return Info
      case 'warning':
        return AlertCircle
      case 'error':
        return XCircle
      case 'success':
        return CheckCircle
      default:
        return Bell
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Notifications List */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Admin Notifications</CardTitle>
                <CardDescription>
                  {unreadCount} unread, {actionRequiredCount} require action
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="actionRequired">
                  Action Required ({actionRequiredCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filter} className="mt-4">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredNotifications.map(notification => {
                      const TypeIcon = getTypeIcon(notification.type)
                      const CategoryIcon = categoryIcons[notification.category]
                      
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-4 rounded-lg border transition-colors',
                            !notification.read && 'bg-primary/5 border-primary/20',
                            'hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5', typeColors[notification.type])}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{notification.title}</p>
                                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                  {notification.actionRequired && (
                                    <Badge variant="destructive" className="text-xs">
                                      Action Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                
                                {notification.actions && (
                                  <div className="flex items-center gap-1 ml-auto">
                                    {notification.actions.map(action => (
                                      <Button
                                        key={action.action}
                                        variant={action.variant || 'default'}
                                        size="sm"
                                        onClick={() => handleAction(notification.id, action.action)}
                                      >
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                                
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    Mark as read
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Categories</p>
              {Object.entries(categoryIcons).map(([category, Icon]) => (
                <div key={category} className="flex items-center justify-between">
                  <Label htmlFor={category} className="flex items-center gap-2 cursor-pointer">
                    <Icon className="h-4 w-4" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Label>
                  <Switch
                    id={category}
                    checked={notificationSettings[category as keyof typeof notificationSettings] as boolean}
                    onCheckedChange={(checked) =>
                      setNotificationSettings(prev => ({ ...prev, [category]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Delivery Methods</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email Notifications</Label>
                <Switch
                  id="email"
                  checked={notificationSettings.email}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push">Push Notifications</Label>
                <Switch
                  id="push"
                  checked={notificationSettings.push}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sound Alerts</Label>
                <Switch
                  id="sound"
                  checked={notificationSettings.sound}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, sound: checked }))
                  }
                />
              </div>
            </div>

            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => setSelectedCategory('all')}
            >
              <Bell className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            {Object.entries(categoryIcons).map(([category, Icon]) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminNotifications
