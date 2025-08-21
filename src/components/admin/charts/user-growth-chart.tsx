// src/components/admin/charts/user-growth-chart.tsx
'use client'

import * as React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  ReferenceLine,
  Brush,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Data point structure for the user growth chart
 */
interface UserGrowthDataPoint {
  date: string // ISO date string
  users: number
  activeUsers?: number
  newUsers?: number
  returningUsers?: number
  growth?: number // Percentage growth from previous period
  target?: number // Optional target line
  churnRate?: number // User churn rate
  retentionRate?: number // User retention rate
}

/**
 * Chart type options
 */
type ChartType = 'line' | 'area' | 'bar' | 'mixed'

/**
 * Time period for data aggregation
 */
type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

/**
 * Trend information
 */
interface TrendInfo {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  value: number
  previousValue: number
}

interface UserGrowthChartProps {
  /** Chart data points */
  data: UserGrowthDataPoint[]
  /** Chart height in pixels */
  height?: number
  /** Chart type variant */
  type?: ChartType
  /** Show legend */
  showLegend?: boolean
  /** Show grid lines */
  showGrid?: boolean
  /** Show data brush for zooming */
  showBrush?: boolean
  /** Time period for x-axis formatting */
  timePeriod?: TimePeriod
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
  /** Additional CSS classes */
  className?: string
  /** Chart title */
  title?: string
  /** Chart description */
  description?: string
  /** Show trend indicator */
  showTrend?: boolean
  /** Show statistics cards */
  showStats?: boolean
  /** Enable animations */
  animate?: boolean
  /** Custom colors */
  colors?: {
    users?: string
    activeUsers?: string
    newUsers?: string
    returningUsers?: string
    target?: string
  }
}

/**
 * Custom tooltip component for better UX
 */
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (!active || !payload || !payload.length) return null
  
  const date = label ? parseISO(label) : null
  const formattedDate = date && isValid(date) 
    ? format(date, 'PPP') 
    : label
  
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="text-sm font-semibold mb-2">{formattedDate}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const Icon = entry.value && Number(entry.value) > 0 ? ChevronUp : ChevronDown
          const color = entry.value && Number(entry.value) > 0 ? 'text-green-500' : 'text-red-500'
          
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs capitalize">
                  {String(entry.name).replace(/([A-Z])/g, ' $1').trim()}:
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold">
                  {typeof entry.value === 'number' 
                    ? entry.value.toLocaleString() 
                    : entry.value}
                </span>
                {entry.dataKey === 'growth' && entry.value && (
                  <Icon className={cn('h-3 w-3', color)} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Format axis tick based on time period
 */
const formatXAxisTick = (value: string, timePeriod: TimePeriod): string => {
  try {
    const date = parseISO(value)
    if (!isValid(date)) return value
    
    switch (timePeriod) {
      case 'day':
        return format(date, 'MMM dd')
      case 'week':
        return format(date, 'MMM dd')
      case 'month':
        return format(date, 'MMM yyyy')
      case 'quarter':
        return format(date, 'QQQ yyyy')
      case 'year':
        return format(date, 'yyyy')
      default:
        return format(date, 'MMM dd')
    }
  } catch {
    return value
  }
}

/**
 * Format large numbers for display
 */
const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Calculate trend from data
 */
const calculateTrend = (data: UserGrowthDataPoint[]): TrendInfo => {
  if (data.length < 2) {
    return { 
      direction: 'stable', 
      percentage: 0,
      value: data[0]?.users || 0,
      previousValue: 0,
    }
  }
  
  const lastValue = data[data.length - 1]?.users || 0
  const previousValue = data[data.length - 2]?.users || 0
  
  if (previousValue === 0) {
    return { 
      direction: 'stable', 
      percentage: 0,
      value: lastValue,
      previousValue,
    }
  }
  
  const percentage = ((lastValue - previousValue) / previousValue) * 100
  
  return {
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
    value: lastValue,
    previousValue,
  }
}

/**
 * Calculate statistics from data
 */
const calculateStats = (data: UserGrowthDataPoint[]) => {
  if (data.length === 0) {
    return {
      total: 0,
      average: 0,
      max: 0,
      min: 0,
      growth: 0,
    }
  }
  
  const values = data.map(d => d.users)
  const total = values.reduce((sum, val) => sum + val, 0)
  const average = total / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  
  const firstValue = values[0] || 0
  const lastValue = values[values.length - 1] || 0
  const growth = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100
  
  return {
    total,
    average,
    max,
    min,
    growth,
  }
}

/**
 * User Growth Chart Component
 * 
 * A flexible, responsive chart component for visualizing user growth metrics
 * Supports multiple chart types and time periods with built-in loading and error states
 */
export function UserGrowthChart({
  data = [],
  height = 350,
  type = 'line',
  showLegend = true,
  showGrid = true,
  showBrush = false,
  timePeriod = 'day',
  loading = false,
  error = null,
  className,
  title = 'User Growth',
  description,
  showTrend = true,
  showStats = false,
  animate = true,
  colors = {},
}: UserGrowthChartProps) {
  // Merge default colors with custom colors
  const chartColors = React.useMemo(() => ({
    users: colors.users || '#8B5CF6',
    activeUsers: colors.activeUsers || '#10B981',
    newUsers: colors.newUsers || '#3B82F6',
    returningUsers: colors.returningUsers || '#F59E0B',
    target: colors.target || '#EF4444',
  }), [colors])
  
  // Calculate trend and stats
  const trend = React.useMemo(() => {
    return showTrend ? calculateTrend(data) : null
  }, [data, showTrend])
  
  const stats = React.useMemo(() => {
    return showStats ? calculateStats(data) : null
  }, [data, showStats])
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
          {showStats && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  
  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Failed to load chart data
              </p>
              <p className="text-xs text-destructive">
                {error.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }
    
    const commonAxisProps = {
      stroke: 'hsl(var(--muted-foreground))',
      fontSize: 12,
    }
    
    const xAxisProps = {
      dataKey: 'date',
      tickFormatter: (value: string) => formatXAxisTick(value, timePeriod),
      ...commonAxisProps,
    }
    
    const yAxisProps = {
      tickFormatter: formatNumber,
      ...commonAxisProps,
    }
    
    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="users"
              name="Total Users"
              stroke={chartColors.users}
              fill={chartColors.users}
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={animate ? 1000 : 0}
            />
            {data[0]?.activeUsers !== undefined && (
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke={chartColors.activeUsers}
                fill={chartColors.activeUsers}
                fillOpacity={0.3}
                strokeWidth={2}
                animationDuration={animate ? 1200 : 0}
              />
            )}
            {data[0]?.target !== undefined && (
              <ReferenceLine 
                y={data[0].target} 
                stroke={chartColors.target} 
                strokeDasharray="5 5"
                label="Target"
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </AreaChart>
        )
        
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar 
              dataKey="users" 
              name="Total Users"
              fill={chartColors.users} 
              radius={[8, 8, 0, 0]}
              animationDuration={animate ? 1000 : 0}
            />
            {data[0]?.newUsers !== undefined && (
              <Bar 
                dataKey="newUsers" 
                name="New Users"
                fill={chartColors.newUsers} 
                radius={[8, 8, 0, 0]}
                animationDuration={animate ? 1200 : 0}
              />
            )}
            {data[0]?.target !== undefined && (
              <ReferenceLine 
                y={data[0].target} 
                stroke={chartColors.target} 
                strokeDasharray="5 5"
                label="Target"
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </BarChart>
        )
        
      case 'mixed':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis {...xAxisProps} />
            <YAxis yAxisId="left" {...yAxisProps} />
            <YAxis yAxisId="right" orientation="right" {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              yAxisId="left"
              dataKey="newUsers"
              name="New Users"
              fill={chartColors.newUsers}
              opacity={0.6}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="users"
              name="Total Users"
              stroke={chartColors.users}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={animate ? 1000 : 0}
            />
            {data[0]?.growth !== undefined && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth"
                name="Growth %"
                stroke={chartColors.activeUsers}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                animationDuration={animate ? 1200 : 0}
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </LineChart>
        )
        
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="users"
              name="Total Users"
              stroke={chartColors.users}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={animate ? 1000 : 0}
            />
            {data[0]?.activeUsers !== undefined && (
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke={chartColors.activeUsers}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={animate ? 1200 : 0}
              />
            )}
            {data[0]?.newUsers !== undefined && (
              <Line
                type="monotone"
                dataKey="newUsers"
                name="New Users"
                stroke={chartColors.newUsers}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                animationDuration={animate ? 1400 : 0}
              />
            )}
            {data[0]?.target !== undefined && (
              <ReferenceLine 
                y={data[0].target} 
                stroke={chartColors.target} 
                strokeDasharray="5 5"
                label="Target"
              />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </LineChart>
        )
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {trend && (
            <div className="flex items-center gap-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  trend.direction === 'up' && 'text-green-500',
                  trend.direction === 'down' && 'text-red-500',
                  trend.direction === 'stable' && 'text-muted-foreground'
                )}>
                  {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(trend.value)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Average</p>
              <p className="text-lg font-semibold">{formatNumber(Math.round(stats.average))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Maximum</p>
              <p className="text-lg font-semibold">{formatNumber(stats.max)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Minimum</p>
              <p className="text-lg font-semibold">{formatNumber(stats.min)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Growth</p>
              <p className={cn(
                'text-lg font-semibold',
                stats.growth > 0 && 'text-green-500',
                stats.growth < 0 && 'text-red-500',
                stats.growth === 0 && 'text-muted-foreground'
              )}>
                {stats.growth > 0 ? '+' : ''}{stats.growth.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export additional utility functions and types
export { calculateTrend, calculateStats, formatXAxisTick, formatNumber }
export type { UserGrowthDataPoint, ChartType, TimePeriod, TrendInfo }
