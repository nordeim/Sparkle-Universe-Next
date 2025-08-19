// src/components/admin/system-health.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  Download,
  Settings,
  Clock,
  Zap
} from 'lucide-react'
import { cn, formatFileSize, formatDuration, formatPercentage } from '@/lib/utils'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  uptime: number
  lastChecked: Date
  details?: string
  icon: React.ElementType
}

interface SystemMetric {
  label: string
  value: number
  max: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

export function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'API Server',
      status: 'healthy',
      latency: 45,
      uptime: 99.99,
      lastChecked: new Date(),
      icon: Server
    },
    {
      name: 'Database',
      status: 'healthy',
      latency: 12,
      uptime: 99.98,
      lastChecked: new Date(),
      icon: Database
    },
    {
      name: 'WebSocket Server',
      status: 'healthy',
      latency: 8,
      uptime: 99.95,
      lastChecked: new Date(),
      icon: Wifi
    },
    {
      name: 'Redis Cache',
      status: 'healthy',
      latency: 2,
      uptime: 100,
      lastChecked: new Date(),
      icon: Zap
    },
    {
      name: 'Storage (S3)',
      status: 'healthy',
      latency: 125,
      uptime: 99.99,
      lastChecked: new Date(),
      icon: HardDrive
    },
    {
      name: 'CDN',
      status: 'healthy',
      latency: 35,
      uptime: 100,
      lastChecked: new Date(),
      icon: Shield
    }
  ])

  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      label: 'CPU Usage',
      value: 42,
      max: 100,
      unit: '%',
      status: 'good',
      trend: 'stable'
    },
    {
      label: 'Memory Usage',
      value: 18.5,
      max: 32,
      unit: 'GB',
      status: 'good',
      trend: 'up'
    },
    {
      label: 'Disk Space',
      value: 234,
      max: 500,
      unit: 'GB',
      status: 'good',
      trend: 'up'
    },
    {
      label: 'Network I/O',
      value: 125,
      max: 1000,
      unit: 'Mbps',
      status: 'good',
      trend: 'stable'
    },
    {
      label: 'Database Connections',
      value: 89,
      max: 200,
      unit: 'connections',
      status: 'good',
      trend: 'stable'
    },
    {
      label: 'Queue Size',
      value: 1234,
      max: 10000,
      unit: 'jobs',
      status: 'good',
      trend: 'down'
    }
  ])

  const [incidents, setIncidents] = useState<Array<{
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    timestamp: Date
    resolved: boolean
  }>>([])

  const [isChecking, setIsChecking] = useState(false)
  const [lastFullCheck, setLastFullCheck] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      checkServices()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const checkServices = async () => {
    setIsChecking(true)
    
    // Simulate service health checks
    setTimeout(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        latency: Math.max(1, service.latency + (Math.random() * 10 - 5)),
        lastChecked: new Date(),
        status: Math.random() > 0.95 ? 'degraded' : 'healthy'
      })))

      setMetrics(prev => prev.map(metric => {
        const change = Math.random() * 10 - 5
        const newValue = Math.max(0, Math.min(metric.max, metric.value + change))
        const percentage = (newValue / metric.max) * 100
        
        return {
          ...metric,
          value: newValue,
          status: percentage > 90 ? 'critical' : percentage > 75 ? 'warning' : 'good',
          trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable'
        }
      }))

      setIsChecking(false)
      setLastFullCheck(new Date())
    }, 1000)
  }

  const runFullDiagnostics = () => {
    checkServices()
    // Additional diagnostics logic
  }

  const exportHealthReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      services,
      metrics,
      incidents,
      overallHealth: calculateOverallHealth()
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-report-${Date.now()}.json`
    a.click()
  }

  const calculateOverallHealth = () => {
    const healthyServices = services.filter(s => s.status === 'healthy').length
    const totalServices = services.length
    const healthPercentage = (healthyServices / totalServices) * 100
    
    if (healthPercentage === 100) return 'excellent'
    if (healthPercentage >= 90) return 'good'
    if (healthPercentage >= 70) return 'fair'
    return 'poor'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-500'
      case 'degraded':
      case 'warning':
        return 'text-yellow-500'
      case 'down':
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return CheckCircle
      case 'degraded':
      case 'warning':
        return AlertTriangle
      case 'down':
      case 'critical':
        return XCircle
      default:
        return Activity
    }
  }

  const overallHealth = calculateOverallHealth()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-sm text-muted-foreground">
            Last checked: {lastFullCheck.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={overallHealth === 'excellent' ? 'default' : overallHealth === 'good' ? 'secondary' : 'destructive'}
            className="text-lg px-4 py-1"
          >
            Overall Health: {overallHealth.toUpperCase()}
          </Badge>
          <Button 
            onClick={runFullDiagnostics} 
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Run Diagnostics
          </Button>
          <Button onClick={exportHealthReport} variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {incidents.filter(i => !i.resolved).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Incidents</AlertTitle>
          <AlertDescription>
            {incidents.filter(i => !i.resolved).length} unresolved incidents require attention
          </AlertDescription>
        </Alert>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => {
          const Icon = service.icon
          const StatusIcon = getStatusIcon(service.status)
          
          return (
            <Card key={service.name} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{service.name}</CardTitle>
                  </div>
                  <StatusIcon className={cn('h-5 w-5', getStatusColor(service.status))} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">{service.latency}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-mono">{service.uptime}%</span>
                  </div>
                  {service.details && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      {service.details}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Resources</CardTitle>
          <CardDescription>Real-time resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map(metric => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-mono', getStatusColor(metric.status))}>
                      {metric.unit === '%' 
                        ? formatPercentage(metric.value / 100)
                        : metric.unit === 'GB'
                        ? formatFileSize(metric.value * 1024 * 1024 * 1024)
                        : `${metric.value.toFixed(0)} ${metric.unit}`
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {metric.max} {metric.unit}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(metric.value / metric.max) * 100} 
                  className={cn(
                    'h-2',
                    metric.status === 'critical' && '[&>div]:bg-red-500',
                    metric.status === 'warning' && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>System Events</CardTitle>
          <CardDescription>Recent system events and logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Service health check completed', 'Database backup successful', 'Cache cleared', 'SSL certificate renewed', 'Security scan completed'].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{event}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(Date.now() - i * 3600000).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemHealth
