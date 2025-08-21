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
  type AxisDomain,
} from 'recharts'
import { format, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
}

/**
 * Chart type options
 */
type ChartType = 'line' | 'area' | 'bar'

/**
 * Time period for data aggregation
 */
type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

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
      <p className="text-sm font-semibold">{formattedDate}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span 
              className="text-xs capitalize"
              style={{ color: entry.color }}
            >
              {entry.name}:
            </span>
            <span className="text-xs font-semibold">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </span>
          </div>
        ))}
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
 * Calculate trend from data
 */
const calculateTrend = (data: UserGrowthDataPoint[]): {
  direction: 'up' | 'down' | 'stable'
  percentage: number
} => {
  if (data.length < 2) {
    return { direction: 'stable', percentage: 0 }
  }
  
  const lastValue = data[data.length - 1]?.users || 0
  const previousValue = data[data.length - 2]?.users || 0
  
  if (previousValue === 0) {
    return { direction: 'stable', percentage: 0 }
  }
  
  const percentage = ((lastValue - previousValue) / previousValue) * 100
  
  return {
    direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
    percentage: Math.abs(percentage),
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
}: UserGrowthChartProps) {
  // Calculate trend if enabled
  const trend = React.useMemo(() => {
    return showTrend ? calculateTrend(data) : null
  }, [data, showTrend])
  
  // Memoize chart colors for consistency
  const chartColors = React.useMemo(() => ({
    users: '#8B5CF6',       // Sparkle purple
    activeUsers: '#10B981', // Emerald
    newUsers: '#3B82F6',    // Blue
    returningUsers: '#F59E0B', // Amber
    target: '#EF4444',      // Red for target line
  }), [])
  
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
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Failed to load chart data: {error.message}
            </p>
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
    
    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => formatXAxisTick(value, timePeriod)}
              {...commonAxisProps}
            />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="users"
              stroke={chartColors.users}
              fill={chartColors.users}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {data[0]?.activeUsers !== undefined && (
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke={chartColors.activeUsers}
                fill={chartColors.activeUsers}
                fillOpacity={0.3}
                strokeWidth={2}
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
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => formatXAxisTick(value, timePeriod)}
              {...commonAxisProps}
            />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar dataKey="users" fill={chartColors.users} radius={[8, 8, 0, 0]} />
            {data[0]?.newUsers !== undefined && (
              <Bar dataKey="newUsers" fill={chartColors.newUsers} radius={[8, 8, 0, 0]} />
            )}
            {showBrush && <Brush dataKey="date" height={30} />}
          </BarChart>
        )
        
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
            <XAxis 
              dataKey="date"
              tickFormatter={(value) => formatXAxisTick(value, timePeriod)}
              {...commonAxisProps}
            />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="users"
              stroke={chartColors.users}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            {data[0]?.activeUsers !== undefined && (
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke={chartColors.activeUsers}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
            {data[0]?.newUsers !== undefined && (
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke={chartColors.newUsers}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
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
              <span className={cn(
                'text-sm font-semibold',
                trend.direction === 'up' && 'text-green-500',
                trend.direction === 'down' && 'text-red-500',
                trend.direction === 'stable' && 'text-muted-foreground'
              )}>
                {trend.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Export additional utility functions
export { calculateTrend, formatXAxisTick }
export type { UserGrowthDataPoint, ChartType, TimePeriod }
