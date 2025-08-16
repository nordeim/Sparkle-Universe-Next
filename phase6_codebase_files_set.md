# src/app/admin/dashboard/page.tsx
```tsx
// src/app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Activity,
  Eye,
  UserPlus,
  Heart,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  Database,
  Globe,
  Shield,
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react'
import { api } from '@/lib/api'
import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { RealtimeMetrics } from '@/components/admin/realtime-metrics'
import { RecentActivity } from '@/components/admin/recent-activity'
import { TopContent } from '@/components/admin/top-content'
import { SystemHealth } from '@/components/admin/system-health'
import { ModeratorQueue } from '@/components/admin/moderator-queue'
import { UserGrowthChart } from '@/components/admin/charts/user-growth-chart'
import { EngagementHeatmap } from '@/components/admin/charts/engagement-heatmap'
import { ContentPerformance } from '@/components/admin/charts/content-performance'
import { formatNumber, formatPercentage, formatDuration } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'

type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year'

export default function AdminDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  const socket = useSocket()

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = 
    api.admin.getDashboardStats.useQuery({ period: timePeriod })
  
  const { data: analytics, refetch: refetchAnalytics } = 
    api.admin.getAnalytics.useQuery({ period: timePeriod })
  
  const { data: systemHealth } = 
    api.admin.getSystemHealth.useQuery(undefined, {
      refetchInterval: 30000, // Refresh every 30 seconds
    })
  
  const { data: alerts } = 
    api.admin.getAlerts.useQuery()

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchStats()
      refetchAnalytics()
      setLastRefresh(new Date())
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [autoRefresh, refetchStats, refetchAnalytics])

  // Real-time updates
  useEffect(() => {
    if (!socket.isConnected) return

    const unsubscribeNewUser = socket.on('admin:newUser', () => {
      refetchStats()
    })

    const unsubscribeNewPost = socket.on('admin:newPost', () => {
      refetchStats()
    })

    const unsubscribeAlert = socket.on('admin:alert', (alert: any) => {
      // Handle real-time alerts
    })

    return () => {
      unsubscribeNewUser()
      unsubscribeNewPost()
      unsubscribeAlert()
    }
  }, [socket, refetchStats])

  const exportDashboardData = async () => {
    const response = await fetch('/api/admin/export/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: timePeriod }),
    })
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${timePeriod}-${new Date().toISOString()}.csv`
    a.click()
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      change: stats?.users.growth || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats?.users.active || 0,
      change: stats?.users.activeGrowth || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: 'Last 7 days',
    },
    {
      title: 'Total Posts',
      value: stats?.content.posts || 0,
      change: stats?.content.postsGrowth || 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/admin/content',
    },
    {
      title: 'Engagement Rate',
      value: formatPercentage(stats?.engagement.rate || 0),
      change: stats?.engagement.rateChange || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      isPercentage: true,
    },
  ]

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Sparkle Universe community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={exportDashboardData}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <Alert key={alert.id} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <Badge variant={alert.severity === 'error' ? 'destructive' : 'secondary'}>
                  {alert.type}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="group cursor-pointer hover:shadow-lg transition-all"
            onClick={() => stat.href && window.location.href.replace(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isPercentage ? stat.value : formatNumber(stat.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={cn(
                  "inline-flex items-center",
                  stat.change >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  <TrendingUp className={cn(
                    "w-3 h-3 mr-1",
                    stat.change < 0 && "rotate-180"
                  )} />
                  {stat.change >= 0 ? '+' : ''}{formatPercentage(stat.change)}
                </span>
                {' '}from last {timePeriod}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemHealth data={systemHealth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <Badge variant={systemHealth?.responseTime < 100 ? "default" : "destructive"}>
                  {systemHealth?.responseTime || 0}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-medium">{systemHealth?.uptime || '99.9%'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-medium">{formatNumber(stats?.users.online || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Queue Size</span>
                <span className="font-medium">{stats?.moderation.pending || 0}</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Last refresh: {formatDuration(Date.now() - lastRefresh.getTime())} ago
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  New users and active users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserGrowthChart
                  data={analytics?.userGrowth || []}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Creation</CardTitle>
                <CardDescription>
                  Posts, comments, and reactions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.contentCreation || []}
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Real-time activity feed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity limit={15} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Content</CardTitle>
                <CardDescription>
                  Most popular posts this {timePeriod}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopContent limit={10} period={timePeriod} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user metrics and behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{stats?.users.newToday || 0}</p>
                  <p className="text-sm text-muted-foreground">New Today</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{stats?.users.dau || 0}</p>
                  <p className="text-sm text-muted-foreground">Daily Active</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{formatDuration(stats?.users.avgSessionDuration || 0)}</p>
                  <p className="text-sm text-muted-foreground">Avg. Session</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{formatPercentage(stats?.users.retentionRate || 0)}</p>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                </div>
              </div>

              <div className="space-y-4">
                <AnalyticsChart
                  data={analytics?.userActivity || []}
                  type="area"
                  height={400}
                  showLegend
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        data={analytics?.userSegments || []}
                        type="donut"
                        height={300}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Geographic Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        data={analytics?.geoDistribution || []}
                        type="map"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>
                Analysis of content creation and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentPerformance
                data={analytics?.contentPerformance || {}}
                period={timePeriod}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.contentTypes || []}
                  type="bar"
                  height={300}
                  horizontal
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.topTags || []}
                  type="treemap"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                User interaction and engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.reactions || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Reactions</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.comments || 0)}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.shares || 0)}</p>
                  <p className="text-sm text-muted-foreground">Shares</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{formatPercentage(stats?.engagement.viralityScore || 0)}</p>
                  <p className="text-sm text-muted-foreground">Virality Score</p>
                </div>
              </div>

              <EngagementHeatmap
                data={analytics?.engagementHeatmap || {}}
                height={400}
              />

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-4">Engagement Trends</h4>
                <AnalyticsChart
                  data={analytics?.engagementTrends || []}
                  type="line"
                  height={300}
                  showLegend
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats?.moderation.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting moderation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats?.moderation.approvedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Content approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats?.moderation.rejectedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Content rejected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(stats?.moderation.aiAccuracy || 0)}</div>
                <p className="text-xs text-muted-foreground">Auto-moderation accuracy</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Queue</CardTitle>
              <CardDescription>
                Recent items requiring moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeratorQueue limit={10} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={analytics?.moderationStats || []}
                type="stacked-bar"
                height={300}
                showLegend
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Metrics
          </CardTitle>
          <CardDescription>
            Live activity monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RealtimeMetrics />
        </CardContent>
      </Card>
    </div>
  )
}

```

# src/app/admin/layout.tsx
```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getServerAuth } from '@/lib/auth/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminProvider } from '@/components/providers/admin-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { AdminNotifications } from '@/components/admin/admin-notifications'
import { AdminActivityMonitor } from '@/components/admin/admin-activity-monitor'

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

  return (
    <AdminProvider 
      user={session.user}
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
            user={session.user}
            showMobileMenu
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary
              fallback={(error, reset) => (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-destructive">
                      Admin Panel Error
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                      {error.message || 'An unexpected error occurred in the admin panel.'}
                    </p>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            >
              <div className="container mx-auto p-6 max-w-7xl">
                {children}
              </div>
            </ErrorBoundary>
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

```

# src/app/admin/moderation/page.tsx
```tsx
// src/app/admin/moderation/page.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Flag,
  MessageSquare,
  FileText,
  User,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  Bot,
  Brain,
  BarChart3,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { api } from '@/lib/api'
import { ContentPreviewDialog } from '@/components/admin/content-preview-dialog'
import { ModerationHistory } from '@/components/admin/moderation-history'
import { AIAnalysisPanel } from '@/components/admin/ai-analysis-panel'
import { ModerationStats } from '@/components/admin/moderation-stats'
import { formatDate, formatDuration } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

type ContentType = 'all' | 'posts' | 'comments' | 'users' | 'media'
type QueueFilter = 'all' | 'ai-flagged' | 'user-reported' | 'escalated' | 'new'
type ModerationAction = 'approve' | 'reject' | 'escalate' | 'ignore'

interface ModerationItem {
  id: string
  type: string
  content: any
  reports: any[]
  aiAnalysis?: any
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  reportCount: number
}

interface ModerationNote {
  action: ModerationAction
  reason?: string
  note?: string
  banDuration?: number
}

export default function ModerationPage() {
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [activeTab, setActiveTab] = useState<ContentType>('all')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [showAIAnalysis, setShowAIAnalysis] = useState(true)
  const [autoModerate, setAutoModerate] = useState(false)
  const [moderationNote, setModerationNote] = useState<ModerationNote>({
    action: 'approve',
  })
  const [noteDialog, setNoteDialog] = useState(false)
  const [processingItem, setProcessingItem] = useState<string | null>(null)

  const socket = useSocket()

  // Fetch moderation data
  const { data: reports, isLoading, refetch } = api.admin.getModerationQueue.useQuery({
    type: activeTab === 'all' ? undefined : activeTab,
    filter: queueFilter,
    limit: 50,
  })

  const { data: stats } = api.admin.getModerationStats.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const { data: aiSettings } = api.admin.getAIModerationSettings.useQuery()

  // Mutations
  const moderateContent = api.admin.moderateContent.useMutation({
    onSuccess: () => {
      toast({ title: 'Content moderated successfully' })
      refetch()
      setProcessingItem(null)
    },
    onError: () => {
      toast({ 
        title: 'Moderation failed', 
        variant: 'destructive' 
      })
      setProcessingItem(null)
    },
  })

  const bulkModerate = api.admin.bulkModerate.useMutation({
    onSuccess: () => {
      toast({ title: 'Bulk moderation completed' })
      refetch()
    },
  })

  const updateAISettings = api.admin.updateAIModerationSettings.useMutation({
    onSuccess: () => {
      toast({ title: 'AI settings updated' })
    },
  })

  // Real-time updates
  useEffect(() => {
    if (!socket.isConnected) return

    const unsubscribeNewReport = socket.on('moderation:newReport', () => {
      refetch()
    })

    const unsubscribeAIFlag = socket.on('moderation:aiFlag', (data: any) => {
      toast({
        title: 'AI flagged content',
        description: `New ${data.type} flagged with ${data.confidence}% confidence`,
      })
      refetch()
    })

    return () => {
      unsubscribeNewReport()
      unsubscribeAIFlag()
    }
  }, [socket, refetch])

  // Auto-moderation
  useEffect(() => {
    if (!autoModerate || !reports?.items) return

    const lowRiskItems = reports.items.filter(
      item => item.aiAnalysis?.riskScore < 0.3 && item.priority === 'low'
    )

    if (lowRiskItems.length > 0) {
      bulkModerate.mutate({
        itemIds: lowRiskItems.map(item => item.id),
        action: 'approve',
        reason: 'Auto-approved: Low risk score',
      })
    }
  }, [autoModerate, reports, bulkModerate])

  // Handlers
  const handleModeration = useCallback(async (
    item: ModerationItem,
    action: ModerationAction,
    immediate = false
  ) => {
    if (!immediate) {
      setSelectedItem(item)
      setModerationNote({ action })
      setNoteDialog(true)
      return
    }

    setProcessingItem(item.id)
    await moderateContent.mutateAsync({
      itemId: item.id,
      action,
      reason: moderationNote.reason,
      note: moderationNote.note,
      banDuration: moderationNote.banDuration,
    })
  }, [moderateContent, moderationNote])

  const confirmModeration = useCallback(async () => {
    if (!selectedItem) return

    await handleModeration(selectedItem, moderationNote.action, true)
    setNoteDialog(false)
    setSelectedItem(null)
    setModerationNote({ action: 'approve' })
  }, [selectedItem, moderationNote, handleModeration])

  // Helper functions
  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  const getReasonBadge = (reason: string) => {
    const badges = {
      spam: { icon: AlertTriangle, color: 'bg-yellow-500' },
      inappropriate: { icon: XCircle, color: 'bg-red-500' },
      harassment: { icon: User, color: 'bg-orange-500' },
      misinformation: { icon: AlertCircle, color: 'bg-purple-500' },
      copyright: { icon: Shield, color: 'bg-blue-500' },
      other: { icon: Flag, color: 'bg-gray-500' },
    }
    const badge = badges[reason as keyof typeof badges] || badges.other
    return (
      <Badge className={cn(badge.color, 'text-white')}>
        <badge.icon className="w-3 h-3 mr-1" />
        {reason}
      </Badge>
    )
  }

  const getContentIcon = (type: string) => {
    const icons = {
      post: FileText,
      comment: MessageSquare,
      user: User,
      media: Sparkles,
    }
    return icons[type as keyof typeof icons] || FileText
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review reported content and maintain community standards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoModerate ? 'default' : 'outline'}
            onClick={() => setAutoModerate(!autoModerate)}
          >
            <Bot className="w-4 h-4 mr-2" />
            Auto-Moderate
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats?.approvedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.rejectedToday || 0}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.aiAccuracy || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Avg. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats?.avgModerationTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per item</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Settings Alert */}
      {aiSettings?.enabled && (
        <Alert>
          <Brain className="w-4 h-4" />
          <AlertTitle>AI Moderation Active</AlertTitle>
          <AlertDescription>
            AI is automatically flagging content with confidence threshold of {aiSettings.threshold}%.
            Current accuracy: {(aiSettings.accuracy * 100).toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Moderation Queue</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={queueFilter} onValueChange={(value) => setQueueFilter(value as QueueFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="ai-flagged">AI Flagged</SelectItem>
                  <SelectItem value="user-reported">User Reported</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="new">New (less than 1 hour)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              >
                <Brain className="w-4 h-4 mr-2" />
                {showAIAnalysis ? 'Hide' : 'Show'} AI Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading moderation queue...
                </div>
              ) : reports?.items.length === 0 ? (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertTitle>Queue Clear</AlertTitle>
                  <AlertDescription>
                    No content pending moderation. Great job keeping the community safe!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {reports?.items.map((item: ModerationItem) => {
                    const ContentIcon = getContentIcon(item.type)
                    const isProcessing = processingItem === item.id

                    return (
                      <Card 
                        key={item.id} 
                        className={cn(
                          "border-l-4 transition-all",
                          getPriorityColor(item.priority),
                          isProcessing && "opacity-50"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Header */}
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  item.type === 'post' && "bg-blue-100 dark:bg-blue-900/20",
                                  item.type === 'comment' && "bg-green-100 dark:bg-green-900/20",
                                  item.type === 'user' && "bg-purple-100 dark:bg-purple-900/20",
                                  item.type === 'media' && "bg-pink-100 dark:bg-pink-900/20"
                                )}>
                                  <ContentIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">
                                      {item.content.title || item.content.username || 'Content'}
                                    </h4>
                                    <Badge variant="outline" className="text-xs">
                                      {item.type}
                                    </Badge>
                                    {item.priority === 'critical' && (
                                      <Badge variant="destructive" className="text-xs">
                                        URGENT
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Reported {formatDate(item.createdAt)} • {item.reportCount} reports
                                  </p>
                                </div>
                              </div>

                              {/* Content Preview */}
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm line-clamp-3">
                                  {item.content.content || item.content.text || item.content.bio}
                                </p>
                              </div>

                              {/* Report Reasons */}
                              <div className="flex flex-wrap gap-2">
                                {item.reports.reduce((acc: string[], report: any) => {
                                  if (!acc.includes(report.reason)) acc.push(report.reason)
                                  return acc
                                }, []).map((reason: string) => getReasonBadge(reason))}
                              </div>

                              {/* AI Analysis */}
                              {showAIAnalysis && item.aiAnalysis && (
                                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Brain className="w-4 h-4 text-purple-500" />
                                      <span className="text-sm font-medium">AI Analysis</span>
                                    </div>
                                    <Badge variant="outline">
                                      {(item.aiAnalysis.confidence * 100).toFixed(0)}% confidence
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Risk Score:</span>
                                      <Progress 
                                        value={item.aiAnalysis.riskScore * 100} 
                                        className="mt-1 h-2"
                                      />
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Category:</span>
                                      <p className="font-medium">{item.aiAnalysis.category}</p>
                                    </div>
                                  </div>
                                  {item.aiAnalysis.explanation && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.aiAnalysis.explanation}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* User Info */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>By @{item.content.author?.username || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Level {item.content.author?.level || 0}</span>
                                </div>
                                {item.content.author?.previousViolations > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.content.author.previousViolations} previous violations
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedContent(item.content)}
                                disabled={isProcessing}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleModeration(item, 'approve')}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleModeration(item, 'reject')}
                                disabled={isProcessing}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleModeration(item, 'escalate')}
                                disabled={isProcessing}
                              >
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Escalate
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moderation History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Moderation Actions</CardTitle>
            <CardDescription>
              Your moderation history and decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModerationHistory limit={10} />
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Performance</CardTitle>
            <CardDescription>
              AI moderation accuracy and statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIAnalysisPanel stats={stats?.aiStats} />
          </CardContent>
        </Card>
      </div>

      {/* Moderation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Trends</CardTitle>
          <CardDescription>
            Report patterns and content trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModerationStats period="week" />
        </CardContent>
      </Card>

      {/* Content Preview Dialog */}
      {selectedContent && (
        <ContentPreviewDialog
          content={selectedContent}
          onClose={() => setSelectedContent(null)}
          onModerate={(action) => {
            const item = reports?.items.find((i: any) => i.content.id === selectedContent.id)
            if (item) {
              handleModeration(item, action, true)
            }
            setSelectedContent(null)
          }}
        />
      )}

      {/* Moderation Note Dialog */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Moderation Note</DialogTitle>
            <DialogDescription>
              Provide additional context for this moderation decision
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select 
                value={moderationNote.action} 
                onValueChange={(value) => setModerationNote(prev => ({ 
                  ...prev, 
                  action: value as ModerationAction 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="escalate">Escalate</SelectItem>
                  <SelectItem value="ignore">Ignore Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {moderationNote.action === 'reject' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Select 
                    value={moderationNote.reason} 
                    onValueChange={(value) => setModerationNote(prev => ({ 
                      ...prev, 
                      reason: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="misinformation">Misinformation</SelectItem>
                      <SelectItem value="copyright">Copyright Violation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ban Duration (days)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0 for permanent"
                    value={moderationNote.banDuration || ''}
                    onChange={(e) => setModerationNote(prev => ({
                      ...prev,
                      banDuration: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                placeholder="Add any additional context..."
                value={moderationNote.note || ''}
                onChange={(e) => setModerationNote(prev => ({
                  ...prev,
                  note: e.target.value
                }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmModeration}>
              Confirm {moderationNote.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

```

# src/app/admin/users/page.tsx
```tsx
// src/app/admin/users/page.tsx
'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Ban, 
  Mail,
  UserX,
  UserCheck,
  UserPlus,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  ChevronDown,
  Users
} from 'lucide-react'
import { api } from '@/lib/api'
import { UserDetailsDialog } from '@/components/admin/user-details-dialog'
import { BulkActionDialog } from '@/components/admin/bulk-action-dialog'
import { UserAnalytics } from '@/components/admin/user-analytics'
import { formatDate, formatNumber } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type UserFilter = 'all' | 'active' | 'verified' | 'banned' | 'admin' | 'new'
type SortField = 'username' | 'email' | 'createdAt' | 'level' | 'posts' | 'followers'
type SortOrder = 'asc' | 'desc'

interface SelectedUsers {
  [userId: string]: boolean
}

export default function UsersManagementPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<UserFilter>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedUsers, setSelectedUsers] = useState<SelectedUsers>({})
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean
    action: string
    users: string[]
  }>({ open: false, action: '', users: [] })
  const [page, setPage] = useState(0)
  const [showColumns, setShowColumns] = useState({
    avatar: true,
    email: true,
    role: true,
    status: true,
    level: true,
    joined: true,
    posts: true,
    followers: true,
    lastActive: true,
  })

  const debouncedSearch = useDebounce(search, 300)

  // Fetch users with filters
  const { data, isLoading, refetch } = api.admin.getUsers.useQuery({
    search: debouncedSearch,
    filter,
    sortField,
    sortOrder,
    page,
    limit: 50,
  })

  // Mutations
  const banUser = api.admin.banUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User banned successfully' })
      refetch()
    },
  })

  const unbanUser = api.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User unbanned successfully' })
      refetch()
    },
  })

  const verifyUser = api.admin.verifyUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User verified successfully' })
      refetch()
    },
  })

  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast({ title: 'User role updated successfully' })
      refetch()
    },
  })

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast({ title: 'User deleted successfully' })
      refetch()
    },
  })

  const sendEmail = api.admin.sendUserEmail.useMutation({
    onSuccess: () => {
      toast({ title: 'Email sent successfully' })
    },
  })

  // Bulk actions
  const bulkAction = api.admin.bulkUserAction.useMutation({
    onSuccess: () => {
      toast({ title: 'Bulk action completed successfully' })
      setSelectedUsers({})
      refetch()
    },
  })

  // Computed values
  const selectedUserIds = useMemo(
    () => Object.keys(selectedUsers).filter(id => selectedUsers[id]),
    [selectedUsers]
  )

  const allUsersSelected = useMemo(
    () => data?.users.length > 0 && data.users.every(user => selectedUsers[user.id]),
    [data?.users, selectedUsers]
  )

  const someUsersSelected = useMemo(
    () => data?.users.some(user => selectedUsers[user.id]) && !allUsersSelected,
    [data?.users, selectedUsers, allUsersSelected]
  )

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (allUsersSelected) {
      setSelectedUsers({})
    } else {
      const newSelected: SelectedUsers = {}
      data?.users.forEach(user => {
        newSelected[user.id] = true
      })
      setSelectedUsers(newSelected)
    }
  }, [allUsersSelected, data?.users])

  const handleSelectUser = useCallback((userId: string, checked: boolean) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: checked,
    }))
  }, [])

  const handleBulkAction = useCallback((action: string) => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to perform this action.',
        variant: 'destructive',
      })
      return
    }

    setBulkActionDialog({
      open: true,
      action,
      users: selectedUserIds,
    })
  }, [selectedUserIds])

  const executeBulkAction = useCallback(async (action: string, params?: any) => {
    await bulkAction.mutateAsync({
      action,
      userIds: bulkActionDialog.users,
      params,
    })
    setBulkActionDialog({ open: false, action: '', users: [] })
  }, [bulkAction, bulkActionDialog.users])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }, [sortField])

  const exportUsers = useCallback(async () => {
    const response = await fetch('/api/admin/export/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter,
        search: debouncedSearch,
        selectedIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      }),
    })

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${filter}-${new Date().toISOString()}.csv`
    a.click()
  }, [filter, debouncedSearch, selectedUserIds])

  // Helper functions
  const getRoleBadge = (role: string) => {
    const badges = {
      ADMIN: { label: 'Admin', className: 'bg-red-500 text-white' },
      MODERATOR: { label: 'Moderator', className: 'bg-orange-500 text-white' },
      CREATOR: { label: 'Creator', className: 'bg-purple-500 text-white' },
      USER: { label: 'User', className: 'bg-gray-500 text-white' },
    }
    const badge = badges[role as keyof typeof badges] || badges.USER
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getStatusBadge = (user: any) => {
    if (user.banned) {
      return <Badge variant="destructive">Banned</Badge>
    }
    if (user.verified) {
      return <Badge className="bg-green-500 text-white">Verified</Badge>
    }
    if (user.onlineStatus) {
      return <Badge className="bg-green-500 text-white">Online</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  const getLevelBadge = (level: number) => {
    if (level >= 50) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">Elite</Badge>
    }
    if (level >= 25) {
      return <Badge className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">Veteran</Badge>
    }
    if (level >= 10) {
      return <Badge className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white">Advanced</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, permissions, and account settings
        </p>
      </div>

      {/* Analytics Overview */}
      <UserAnalytics />

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-[300px]"
                />
              </div>

              {/* Filter */}
              <Select value={filter} onValueChange={(value) => setFilter(value as UserFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="new">New (7 days)</SelectItem>
                </SelectContent>
              </Select>

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(showColumns).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={(checked) =>
                        setShowColumns(prev => ({ ...prev, [key]: checked }))
                      }
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Actions */}
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={exportUsers}>
                <Download className="w-4 h-4" />
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedUserIds.length} users selected</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('verify')}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('ban')}
                  >
                    <Ban className="w-4 h-4 mr-1" />
                    Ban
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('email')}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allUsersSelected}
                      indeterminate={someUsersSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('username')}
                  >
                    User
                    {sortField === 'username' && (
                      <ChevronDown className={cn(
                        "inline-block w-4 h-4 ml-1",
                        sortOrder === 'asc' && "rotate-180"
                      )} />
                    )}
                  </TableHead>
                  {showColumns.email && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortField === 'email' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.role && <TableHead>Role</TableHead>}
                  {showColumns.status && <TableHead>Status</TableHead>}
                  {showColumns.level && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('level')}
                    >
                      Level
                      {sortField === 'level' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.joined && (
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Joined
                      {sortField === 'createdAt' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.posts && (
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('posts')}
                    >
                      Posts
                      {sortField === 'posts' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.followers && (
                    <TableHead 
                      className="cursor-pointer text-center"
                      onClick={() => handleSort('followers')}
                    >
                      Followers
                      {sortField === 'followers' && (
                        <ChevronDown className={cn(
                          "inline-block w-4 h-4 ml-1",
                          sortOrder === 'asc' && "rotate-180"
                        )} />
                      )}
                    </TableHead>
                  )}
                  {showColumns.lastActive && <TableHead>Last Active</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No users found matching your criteria
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers[user.id] || false}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>
                              {user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {user.username}
                              {user.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {showColumns.email && (
                        <TableCell className="font-mono text-sm">
                          {user.email}
                        </TableCell>
                      )}
                      {showColumns.role && (
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                      )}
                      {showColumns.status && (
                        <TableCell>{getStatusBadge(user)}</TableCell>
                      )}
                      {showColumns.level && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Level {user.level}</span>
                            {getLevelBadge(user.level)}
                          </div>
                        </TableCell>
                      )}
                      {showColumns.joined && (
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      )}
                      {showColumns.posts && (
                        <TableCell className="text-center">
                          {user._count.posts}
                        </TableCell>
                      )}
                      {showColumns.followers && (
                        <TableCell className="text-center">
                          {formatNumber(user._count.followers)}
                        </TableCell>
                      )}
                      {showColumns.lastActive && (
                        <TableCell>
                          {user.lastSeenAt ? formatDate(user.lastSeenAt) : 'Never'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem
                              onClick={() => setSelectedUser(user.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/admin/users/${user.id}/edit`}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => sendEmail.mutate({ 
                                userId: user.id,
                                subject: '',
                                message: ''
                              })}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            
                            {/* Role Actions */}
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {['USER', 'CREATOR', 'MODERATOR', 'ADMIN'].map(role => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => updateUserRole.mutate({
                                  userId: user.id,
                                  role
                                })}
                                disabled={user.role === role}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make {role.toLowerCase()}
                              </DropdownMenuItem>
                            ))}
                            
                            <DropdownMenuSeparator />
                            
                            {/* Account Actions */}
                            {!user.verified && (
                              <DropdownMenuItem
                                onClick={() => verifyUser.mutate({ userId: user.id })}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Verify User
                              </DropdownMenuItem>
                            )}
                            {user.banned ? (
                              <DropdownMenuItem
                                onClick={() => unbanUser.mutate({ userId: user.id })}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => banUser.mutate({
                                  userId: user.id,
                                  reason: 'Manual ban by admin'
                                })}
                                className="text-orange-600"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this user?')) {
                                  deleteUser.mutate({ userId: user.id })
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {data.users.length} of {data.totalCount} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <UserDetailsDialog
          userId={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={(action, params) => {
            // Handle actions from details dialog
            refetch()
          }}
        />
      )}

      {/* Bulk Action Dialog */}
      <BulkActionDialog
        open={bulkActionDialog.open}
        action={bulkActionDialog.action}
        userCount={bulkActionDialog.users.length}
        onConfirm={executeBulkAction}
        onCancel={() => setBulkActionDialog({ open: false, action: '', users: [] })}
      />
    </div>
  )
}

```

# src/components/admin/admin-sidebar.tsx
```tsx
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

```

# src/components/providers/admin-provider.tsx
```tsx
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

```

# src/lib/utils/format.ts
```ts
// src/lib/utils/format.ts
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h`
  return `${Math.floor(ms / 86400000)}d`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

```

# src/server/api/routers/admin.ts
```ts
// src/server/api/routers/admin.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { AdminService } from '@/server/services/admin.service'
import { AnalyticsService } from '@/server/services/analytics.service'
import { ModerationService } from '@/server/services/moderation.service'
import { SystemService } from '@/server/services/system.service'
import { UserRole } from '@prisma/client'

// Admin middleware - ensures user is admin or moderator
const adminProcedure = protectedProcedure.use(async (opts) => {
  if (!['ADMIN', 'MODERATOR'].includes(opts.ctx.session.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin or Moderator access required',
    })
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      isAdmin: opts.ctx.session.user.role === 'ADMIN',
      isModerator: opts.ctx.session.user.role === 'MODERATOR',
    }
  })
})

// Super admin only procedures
const superAdminProcedure = adminProcedure.use(async (opts) => {
  if (opts.ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }
  return opts.next()
})

export const adminRouter = createTRPCRouter({
  // ===== DASHBOARD =====
  getDashboardStats: adminProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month', 'quarter', 'year']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      const analyticsService = new AnalyticsService(ctx.db)
      
      const [basicStats, advancedStats] = await Promise.all([
        adminService.getDashboardStats(input.period || 'week'),
        analyticsService.getAdvancedMetrics(input.period || 'week'),
      ])

      return {
        users: {
          total: basicStats.totalUsers,
          active: basicStats.activeUsers,
          new: basicStats.newUsers,
          online: basicStats.onlineUsers,
          growth: basicStats.userGrowth,
          activeGrowth: advancedStats.activeUserGrowth,
          newToday: basicStats.newUsersToday,
          dau: advancedStats.dau,
          mau: advancedStats.mau,
          avgSessionDuration: advancedStats.avgSessionDuration,
          retentionRate: advancedStats.retentionRate,
        },
        content: {
          posts: basicStats.totalPosts,
          comments: basicStats.totalComments,
          postsGrowth: basicStats.postGrowth,
          postsToday: basicStats.postsToday,
        },
        engagement: {
          reactions: basicStats.totalReactions,
          comments: basicStats.totalComments,
          shares: advancedStats.totalShares,
          rate: advancedStats.engagementRate,
          rateChange: advancedStats.engagementRateChange,
          viralityScore: advancedStats.viralityScore,
        },
        moderation: {
          pending: basicStats.pendingReports,
          approvedToday: basicStats.approvedToday,
          rejectedToday: basicStats.rejectedToday,
          aiAccuracy: advancedStats.aiModerationAccuracy,
        },
      }
    }),

  getAnalytics: adminProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      metric: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getAnalytics(input.period, input.metric)
    }),

  getSystemHealth: adminProcedure
    .query(async ({ ctx }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemHealth()
    }),

  getAlerts: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getActiveAlerts()
    }),

  // ===== USER MANAGEMENT =====
  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      filter: z.enum(['all', 'active', 'verified', 'banned', 'admin', 'new']).optional(),
      sortField: z.enum(['username', 'email', 'createdAt', 'level', 'posts', 'followers']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().default(0),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUsers(input)
    }),

  getUserDetails: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUserDetails(input.userId)
    }),

  banUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
      duration: z.number().optional(), // Days, undefined = permanent
      notifyUser: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.banUser({
        ...input,
        bannedBy: ctx.session.user.id,
      })
    }),

  unbanUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.unbanUser(input.userId, ctx.session.user.id)
    }),

  verifyUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.verifyUser(input.userId, ctx.session.user.id)
    }),

  updateUserRole: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.nativeEnum(UserRole),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateUserRole(
        input.userId, 
        input.role,
        ctx.session.user.id
      )
    }),

  deleteUser: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      deleteContent: z.boolean().default(false),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.deleteUser({
        ...input,
        deletedBy: ctx.session.user.id,
      })
    }),

  sendUserEmail: adminProcedure
    .input(z.object({
      userId: z.string().optional(),
      userIds: z.array(z.string()).optional(),
      subject: z.string(),
      message: z.string(),
      template: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.sendUserEmail({
        ...input,
        sentBy: ctx.session.user.id,
      })
    }),

  bulkUserAction: adminProcedure
    .input(z.object({
      action: z.enum(['verify', 'ban', 'unban', 'delete', 'email', 'role']),
      userIds: z.array(z.string()),
      params: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.bulkUserAction({
        ...input,
        performedBy: ctx.session.user.id,
      })
    }),

  // ===== CONTENT MODERATION =====
  getModerationQueue: adminProcedure
    .input(z.object({
      type: z.enum(['posts', 'comments', 'users', 'media']).optional(),
      filter: z.enum(['all', 'ai-flagged', 'user-reported', 'escalated', 'new']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationQueue(input)
    }),

  getModerationStats: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationStats()
    }),

  moderateContent: adminProcedure
    .input(z.object({
      itemId: z.string(),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
      note: z.string().optional(),
      banDuration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.moderateContent({
        ...input,
        moderatorId: ctx.session.user.id,
      })
    }),

  bulkModerate: adminProcedure
    .input(z.object({
      itemIds: z.array(z.string()),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.bulkModerate({
        ...input,
        moderatorId: ctx.session.user.id,
      })
    }),

  getAIModerationSettings: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getAISettings()
    }),

  updateAIModerationSettings: superAdminProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      threshold: z.number().min(0).max(100).optional(),
      autoApproveThreshold: z.number().min(0).max(100).optional(),
      autoRejectThreshold: z.number().min(0).max(100).optional(),
      categories: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.updateAISettings(input)
    }),

  // ===== SITE SETTINGS =====
  getSiteSettings: adminProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getSiteSettings(input.category)
    }),

  updateSiteSettings: superAdminProcedure
    .input(z.object({
      settings: z.record(z.any()),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateSiteSettings({
        settings: input.settings,
        category: input.category,
        updatedBy: ctx.session.user.id,
      })
    }),

  // ===== FEATURE FLAGS =====
  getFeatureFlags: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getFeatureFlags()
    }),

  updateFeatureFlag: superAdminProcedure
    .input(z.object({
      flag: z.string(),
      enabled: z.boolean(),
      rolloutPercentage: z.number().min(0).max(100).optional(),
      conditions: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateFeatureFlag(input)
    }),

  // ===== SYSTEM ADMINISTRATION =====
  getSystemLogs: superAdminProcedure
    .input(z.object({
      type: z.enum(['error', 'warning', 'info', 'audit']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemLogs(input)
    }),

  runSystemMaintenance: superAdminProcedure
    .input(z.object({
      task: z.enum(['cleanup', 'optimize', 'backup', 'cache-clear']),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.runMaintenance({
        ...input,
        initiatedBy: ctx.session.user.id,
      })
    }),

  // ===== EXPORT/IMPORT =====
  exportData: superAdminProcedure
    .input(z.object({
      type: z.enum(['users', 'posts', 'analytics', 'all']),
      format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
      filters: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.exportData({
        ...input,
        exportedBy: ctx.session.user.id,
      })
    }),

  // ===== REAL-TIME MONITORING =====
  getRealtimeMetrics: adminProcedure
    .query(async ({ ctx }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getRealtimeMetrics()
    }),

  // ===== AUDIT LOGS =====
  getAuditLogs: superAdminProcedure
    .input(z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getAuditLogs(input)
    }),
})

```

# src/server/services/admin.service.ts
```ts
// src/server/services/admin.service.ts
import { PrismaClient, UserRole, UserStatus, AuditAction } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { EmailService } from './email.service'
import { Redis } from 'ioredis'

export class AdminService {
  private redis: Redis
  private notificationService: NotificationService
  private emailService: EmailService

  constructor(private db: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL!)
    this.notificationService = new NotificationService(db)
    this.emailService = new EmailService()
  }

  async getDashboardStats(period: string) {
    const now = new Date()
    const startDate = this.getStartDate(period)

    const [
      totalUsers,
      activeUsers,
      newUsers,
      onlineUsers,
      totalPosts,
      totalComments,
      totalReactions,
      pendingReports,
      approvedToday,
      rejectedToday,
      newUsersToday,
      postsToday,
    ] = await Promise.all([
      this.db.user.count({ where: { deleted: false } }),
      this.db.user.count({
        where: {
          deleted: false,
          lastSeenAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.db.user.count({
        where: {
          deleted: false,
          createdAt: { gte: startDate },
        },
      }),
      this.db.user.count({
        where: {
          deleted: false,
          onlineStatus: true,
        },
      }),
      this.db.post.count({ where: { deleted: false } }),
      this.db.comment.count({ where: { deleted: false } }),
      this.db.reaction.count(),
      this.db.report.count({ where: { status: 'PENDING' } }),
      this.db.report.count({
        where: {
          status: 'APPROVED',
          updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.report.count({
        where: {
          status: 'REJECTED',
          updatedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.user.count({
        where: {
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
      this.db.post.count({
        where: {
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    // Calculate growth percentages
    const previousPeriodStart = this.getStartDate(period, -2)
    const previousPeriodEnd = startDate

    const [previousUsers, previousPosts] = await Promise.all([
      this.db.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
      }),
      this.db.post.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
      }),
    ])

    const userGrowth = previousUsers > 0 
      ? ((newUsers - previousUsers) / previousUsers) * 100 
      : 0

    const postGrowth = previousPosts > 0
      ? ((postsToday - previousPosts) / previousPosts) * 100
      : 0

    return {
      totalUsers,
      activeUsers,
      newUsers,
      onlineUsers,
      totalPosts,
      totalComments,
      totalReactions,
      pendingReports,
      approvedToday,
      rejectedToday,
      newUsersToday,
      postsToday,
      userGrowth,
      postGrowth,
    }
  }

  async getUsers(params: {
    search?: string
    filter?: string
    sortField?: string
    sortOrder?: string
    page: number
    limit: number
  }) {
    const where: any = { deleted: false }

    // Apply search
    if (params.search) {
      where.OR = [
        { username: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    // Apply filter
    switch (params.filter) {
      case 'active':
        where.status = UserStatus.ACTIVE
        break
      case 'verified':
        where.verified = true
        break
      case 'banned':
        where.banned = true
        break
      case 'admin':
        where.role = { in: [UserRole.ADMIN, UserRole.MODERATOR] }
        break
      case 'new':
        where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        break
    }

    // Build orderBy
    const orderBy: any = {}
    if (params.sortField) {
      orderBy[params.sortField] = params.sortOrder || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const [users, totalCount] = await Promise.all([
      this.db.user.findMany({
        where,
        orderBy,
        skip: params.page * params.limit,
        take: params.limit,
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          role: true,
          status: true,
          verified: true,
          banned: true,
          level: true,
          experience: true,
          sparklePoints: true,
          createdAt: true,
          lastSeenAt: true,
          onlineStatus: true,
          _count: {
            select: {
              posts: true,
              comments: true,
              followers: true,
            },
          },
        },
      }),
      this.db.user.count({ where }),
    ])

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
      currentPage: params.page,
    }
  }

  async getUserDetails(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        stats: true,
        balance: true,
        subscription: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
            achievements: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Get recent activity
    const recentActivity = await this.db.activityStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get moderation history
    const moderationHistory = await this.db.moderationAction.findMany({
      where: { targetUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return {
      user,
      recentActivity,
      moderationHistory,
    }
  }

  async banUser(params: {
    userId: string
    reason: string
    duration?: number
    bannedBy: string
    notifyUser?: boolean
  }) {
    const banExpiresAt = params.duration
      ? new Date(Date.now() + params.duration * 24 * 60 * 60 * 1000)
      : null

    const user = await this.db.user.update({
      where: { id: params.userId },
      data: {
        banned: true,
        banReason: params.reason,
        banExpiresAt,
        status: UserStatus.BANNED,
      },
    })

    // Create moderation action record
    await this.db.moderationAction.create({
      data: {
        moderatorId: params.bannedBy,
        targetUserId: params.userId,
        targetType: 'user',
        action: 'ban',
        duration: params.duration ? params.duration * 24 : null,
        reason: params.reason,
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.bannedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: params.userId,
        entityData: { banned: true, reason: params.reason },
        reason: `User banned: ${params.reason}`,
      },
    })

    // Notify user if requested
    if (params.notifyUser) {
      await this.notificationService.createNotification({
        type: 'SYSTEM',
        userId: params.userId,
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${params.reason}`,
        entityType: 'user',
        entityId: params.userId,
      })
    }

    // Invalidate user sessions
    await this.redis.del(`session:${params.userId}:*`)

    return user
  }

  async unbanUser(userId: string, unbannedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpiresAt: null,
        status: UserStatus.ACTIVE,
      },
    })

    // Create moderation action record
    await this.db.moderationAction.create({
      data: {
        moderatorId: unbannedBy,
        targetUserId: userId,
        targetType: 'user',
        action: 'unban',
        reason: 'Ban lifted by administrator',
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: unbannedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { banned: false },
        reason: 'User unbanned',
      },
    })

    return user
  }

  async verifyUser(userId: string, verifiedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: verifiedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { verified: true },
        reason: 'User verified by admin',
      },
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'SYSTEM',
      userId,
      title: 'Account Verified',
      message: 'Your account has been verified!',
      entityType: 'user',
      entityId: userId,
    })

    return user
  }

  async updateUserRole(userId: string, role: UserRole, updatedBy: string) {
    const user = await this.db.user.update({
      where: { id: userId },
      data: { role },
    })

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: updatedBy,
        action: AuditAction.UPDATE,
        entityType: 'user',
        entityId: userId,
        entityData: { role },
        reason: `User role changed to ${role}`,
      },
    })

    return user
  }

  async deleteUser(params: {
    userId: string
    deleteContent: boolean
    reason: string
    deletedBy: string
  }) {
    // Soft delete user
    const user = await this.db.user.update({
      where: { id: params.userId },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: params.deletedBy,
        status: UserStatus.DELETED,
      },
    })

    // Optionally delete content
    if (params.deleteContent) {
      await Promise.all([
        this.db.post.updateMany({
          where: { authorId: params.userId },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: params.deletedBy,
          },
        }),
        this.db.comment.updateMany({
          where: { authorId: params.userId },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: params.deletedBy,
          },
        }),
      ])
    }

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.deletedBy,
        action: AuditAction.DELETE,
        entityType: 'user',
        entityId: params.userId,
        entityData: { deleteContent: params.deleteContent },
        reason: params.reason,
      },
    })

    return user
  }

  async sendUserEmail(params: {
    userId?: string
    userIds?: string[]
    subject: string
    message: string
    template?: string
    sentBy: string
  }) {
    const userIds = params.userIds || (params.userId ? [params.userId] : [])
    
    if (userIds.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No users specified',
      })
    }

    const users = await this.db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, username: true },
    })

    for (const user of users) {
      await this.emailService.sendEmail({
        to: user.email,
        subject: params.subject,
        template: params.template || 'admin-message',
        data: {
          username: user.username,
          message: params.message,
        },
      })
    }

    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.sentBy,
        action: AuditAction.CREATE,
        entityType: 'email',
        entityId: userIds.join(','),
        entityData: { subject: params.subject, userCount: users.length },
        reason: `Email sent to ${users.length} users`,
      },
    })

    return { sent: users.length }
  }

  async bulkUserAction(params: {
    action: string
    userIds: string[]
    params?: any
    performedBy: string
  }) {
    const results = []

    for (const userId of params.userIds) {
      try {
        let result
        switch (params.action) {
          case 'verify':
            result = await this.verifyUser(userId, params.performedBy)
            break
          case 'ban':
            result = await this.banUser({
              userId,
              reason: params.params?.reason || 'Bulk ban',
              duration: params.params?.duration,
              bannedBy: params.performedBy,
            })
            break
          case 'unban':
            result = await this.unbanUser(userId, params.performedBy)
            break
          case 'delete':
            result = await this.deleteUser({
              userId,
              deleteContent: params.params?.deleteContent || false,
              reason: params.params?.reason || 'Bulk delete',
              deletedBy: params.performedBy,
            })
            break
          case 'role':
            result = await this.updateUserRole(
              userId,
              params.params?.role,
              params.performedBy
            )
            break
        }
        results.push({ userId, success: true, result })
      } catch (error) {
        results.push({ userId, success: false, error: error.message })
      }
    }

    return results
  }

  async getSiteSettings(category?: string) {
    const where = category ? { category } : {}
    return this.db.siteSetting.findMany({
      where,
      orderBy: { key: 'asc' },
    })
  }

  async updateSiteSettings(params: {
    settings: Record<string, any>
    category?: string
    updatedBy: string
  }) {
    const updates = []

    for (const [key, value] of Object.entries(params.settings)) {
      updates.push(
        this.db.siteSetting.upsert({
          where: { key },
          create: {
            key,
            value,
            type: typeof value,
            category: params.category,
            updatedBy: params.updatedBy,
          },
          update: {
            value,
            updatedBy: params.updatedBy,
          },
        })
      )
    }

    await Promise.all(updates)

    // Clear cache
    await this.redis.del('site:settings:*')

    return { updated: updates.length }
  }

  async getFeatureFlags() {
    return this.db.featureFlag.findMany({
      orderBy: { flag: 'asc' },
    })
  }

  async updateFeatureFlag(params: {
    flag: string
    enabled: boolean
    rolloutPercentage?: number
    conditions?: any
  }) {
    const flag = await this.db.featureFlag.upsert({
      where: { flag: params.flag },
      create: {
        flag: params.flag,
        name: params.flag,
        enabled: params.enabled,
        rolloutPercentage: params.rolloutPercentage || 100,
        conditions: params.conditions,
      },
      update: {
        enabled: params.enabled,
        rolloutPercentage: params.rolloutPercentage,
        conditions: params.conditions,
      },
    })

    // Clear cache
    await this.redis.del(`feature:${params.flag}`)

    return flag
  }

  async getActiveAlerts() {
    // Check for system issues
    const alerts = []

    // Check for high report queue
    const pendingReports = await this.db.report.count({
      where: { status: 'PENDING' },
    })

    if (pendingReports > 50) {
      alerts.push({
        id: 'high-report-queue',
        type: 'moderation',
        severity: pendingReports > 100 ? 'error' : 'warning',
        message: `${pendingReports} reports pending moderation`,
      })
    }

    // Check for system health issues
    const healthCheck = await this.db.systemHealth.findFirst({
      orderBy: { checkedAt: 'desc' },
    })

    if (healthCheck && healthCheck.status !== 'healthy') {
      alerts.push({
        id: 'system-health',
        type: 'system',
        severity: 'error',
        message: `System status: ${healthCheck.status}`,
      })
    }

    return alerts
  }

  async getAuditLogs(params: {
    userId?: string
    action?: string
    startDate?: Date
    endDate?: Date
    limit: number
  }) {
    const where: any = {}

    if (params.userId) where.userId = params.userId
    if (params.action) where.action = params.action
    if (params.startDate || params.endDate) {
      where.createdAt = {}
      if (params.startDate) where.createdAt.gte = params.startDate
      if (params.endDate) where.createdAt.lte = params.endDate
    }

    return this.db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit,
    })
  }

  async exportData(params: {
    type: string
    format: string
    filters?: any
    exportedBy: string
  }) {
    // Implementation depends on specific export requirements
    // This would typically generate a file and return a download URL
    
    // Create audit log
    await this.db.auditLog.create({
      data: {
        userId: params.exportedBy,
        action: AuditAction.CREATE,
        entityType: 'export',
        entityId: params.type,
        entityData: { format: params.format, filters: params.filters },
        reason: `Data export: ${params.type}`,
      },
    })

    return {
      url: `/api/admin/export/${params.type}`,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    }
  }

  private getStartDate(period: string, multiplier = -1): Date {
    const now = new Date()
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0))
      case 'week':
        return new Date(now.setDate(now.getDate() + 7 * multiplier))
      case 'month':
        return new Date(now.setMonth(now.getMonth() + 1 * multiplier))
      case 'quarter':
        return new Date(now.setMonth(now.getMonth() + 3 * multiplier))
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() + 1 * multiplier))
      default:
        return new Date(now.setDate(now.getDate() + 7 * multiplier))
    }
  }
}

```

