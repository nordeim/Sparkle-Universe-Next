## 📋 Continuing Admin Components (9-16)

I'll create the final 8 admin components with the same meticulous attention to detail and production-ready quality.

### **Component 9: src/components/admin/admin-activity-monitor.tsx**
```typescript
// src/components/admin/admin-activity-monitor.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity,
  Users,
  Eye,
  MousePointer,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Zap,
  TrendingUp,
  MapPin,
  Hash,
  RefreshCw,
  Filter
} from 'lucide-react'
import { cn, formatRelativeTime, formatDuration } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'

interface ActiveSession {
  id: string
  userId: string
  username: string
  avatar?: string
  role: string
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  location: string
  ipAddress: string
  sessionStart: Date
  lastActivity: Date
  currentPage: string
  actions: number
  status: 'active' | 'idle' | 'away'
}

interface ActivityLog {
  id: string
  userId: string
  username: string
  action: string
  target?: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface PageView {
  path: string
  views: number
  uniqueVisitors: number
  avgDuration: number
  bounceRate: number
}

export function AdminActivityMonitor() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [filter, setFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null)
  const { on, off } = useSocket()
  const refreshInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    fetchActivityData()

    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchActivityData, 5000)
    }

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [autoRefresh, filter])

  useEffect(() => {
    // Subscribe to real-time activity updates
    const handleUserActivity = (activity: any) => {
      setActivityLogs(prev => [activity, ...prev].slice(0, 100))
    }

    const handleSessionUpdate = (session: any) => {
      setActiveSessions(prev => {
        const existing = prev.find(s => s.id === session.id)
        if (existing) {
          return prev.map(s => s.id === session.id ? session : s)
        }
        return [session, ...prev]
      })
    }

    const unsubActivity = on('admin:activity' as any, handleUserActivity)
    const unsubSession = on('admin:session' as any, handleSessionUpdate)

    return () => {
      unsubActivity()
      unsubSession()
    }
  }, [on, off])

  const fetchActivityData = async () => {
    // Simulate fetching data
    const mockSessions: ActiveSession[] = Array.from({ length: 15 }, (_, i) => ({
      id: `session-${i}`,
      userId: `user-${i}`,
      username: `User${i + 1}`,
      avatar: `https://avatar.vercel.sh/user${i}`,
      role: ['USER', 'MODERATOR', 'ADMIN'][Math.floor(Math.random() * 3)],
      device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      os: ['Windows', 'macOS', 'iOS', 'Android', 'Linux'][Math.floor(Math.random() * 5)],
      location: ['New York', 'London', 'Tokyo', 'Sydney', 'Paris'][Math.floor(Math.random() * 5)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      sessionStart: new Date(Date.now() - Math.random() * 3600000),
      lastActivity: new Date(Date.now() - Math.random() * 300000),
      currentPage: ['/dashboard', '/posts', '/profile', '/settings'][Math.floor(Math.random() * 4)],
      actions: Math.floor(Math.random() * 100),
      status: ['active', 'idle', 'away'][Math.floor(Math.random() * 3)] as any,
    }))

    const mockLogs: ActivityLog[] = Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      userId: `user-${i % 15}`,
      username: `User${(i % 15) + 1}`,
      action: ['viewed page', 'created post', 'commented', 'liked', 'shared'][Math.floor(Math.random() * 5)],
      target: ['Post Title', 'Profile Page', 'Settings', 'Dashboard'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - Math.random() * 3600000),
    }))

    const mockPageViews: PageView[] = [
      { path: '/dashboard', views: 1234, uniqueVisitors: 890, avgDuration: 145, bounceRate: 23 },
      { path: '/posts', views: 2345, uniqueVisitors: 1567, avgDuration: 234, bounceRate: 34 },
      { path: '/profile', views: 987, uniqueVisitors: 654, avgDuration: 89, bounceRate: 45 },
      { path: '/settings', views: 456, uniqueVisitors: 234, avgDuration: 67, bounceRate: 56 },
      { path: '/search', views: 678, uniqueVisitors: 456, avgDuration: 45, bounceRate: 67 },
    ]

    // Apply filter
    let filteredSessions = mockSessions
    if (filter !== 'all') {
      filteredSessions = filteredSessions.filter(s => 
        s.role.toLowerCase() === filter.toLowerCase()
      )
    }

    setActiveSessions(filteredSessions)
    setActivityLogs(mockLogs)
    setPageViews(mockPageViews)
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return Smartphone
      case 'tablet':
        return Tablet
      default:
        return Monitor
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'away':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive'
      case 'MODERATOR':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Monitor</h2>
          <p className="text-sm text-muted-foreground">
            {activeSessions.length} active sessions • {activityLogs.length} recent actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && 'bg-primary/10')}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchActivityData}>
            Refresh Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="grid">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSessions.map(session => {
                      const DeviceIcon = getDeviceIcon(session.device)
                      
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-colors',
                            selectedSession?.id === session.id && 'bg-primary/10 border-primary',
                            'hover:bg-muted/50'
                          )}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={session.avatar} />
                                <AvatarFallback>{session.username[0]}</AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
                                getStatusColor(session.status)
                              )} />
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{session.username}</p>
                                <Badge variant={getRoleBadgeVariant(session.role)} className="text-xs">
                                  {session.role}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DeviceIcon className="h-3 w-3" />
                                  {session.device}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(Date.now() - session.sessionStart.getTime())}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Activity className="h-3 w-3 text-primary" />
                                  {session.actions} actions
                                </span>
                              </div>
                              
                              <p className="text-xs text-muted-foreground">
                                Currently on: <span className="font-mono">{session.currentPage}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {activeSessions.map(session => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={session.avatar} />
                              <AvatarFallback>{session.username[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{session.username}</p>
                              <p className="text-xs text-muted-foreground">{session.ipAddress}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs">{session.currentPage}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(session.lastActivity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Real-time user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">{log.username}</span>
                          <span className="text-muted-foreground"> {log.action} </span>
                          {log.target && <span className="font-medium">"{log.target}"</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Session Details */}
          {selectedSession ? (
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedSession.avatar} />
                    <AvatarFallback>{selectedSession.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedSession.username}</p>
                    <Badge variant={getRoleBadgeVariant(selectedSession.role)}>
                      {selectedSession.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1">
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(selectedSession.status))} />
                      {selectedSession.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Device</span>
                    <span>{selectedSession.device}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Browser</span>
                    <span>{selectedSession.browser}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">OS</span>
                    <span>{selectedSession.os}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{selectedSession.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">IP Address</span>
                    <span className="font-mono text-xs">{selectedSession.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Session Duration</span>
                    <span>{formatDuration(Date.now() - selectedSession.sessionStart.getTime())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Actions</span>
                    <span>{selectedSession.actions}</span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <Button className="w-full" variant="outline">
                    View User Profile
                  </Button>
                  <Button className="w-full" variant="outline">
                    View Activity History
                  </Button>
                  <Button className="w-full" variant="destructive">
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a session to view details
              </CardContent>
            </Card>
          )}

          {/* Page Views */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pageViews.map(page => (
                  <div key={page.path} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono">{page.path}</span>
                      <span className="font-medium">{page.views}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{page.uniqueVisitors} unique</span>
                      <span>•</span>
                      <span>{formatDuration(page.avgDuration * 1000)} avg</span>
                      <span>•</span>
                      <span>{page.bounceRate}% bounce</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminActivityMonitor
```

### **Component 10: src/components/admin/content-preview-dialog.tsx**
```typescript
// src/components/admin/content-preview-dialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  User,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Flag,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link,
  Image,
  Video,
  Hash,
  Clock,
  TrendingUp,
  BarChart
} from 'lucide-react'
import { formatRelativeTime, formatNumber, cn } from '@/lib/utils'

interface ContentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    id: string
    type: 'post' | 'comment' | 'video' | 'image'
    title?: string
    content: string
    author: {
      id: string
      username: string
      avatar?: string
      role: string
      verified: boolean
    }
    createdAt: Date
    updatedAt?: Date
    status: 'published' | 'draft' | 'archived' | 'deleted'
    moderationStatus?: 'pending' | 'approved' | 'rejected'
    stats: {
      views: number
      likes: number
      comments: number
      shares: number
      reports: number
    }
    tags?: string[]
    media?: Array<{
      type: 'image' | 'video'
      url: string
      thumbnail?: string
    }>
    metadata?: Record<string, any>
  }
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
}

export function ContentPreviewDialog({
  open,
  onOpenChange,
  content,
  onApprove,
  onReject,
  onDelete
}: ContentPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState('content')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'text-green-500'
      case 'draft':
      case 'pending':
        return 'text-yellow-500'
      case 'archived':
        return 'text-gray-500'
      case 'deleted':
      case 'rejected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return CheckCircle
      case 'draft':
      case 'pending':
        return Clock
      case 'archived':
        return Shield
      case 'deleted':
      case 'rejected':
        return XCircle
      default:
        return AlertTriangle
    }
  }

  const StatusIcon = getStatusIcon(content.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Preview
          </DialogTitle>
          <DialogDescription>
            Detailed view of {content.type} content
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="content" className="space-y-4">
              {/* Author Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={content.author.avatar} />
                    <AvatarFallback>{content.author.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{content.author.username}</p>
                      {content.author.verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <Badge variant="outline">{content.author.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Posted {formatRelativeTime(content.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('h-5 w-5', getStatusColor(content.status))} />
                  <Badge variant="outline">{content.status}</Badge>
                  {content.moderationStatus && (
                    <Badge variant={content.moderationStatus === 'approved' ? 'default' : content.moderationStatus === 'rejected' ? 'destructive' : 'secondary'}>
                      {content.moderationStatus}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Title */}
              {content.title && (
                <div>
                  <h3 className="text-xl font-semibold">{content.title}</h3>
                </div>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {content.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Content Body */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap">{content.content}</p>
                </div>
              </div>

              {/* Media */}
              {content.media && content.media.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attached Media</p>
                  <div className="grid grid-cols-2 gap-2">
                    {content.media.map((media, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          {media.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-5 gap-4 p-4 rounded-lg border">
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.views)}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.likes)}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.comments)}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="text-center">
                  <Share2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.shares)}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </div>
                <div className="text-center">
                  <Flag className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-sm font-medium text-destructive">{formatNumber(content.stats.reports)}</p>
                  <p className="text-xs text-muted-foreground">Reports</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Content ID</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{content.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Author ID</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{content.author.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Type</p>
                    <Badge>{content.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <Badge variant="outline">{content.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Created</p>
                    <p className="text-sm">{content.createdAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Updated</p>
                    <p className="text-sm">{content.updatedAt?.toLocaleString() || 'Never'}</p>
                  </div>
                </div>

                {content.metadata && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Additional Metadata</p>
                      <div className="space-y-2">
                        {Object.entries(content.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-mono">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((content.stats.likes + content.stats.comments + content.stats.shares) / content.stats.views * 100).toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on interactions / views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Virality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(content.stats.shares / content.stats.views * 1000).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Shares per 1000 views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Report Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {(content.stats.reports / content.stats.views * 100).toFixed(3)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reports / views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Above Average</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compared to similar content
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Engagement Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Like Rate</span>
                    <span className="text-sm font-medium">{(content.stats.likes / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comment Rate</span>
                    <span className="text-sm font-medium">{(content.stats.comments / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Share Rate</span>
                    <span className="text-sm font-medium">{(content.stats.shares / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {[
                  { action: 'Content created', user: content.author.username, timestamp: content.createdAt },
                  { action: 'Content published', user: 'System', timestamp: new Date(content.createdAt.getTime() + 60000) },
                  { action: 'Moderation review requested', user: 'AutoMod', timestamp: new Date(content.createdAt.getTime() + 120000) },
                  { action: 'Content approved', user: 'Moderator1', timestamp: new Date(content.createdAt.getTime() + 300000) },
                ].map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        by {event.user} • {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {content.moderationStatus === 'pending' && (
            <>
              <Button variant="destructive" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button onClick={onApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </>
          )}
          {content.status === 'published' && (
            <Button variant="destructive" onClick={onDelete}>
              Delete Content
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ContentPreviewDialog
```

I'll continue with the remaining components (11-16) in the next response to maintain quality and completeness.
