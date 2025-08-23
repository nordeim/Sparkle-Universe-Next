// src/components/admin/charts/content-performance.tsx
'use client'

import * as React from 'react'
import {
  AreaChart,
  Area,
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
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format, parseISO, subDays } from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Clock,
  Users,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Hash,
  BarChart3,
  Download,
} from 'lucide-react'
import type { ContentPerformanceProps } from '@/types/global'

interface ContentMetrics {
  id: string
  title: string
  type: 'post' | 'video' | 'image' | 'poll' | 'live'
  author: {
    id: string
    name: string
    avatar?: string
  }
  publishedAt: string
  views: number
  uniqueViews: number
  likes: number
  comments: number
  shares: number
  avgReadTime: number
  bounceRate: number
  engagementRate: number
  viralityScore: number
  tags: string[]
  category?: string
}

interface PerformanceOverTime {
  date: string
  views: number
  engagement: number
  shares: number
  comments: number
}

interface ContentTypeDistribution {
  type: string
  count: number
  percentage: number
  avgEngagement: number
}

interface TopPerformer {
  id: string
  title: string
  thumbnail?: string
  metrics: {
    views: number
    engagement: number
    trend: 'up' | 'down' | 'stable'
    trendValue: number
  }
}

function getContentTypeIcon(type: string) {
  switch (type) {
    case 'post':
      return FileText
    case 'video':
      return Video
    case 'image':
      return ImageIcon
    case 'poll':
      return BarChart3
    case 'live':
      return Music
    default:
      return FileText
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function calculatePerformanceScore(metrics: ContentMetrics): number {
  const viewsWeight = 0.3
  const engagementWeight = 0.4
  const viralityWeight = 0.3
  
  const normalizedViews = Math.min(metrics.views / 10000, 1)
  const normalizedEngagement = metrics.engagementRate / 100
  const normalizedVirality = metrics.viralityScore / 100
  
  return (
    normalizedViews * viewsWeight +
    normalizedEngagement * engagementWeight +
    normalizedVirality * viralityWeight
  ) * 100
}

export function ContentPerformance({
  data = [],
  overTimeData = [],
  typeDistribution = [],
  topPerformers = [],
  loading = false,
  error = null,
  className,
  title = 'Content Performance',
  description = 'Analyze content metrics and engagement patterns',
  period = 'week',
  onPeriodChange,
  onExport,
}: ContentPerformanceProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<'views' | 'engagement' | 'shares'>('views')
  const [selectedContentType, setSelectedContentType] = React.useState<string>('all')
  
  const summaryStats = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        topCategory: 'N/A',
        bestPerformingType: 'N/A',
        viralContent: 0,
      }
    }

    const contentData = Array.isArray(data) ? data : []
    
    const totalViews = contentData.reduce((sum, item) => sum + (item.views || 0), 0)
    const totalEngagement = contentData.reduce((sum, item) => 
      sum + (item.likes || 0) + (item.comments || 0) + (item.shares || 0), 0)
    const avgEngagementRate = contentData.length > 0
      ? contentData.reduce((sum, item) => sum + (item.engagementRate || 0), 0) / contentData.length
      : 0
    
    const categoryCount: Record<string, number> = {}
    contentData.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
      }
    })
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    
    const typePerformance: Record<string, number[]> = {}
    contentData.forEach(item => {
      if (!typePerformance[item.type]) {
        typePerformance[item.type] = []
      }
      typePerformance[item.type].push(item.engagementRate || 0)
    })
    
    let bestType = 'N/A'
    let bestAvgEngagement = 0
    Object.entries(typePerformance).forEach(([type, rates]) => {
      if (rates.length > 0) {
        const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
        if (avg > bestAvgEngagement) {
          bestAvgEngagement = avg
          bestType = type
        }
      }
    })
    
    const viralContent = contentData.filter(item => (item.viralityScore || 0) > 70).length
    
    return {
      totalViews,
      totalEngagement,
      avgEngagementRate,
      topCategory,
      bestPerformingType: bestType,
      viralContent,
    }
  }, [data])
  
  const filteredData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    if (selectedContentType === 'all') return data
    return data.filter(item => item.type === selectedContentType)
  }, [data, selectedContentType])
  
  const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444']
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="text-sm font-semibold">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-xs font-semibold">
                {typeof entry.value === 'number' 
                  ? formatNumber(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    if (percent === undefined || percent === null) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardHeader>
          <CardTitle className="text-destructive">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Failed to load performance data: {error.message}
            </p>
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
            <Select value={period || 'week'} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryStats.totalViews)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Engagement</p>
            </div>
            <p className="text-2xl font-bold">{formatNumber(summaryStats.totalEngagement)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Avg Engagement</p>
            </div>
            <p className="text-2xl font-bold">{summaryStats.avgEngagementRate.toFixed(1)}%</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Top Category</p>
            </div>
            <p className="text-lg font-semibold">{summaryStats.topCategory}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Best Type</p>
            </div>
            <p className="text-lg font-semibold capitalize">{summaryStats.bestPerformingType}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Viral Content</p>
            </div>
            <p className="text-2xl font-bold">{summaryStats.viralContent}</p>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="top">Top Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={overTimeData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(value), 'MMM dd')
                      } catch {
                        return value
                      }
                    }}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-4">Engagement by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="type" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgEngagement" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-4">Engagement Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Likes', value: summaryStats.totalEngagement * 0.6 },
                        { name: 'Comments', value: summaryStats.totalEngagement * 0.3 },
                        { name: 'Shares', value: summaryStats.totalEngagement * 0.1 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Content Type Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <Treemap
                  data={typeDistribution.map(item => ({
                    name: item.type,
                    size: item.count,
                    fill: COLORS[typeDistribution.indexOf(item) % COLORS.length],
                  }))}
                  dataKey="size"
                  stroke="#fff"
                  fill="#8B5CF6"
                />
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="top" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Top Performing Content</h3>
              {topPerformers.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(item.metrics.views)} views
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.metrics.engagement.toFixed(1)}% engagement
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.metrics.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : item.metrics.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        item.metrics.trend === 'up' && 'text-green-500',
                        item.metrics.trend === 'down' && 'text-red-500'
                      )}
                    >
                      {item.metrics.trend !== 'stable' && 
                        `${item.metrics.trendValue > 0 ? '+' : ''}${item.metrics.trendValue}%`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export type { ContentMetrics, PerformanceOverTime, ContentTypeDistribution, TopPerformer }
export { formatNumber, calculatePerformanceScore }
