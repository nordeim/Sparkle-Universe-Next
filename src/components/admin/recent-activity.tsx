// src/components/admin/recent-activity.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FileText,
  MessageSquare,
  Heart,
  UserPlus,
  Ban,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Sparkles,
  RefreshCw,
  Filter
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'

interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'user' | 'moderation' | 'achievement' | 'system'
  action: string
  actor: {
    id: string
    name: string
    avatar?: string
    role?: string
  }
  target?: {
    id: string
    type: string
    name: string
  }
  details?: string
  timestamp: Date
  severity?: 'info' | 'warning' | 'error' | 'success'
  metadata?: Record<string, any>
}

const activityIcons = {
  post: FileText,
  comment: MessageSquare,
  user: UserPlus,
  moderation: Shield,
  achievement: Sparkles,
  system: AlertTriangle,
}

const severityColors = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  success: 'text-green-500',
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { on, off } = useSocket()

  useEffect(() => {
    fetchActivities()

    if (autoRefresh) {
      const interval = setInterval(fetchActivities, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, filter])

  useEffect(() => {
    // Listen for real-time activity updates
    const handleNewActivity = (activity: ActivityItem) => {
      setActivities(prev => [activity, ...prev].slice(0, 50)) // Keep last 50
    }

    const unsubscribe = on('admin:newActivity' as any, handleNewActivity)
    return () => {
      unsubscribe()
    }
  }, [on, off])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual implementation
      const mockActivities: ActivityItem[] = generateMockActivities()
      setActivities(mockActivities)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockActivities = (): ActivityItem[] => {
    const actions = [
      { type: 'post', action: 'created a new post', severity: 'success' },
      { type: 'comment', action: 'commented on', severity: 'info' },
      { type: 'user', action: 'joined the platform', severity: 'success' },
      { type: 'moderation', action: 'flagged content', severity: 'warning' },
      { type: 'moderation', action: 'banned user', severity: 'error' },
      { type: 'achievement', action: 'unlocked achievement', severity: 'success' },
      { type: 'system', action: 'system alert', severity: 'warning' },
    ]

    return Array.from({ length: 20 }, (_, i) => {
      const activity = actions[Math.floor(Math.random() * actions.length)]
      return {
        id: `activity-${i}`,
        type: activity.type as any,
        action: activity.action,
        actor: {
          id: `user-${i}`,
          name: `User ${i + 1}`,
          avatar: `https://avatar.vercel.sh/user${i}`,
          role: ['USER', 'MODERATOR', 'ADMIN'][Math.floor(Math.random() * 3)]
        },
        target: i % 2 === 0 ? {
          id: `target-${i}`,
          type: 'post',
          name: `Post Title ${i}`
        } : undefined,
        details: i % 3 === 0 ? 'Additional details about this activity' : undefined,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        severity: activity.severity as any,
        metadata: {
          ip: '192.168.1.1',
          device: 'Chrome on Windows'
        }
      }
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type as keyof typeof activityIcons] || AlertTriangle
    return Icon
  }

  const getActivityDescription = (activity: ActivityItem): string => {
    let description = `${activity.actor.name} ${activity.action}`
    if (activity.target) {
      description += ` "${activity.target.name}"`
    }
    if (activity.details) {
      description += ` - ${activity.details}`
    }
    return description
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Monitor all platform activities in real-time</CardDescription>
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
            <Button variant="outline" size="sm" onClick={fetchActivities}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge 
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('all')}
          >
            All
          </Badge>
          {Object.keys(activityIcons).map(type => (
            <Badge
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          ))}
        </div>

        {/* Activity List */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {filteredActivities.map(activity => {
              const Icon = getActivityIcon(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.actor.avatar} />
                    <AvatarFallback>
                      {activity.actor.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.actor.name}</span>
                          {activity.actor.role && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {activity.actor.role}
                            </Badge>
                          )}
                          <span className="text-muted-foreground ml-2">
                            {activity.action}
                          </span>
                          {activity.target && (
                            <span className="font-medium ml-1">
                              {activity.target.name}
                            </span>
                          )}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.details}
                          </p>
                        )}
                      </div>
                      <Icon className={cn(
                        'h-4 w-4 flex-shrink-0',
                        activity.severity && severityColors[activity.severity]
                      )} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(activity.timestamp)}</span>
                      {activity.metadata?.ip && (
                        <span>IP: {activity.metadata.ip}</span>
                      )}
                      {activity.metadata?.device && (
                        <span>{activity.metadata.device}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{activities.filter(a => a.type === 'user').length}</p>
            <p className="text-xs text-muted-foreground">User Actions</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{activities.filter(a => a.type === 'moderation').length}</p>
            <p className="text-xs text-muted-foreground">Moderation Actions</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{activities.filter(a => a.severity === 'warning' || a.severity === 'error').length}</p>
            <p className="text-xs text-muted-foreground">Alerts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentActivity
