// src/components/admin/realtime-metrics.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Users, 
  Server, 
  Wifi, 
  Database, 
  Cpu, 
  HardDrive,
  MemoryStick,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { formatNumber, formatPercentage, formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { RealtimeMetric } from '@/types/global'

export function RealtimeMetrics() {
  const { on, off, isConnected } = useSocket()
  const [metrics, setMetrics] = useState<Record<string, RealtimeMetric>>({
    activeUsers: {
      label: 'Active Users',
      value: 0,
      unit: 'users',
      trend: 'stable',
      icon: Users,
      color: 'text-blue-500'
    },
    requestsPerSecond: {
      label: 'Requests/sec',
      value: 0,
      unit: 'req/s',
      trend: 'stable',
      icon: Activity,
      color: 'text-green-500'
    },
    cpuUsage: {
      label: 'CPU Usage',
      value: 0,
      unit: '%',
      trend: 'stable',
      threshold: { warning: 70, critical: 90 },
      icon: Cpu,
      color: 'text-purple-500'
    },
    memoryUsage: {
      label: 'Memory',
      value: 0,
      unit: 'GB',
      trend: 'stable',
      percentage: 0,
      threshold: { warning: 80, critical: 95 },
      icon: MemoryStick,
      color: 'text-orange-500'
    },
    diskUsage: {
      label: 'Disk Usage',
      value: 0,
      unit: 'GB',
      trend: 'stable',
      percentage: 0,
      threshold: { warning: 85, critical: 95 },
      icon: HardDrive,
      color: 'text-indigo-500'
    },
    databaseConnections: {
      label: 'DB Connections',
      value: 0,
      unit: 'conns',
      trend: 'stable',
      icon: Database,
      color: 'text-cyan-500'
    },
    websocketConnections: {
      label: 'WebSockets',
      value: 0,
      unit: 'conns',
      trend: 'stable',
      icon: Wifi,
      color: 'text-pink-500'
    },
    responseTime: {
      label: 'Avg Response',
      value: 0,
      unit: 'ms',
      trend: 'stable',
      threshold: { warning: 500, critical: 1000 },
      icon: Zap,
      color: 'text-yellow-500'
    }
  })

  const [alerts, setAlerts] = useState<Array<{
    id: string
    type: 'warning' | 'critical'
    message: string
    timestamp: Date
  }>>([])

  const previousValues = useRef<Record<string, number>>({})
  const updateInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Simulate real-time updates - replace with actual Socket.IO events
    const updateMetrics = () => {
      setMetrics(prev => {
        const updated = { ...prev }
        
        // Simulate metric changes
        Object.keys(updated).forEach(key => {
          const metric = updated[key]
          if (!metric) return
          
          const prevValue = previousValues.current[key] || metric.value
          
          // Generate random changes
          let newValue = metric.value
          switch (key) {
            case 'activeUsers':
              newValue = Math.max(0, metric.value + Math.floor(Math.random() * 20 - 10))
              break
            case 'requestsPerSecond':
              newValue = Math.max(0, metric.value + Math.floor(Math.random() * 100 - 50))
              break
            case 'cpuUsage':
              newValue = Math.min(100, Math.max(0, metric.value + (Math.random() * 10 - 5)))
              break
            case 'memoryUsage':
              newValue = Math.min(32, Math.max(0, metric.value + (Math.random() * 2 - 1)))
              metric.percentage = (newValue / 32) * 100
              break
            case 'diskUsage':
              newValue = Math.min(500, Math.max(0, metric.value + (Math.random() * 5 - 2)))
              metric.percentage = (newValue / 500) * 100
              break
            case 'databaseConnections':
              newValue = Math.max(0, metric.value + Math.floor(Math.random() * 10 - 5))
              break
            case 'websocketConnections':
              newValue = Math.max(0, metric.value + Math.floor(Math.random() * 50 - 25))
              break
            case 'responseTime':
              newValue = Math.max(0, metric.value + Math.floor(Math.random() * 100 - 50))
              break
          }
          
          // Determine trend
          if (newValue > prevValue * 1.1) {
            metric.trend = 'up'
          } else if (newValue < prevValue * 0.9) {
            metric.trend = 'down'
          } else {
            metric.trend = 'stable'
          }
          
          metric.value = newValue
          previousValues.current[key] = newValue
          
          // Check thresholds and create alerts
          if (metric.threshold) {
            const checkValue = metric.percentage !== undefined ? metric.percentage : metric.value
            
            if (checkValue >= metric.threshold.critical) {
              const alertExists = alerts.some(a => a.message.includes(metric.label) && a.type === 'critical')
              if (!alertExists) {
                setAlerts(prev => [...prev, {
                  id: Date.now().toString(),
                  type: 'critical',
                  message: `${metric.label} is critically high: ${metric.value}${metric.unit}`,
                  timestamp: new Date()
                }])
              }
            } else if (checkValue >= metric.threshold.warning) {
              const alertExists = alerts.some(a => a.message.includes(metric.label))
              if (!alertExists) {
                setAlerts(prev => [...prev, {
                  id: Date.now().toString(),
                  type: 'warning',
                  message: `${metric.label} is above warning threshold: ${metric.value}${metric.unit}`,
                  timestamp: new Date()
                }])
              }
            }
          }
        })
        
        return updated
      })
    }

    // Initial values
    setMetrics(prev => ({
      activeUsers: { ...prev.activeUsers, value: 1234 },
      requestsPerSecond: { ...prev.requestsPerSecond, value: 567 },
      cpuUsage: { ...prev.cpuUsage, value: 45 },
      memoryUsage: { ...prev.memoryUsage, value: 18, percentage: 56 },
      diskUsage: { ...prev.diskUsage, value: 234, percentage: 47 },
      databaseConnections: { ...prev.databaseConnections, value: 89 },
      websocketConnections: { ...prev.websocketConnections, value: 456 },
      responseTime: { ...prev.responseTime, value: 125 }
    }))

    // Update every 2 seconds
    updateInterval.current = setInterval(updateMetrics, 2000)

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current)
      }
    }
  }, [alerts])

  const getStatusColor = (metric: RealtimeMetric): string => {
    if (!metric.threshold) return 'bg-green-500'
    
    const value = metric.percentage !== undefined ? metric.percentage : metric.value
    if (value >= metric.threshold.critical) return 'bg-red-500'
    if (value >= metric.threshold.warning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatValue = (metric: RealtimeMetric): string => {
    switch (metric.unit) {
      case '%':
        return `${metric.value.toFixed(1)}%`
      case 'GB':
        return formatFileSize(metric.value * 1024 * 1024 * 1024)
      case 'ms':
        return `${metric.value}ms`
      case 'req/s':
        return `${formatNumber(metric.value)}/s`
      default:
        return formatNumber(metric.value)
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Metrics</h2>
        <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
          <div className={cn(
            'h-2 w-2 rounded-full',
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          )} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(-3).map(alert => (
            <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, metric]) => {
          if (!metric) return null
          const Icon = metric.icon || Activity
          
          return (
            <Card key={key} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={cn('h-5 w-5', metric.color)} />
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {metric.trend === 'stable' && <div className="h-4 w-4" />}
                  </div>
                </div>
                <CardDescription className="text-xs">{metric.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold">{formatValue(metric)}</div>
                  {metric.percentage !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(metric.percentage / 100)}
                    </div>
                  )}
                </div>
                {metric.threshold && (
                  <Progress 
                    value={metric.percentage || metric.value} 
                    className="mt-2 h-1"
                  />
                )}
                <div className={cn(
                  'absolute top-0 right-0 h-1 w-full',
                  getStatusColor(metric)
                )} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="font-medium">99.98%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Error Rate</p>
              <p className="font-medium">0.02%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Throughput</p>
              <p className="font-medium">12.5K req/min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Latency (p99)</p>
              <p className="font-medium">245ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RealtimeMetrics
