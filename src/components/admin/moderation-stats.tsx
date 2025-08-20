// src/components/admin/moderation-stats.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Flag,
  Zap,
  Timer,
  Brain,
  Activity,
} from 'lucide-react'

/**
 * Moderation statistics types
 */
interface ModerationStats {
  pending: number
  approvedToday: number
  rejectedToday: number
  escalatedToday: number
  avgReviewTime: number // seconds
  aiAccuracy: number // percentage
  falsePositiveRate: number // percentage
  moderatorsActive: number
  queueGrowthRate: number // percentage change
  topReportReason: string
  contentFlagged: {
    posts: number
    comments: number
    messages: number
    users: number
  }
  trendsOverTime: {
    date: string
    pending: number
    reviewed: number
    aiBlocked: number
  }[]
  moderatorPerformance: {
    id: string
    name: string
    reviewed: number
    avgTime: number
    accuracy: number
  }[]
  reportDistribution: {
    reason: string
    count: number
    percentage: number
  }[]
}

interface ModerationStatsProps {
  stats?: ModerationStats
  loading?: boolean
  error?: Error | null
  className?: string
  title?: string
  description?: string
  refreshInterval?: number // in seconds
  onRefresh?: () => void
}

/**
 * Format time duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

/**
 * Calculate trend
 */
function calculateTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable'
  percentage: number
} {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'stable', percentage: 0 }
  }
  const change = ((current - previous) / previous) * 100
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    percentage: Math.abs(change),
  }
}

/**
 * Moderation Stats Component
 * 
 * Real-time dashboard for moderation metrics and performance
 */
export function ModerationStats({
  stats,
  loading = false,
  error = null,
  className,
  title = 'Moderation Statistics',
  description = 'Real-time moderation metrics and performance',
  refreshInterval,
  onRefresh,
}: ModerationStatsProps) {
  const [autoRefresh, setAutoRefresh] = React.useState(false)
  
  // Auto-refresh logic
  React.useEffect(() => {
    if (!refreshInterval || !onRefresh || !autoRefresh) return
    
    const interval = setInterval(onRefresh, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [refreshInterval, onRefresh, autoRefresh])
  
  // Calculate additional metrics
  const totalReviewedToday = React.useMemo(() => {
    if (!stats) return 0
    return stats.approvedToday + stats.rejectedToday + stats.escalatedToday
  }, [stats])
  
  const approvalRate = React.useMemo(() => {
    if (!stats || totalReviewedToday === 0) return 0
    return (stats.approvedToday / totalReviewedToday) * 100
  }, [stats, totalReviewedToday])
  
  // Chart colors
  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardHeader>
          <CardTitle className="text-destructive">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load moderation statistics: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // No stats state
  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No statistics available</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {refreshInterval && (
              <Badge
                variant={autoRefresh ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Activity className="h-3 w-3 mr-1" />
                {autoRefresh ? 'Live' : 'Paused'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-medium">Pending Review</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats.pending}</p>
              {stats.queueGrowthRate !== 0 && (
                <div className="flex items-center">
                  {stats.queueGrowthRate > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-xs ml-1">
                    {Math.abs(stats.queueGrowthRate).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium">Approved Today</p>
            </div>
            <p className="text-2xl font-bold">{stats.approvedToday}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium">Rejected Today</p>
            </div>
            <p className="text-2xl font-bold">{stats.rejectedToday}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-medium">Avg Review Time</p>
            </div>
            <p className="text-2xl font-bold">{formatDuration(stats.avgReviewTime)}</p>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <p className="text-sm font-medium">AI Accuracy</p>
              </div>
              <span className="text-sm font-semibold">{stats.aiAccuracy.toFixed(1)}%</span>
            </div>
            <Progress value={stats.aiAccuracy} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm font-medium">False Positive Rate</p>
              </div>
              <span className="text-sm font-semibold">{stats.falsePositiveRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.falsePositiveRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">Approval Rate</p>
              </div>
              <span className="text-sm font-semibold">{approvalRate.toFixed(1)}%</span>
            </div>
            <Progress value={approvalRate} className="h-2" />
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trends Over Time */}
          <div>
            <h3 className="text-sm font-medium mb-4">Moderation Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.trendsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="reviewed"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="aiBlocked"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Report Distribution */}
          <div>
            <h3 className="text-sm font-medium mb-4">Report Reasons</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.reportDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.reportDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Content Flagged */}
        <div>
          <h3 className="text-sm font-medium mb-4">Content Flagged by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.contentFlagged).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm capitalize">{type}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </div>
        
        {/* Moderator Performance */}
        {stats.moderatorPerformance.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-4">Top Moderators</h3>
            <div className="space-y-2">
              {stats.moderatorPerformance.slice(0, 5).map((moderator) => (
                <div
                  key={moderator.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{moderator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {moderator.reviewed} reviewed • {formatDuration(moderator.avgTime)} avg
                    </p>
                  </div>
                  <Badge variant="outline">{moderator.accuracy.toFixed(0)}% accurate</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export types
export type { ModerationStats }
