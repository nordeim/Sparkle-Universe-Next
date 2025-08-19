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
