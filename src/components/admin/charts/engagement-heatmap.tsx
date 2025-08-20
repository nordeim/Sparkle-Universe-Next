// src/components/admin/charts/engagement-heatmap.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

interface HeatmapDataPoint {
  date: string // ISO date string
  value: number
  label?: string
}

interface EngagementHeatmapProps {
  data: HeatmapDataPoint[]
  height?: number
  loading?: boolean
  error?: Error | null
  className?: string
  title?: string
  description?: string
  weeks?: number
  colorScale?: {
    empty: string
    low: string
    medium: string
    high: string
    extreme: string
  }
}

/**
 * Calculate color intensity based on value
 */
function getColorIntensity(
  value: number,
  max: number,
  colorScale: EngagementHeatmapProps['colorScale']
): string {
  if (!colorScale) return '#E5E7EB'
  if (value === 0) return colorScale.empty
  
  const percentage = (value / max) * 100
  
  if (percentage <= 25) return colorScale.low
  if (percentage <= 50) return colorScale.medium
  if (percentage <= 75) return colorScale.high
  return colorScale.extreme
}

/**
 * Generate heatmap grid data
 */
function generateHeatmapGrid(
  data: HeatmapDataPoint[],
  weeks: number
): { grid: (HeatmapDataPoint | null)[][]; maxValue: number } {
  const grid: (HeatmapDataPoint | null)[][] = []
  const dataMap = new Map(data.map(d => [d.date, d]))
  let maxValue = 0
  
  // Start from weeks ago
  const endDate = new Date()
  const startDate = addDays(endDate, -weeks * 7)
  
  // Find the start of the week
  const gridStartDate = startOfWeek(startDate)
  
  // Generate grid (7 rows for days of week, columns for weeks)
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const row: (HeatmapDataPoint | null)[] = []
    
    for (let week = 0; week < weeks; week++) {
      const currentDate = addDays(gridStartDate, week * 7 + dayOfWeek)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      if (currentDate > endDate) {
        row.push(null)
      } else {
        const dataPoint = dataMap.get(dateStr)
        if (dataPoint) {
          maxValue = Math.max(maxValue, dataPoint.value)
          row.push(dataPoint)
        } else {
          row.push({ date: dateStr, value: 0 })
        }
      }
    }
    
    grid.push(row)
  }
  
  return { grid, maxValue }
}

/**
 * Engagement Heatmap Chart Component
 * 
 * Displays user engagement data in a GitHub-style contribution heatmap
 */
export function EngagementHeatmap({
  data = [],
  height = 200,
  loading = false,
  error = null,
  className,
  title = 'Engagement Heatmap',
  description,
  weeks = 12,
  colorScale = {
    empty: '#E5E7EB',
    low: '#DBEAFE',
    medium: '#93C5FD',
    high: '#3B82F6',
    extreme: '#1E40AF',
  },
}: EngagementHeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<HeatmapDataPoint | null>(null)
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 })
  
  // Generate heatmap grid
  const { grid, maxValue } = React.useMemo(
    () => generateHeatmapGrid(data, weeks),
    [data, weeks]
  )
  
  // Days of week labels
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Month labels for the grid
  const monthLabels = React.useMemo(() => {
    const labels: { month: string; position: number }[] = []
    let lastMonth = ''
    
    for (let week = 0; week < weeks; week++) {
      const date = addDays(startOfWeek(addDays(new Date(), -weeks * 7)), week * 7)
      const month = format(date, 'MMM')
      
      if (month !== lastMonth) {
        labels.push({ month, position: week })
        lastMonth = month
      }
    }
    
    return labels
  }, [weeks])
  
  const handleCellHover = (
    dataPoint: HeatmapDataPoint | null,
    event: React.MouseEvent<SVGRectElement>
  ) => {
    if (dataPoint && dataPoint.value > 0) {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })
      setHoveredCell(dataPoint)
    } else {
      setHoveredCell(null)
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          {description && <Skeleton className="h-4 w-64 mt-2" />}
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
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
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-sm text-muted-foreground">
              Failed to load heatmap data: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Calculate dimensions
  const cellSize = 12
  const cellGap = 2
  const leftPadding = 30
  const topPadding = 20
  const chartWidth = weeks * (cellSize + cellGap) + leftPadding
  const chartHeight = 7 * (cellSize + cellGap) + topPadding + 20
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="overflow-visible"
          >
            {/* Month labels */}
            {monthLabels.map(({ month, position }) => (
              <text
                key={`${month}-${position}`}
                x={leftPadding + position * (cellSize + cellGap)}
                y={topPadding - 5}
                className="fill-muted-foreground text-xs"
              >
                {month}
              </text>
            ))}
            
            {/* Day of week labels */}
            {daysOfWeek.map((day, index) => (
              <text
                key={day}
                x={0}
                y={topPadding + index * (cellSize + cellGap) + cellSize / 2 + 3}
                className="fill-muted-foreground text-xs"
              >
                {day}
              </text>
            ))}
            
            {/* Heatmap cells */}
            {grid.map((row, dayIndex) => (
              row.map((cell, weekIndex) => {
                if (!cell) return null
                
                return (
                  <rect
                    key={`${dayIndex}-${weekIndex}`}
                    x={leftPadding + weekIndex * (cellSize + cellGap)}
                    y={topPadding + dayIndex * (cellSize + cellGap)}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    fill={getColorIntensity(cell.value, maxValue, colorScale)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={(e) => handleCellHover(cell, e)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                )
              })
            ))}
          </svg>
          
          {/* Legend */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            {Object.values(colorScale).map((color, index) => (
              <div
                key={index}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
          
          {/* Tooltip */}
          {hoveredCell && (
            <div
              className="pointer-events-none fixed z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="font-semibold">
                {format(parseISO(hoveredCell.date), 'PPP')}
              </div>
              <div>
                {hoveredCell.label || `${hoveredCell.value} activities`}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export additional utilities
export function generateMockHeatmapData(weeks: number = 12): HeatmapDataPoint[] {
  const data: HeatmapDataPoint[] = []
  const endDate = new Date()
  
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(endDate, -i)
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      value: Math.floor(Math.random() * 100),
      label: `${Math.floor(Math.random() * 100)} engagements`,
    })
  }
  
  return data
}

export type { HeatmapDataPoint }
