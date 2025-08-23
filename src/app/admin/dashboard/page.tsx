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
import type { TimePeriod, UserGrowthChartProps, ContentPerformanceProps, EngagementHeatmapProps } from '@/types/global'

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
      refetchInterval: 30000,
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
    }, 60000)

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

    const unsubscribeAlert = socket.on('admin:alert', () => {
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
              <SelectItem value="day">Day</SelectItem>
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
            onClick={() => stat.href && (window.location.href = stat.href)}
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
            <SystemHealth />
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
                <Badge variant={(systemHealth as any)?.responseTime < 100 ? "default" : "destructive"}>
                  {(systemHealth as any)?.responseTime || 0}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-medium">{(systemHealth as any)?.uptime || '99.9%'}</span>
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
                  period={timePeriod}
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
                <RecentActivity />
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
                <TopContent />
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
                  showLegend={true}
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
                  horizontal={true}
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
                  showLegend={true}
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
              <ModeratorQueue />
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
                showLegend={true}
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
