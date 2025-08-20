// src/components/admin/moderation-history.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  MessageSquare,
  Image,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  AlertOctagon,
  Ban,
  Flag,
  MoreVertical,
} from 'lucide-react'

/**
 * Moderation action types
 */
interface ModerationAction {
  id: string
  timestamp: string
  moderator: {
    id: string
    name: string
    avatar?: string
    role: 'ADMIN' | 'MODERATOR' | 'AUTO'
  }
  action: 'approve' | 'reject' | 'escalate' | 'shadow_ban' | 'delete' | 'restore' | 'warn'
  target: {
    id: string
    type: 'post' | 'comment' | 'message' | 'user'
    content?: string
    author?: {
      id: string
      name: string
      avatar?: string
    }
  }
  reason?: string
  notes?: string
  metadata?: {
    previousStatus?: string
    newStatus?: string
    aiScore?: number
    reportCount?: number
    appealId?: string
  }
}

interface ModerationHistoryProps {
  actions?: ModerationAction[]
  loading?: boolean
  error?: Error | null
  className?: string
  title?: string
  description?: string
  onActionClick?: (action: ModerationAction) => void
  onLoadMore?: () => void
  hasMore?: boolean
  filters?: {
    moderator?: string
    action?: string
    targetType?: string
    dateRange?: { start: Date; end: Date }
  }
  onFilterChange?: (filters: any) => void
}

/**
 * Get icon for action type
 */
function getActionIcon(action: string) {
  switch (action) {
    case 'approve':
      return CheckCircle
    case 'reject':
      return XCircle
    case 'escalate':
      return AlertTriangle
    case 'shadow_ban':
      return Ban
    case 'delete':
      return Trash2
    case 'restore':
      return Shield
    case 'warn':
      return AlertOctagon
    default:
      return Flag
  }
}

/**
 * Get color for action type
 */
function getActionColor(action: string): string {
  switch (action) {
    case 'approve':
      return 'text-green-500'
    case 'reject':
      return 'text-red-500'
    case 'escalate':
      return 'text-yellow-500'
    case 'shadow_ban':
      return 'text-purple-500'
    case 'delete':
      return 'text-red-600'
    case 'restore':
      return 'text-blue-500'
    case 'warn':
      return 'text-orange-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get badge variant for action
 */
function getActionBadgeVariant(action: string): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (action) {
    case 'approve':
      return 'default'
    case 'reject':
    case 'delete':
      return 'destructive'
    case 'escalate':
    case 'warn':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * Moderation History Component
 * 
 * Displays a comprehensive timeline of moderation actions
 */
export function ModerationHistory({
  actions = [],
  loading = false,
  error = null,
  className,
  title = 'Moderation History',
  description = 'Timeline of all moderation actions',
  onActionClick,
  onLoadMore,
  hasMore = false,
  filters,
  onFilterChange,
}: ModerationHistoryProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedAction, setSelectedAction] = React.useState<ModerationAction | null>(null)
  const [filterAction, setFilterAction] = React.useState<string>('all')
  const [filterTarget, setFilterTarget] = React.useState<string>('all')
  
  // Filter actions based on search and filters
  const filteredActions = React.useMemo(() => {
    let filtered = actions
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        action =>
          action.moderator.name.toLowerCase().includes(query) ||
          action.reason?.toLowerCase().includes(query) ||
          action.notes?.toLowerCase().includes(query) ||
          action.target.content?.toLowerCase().includes(query)
      )
    }
    
    if (filterAction !== 'all') {
      filtered = filtered.filter(action => action.action === filterAction)
    }
    
    if (filterTarget !== 'all') {
      filtered = filtered.filter(action => action.target.type === filterTarget)
    }
    
    return filtered
  }, [actions, searchQuery, filterAction, filterTarget])
  
  // Group actions by date
  const groupedActions = React.useMemo(() => {
    const groups: Record<string, ModerationAction[]> = {}
    
    filteredActions.forEach(action => {
      const date = format(parseISO(action.timestamp), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(action)
    })
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredActions])
  
  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20" />
          ))}
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
            Failed to load moderation history: {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <Badge variant="outline">
              {filteredActions.length} actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by moderator, reason, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="approve">Approved</SelectItem>
                <SelectItem value="reject">Rejected</SelectItem>
                <SelectItem value="escalate">Escalated</SelectItem>
                <SelectItem value="shadow_ban">Shadow Banned</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="restore">Restored</SelectItem>
                <SelectItem value="warn">Warned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTarget} onValueChange={setFilterTarget}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="post">Posts</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Timeline */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {groupedActions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No moderation actions found</p>
                </div>
              ) : (
                groupedActions.map(([date, dateActions]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground font-medium">
                        {format(parseISO(date), 'MMMM d, yyyy')}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    
                    <div className="space-y-3">
                      {dateActions.map((action) => {
                        const ActionIcon = getActionIcon(action.action)
                        
                        return (
                          <div
                            key={action.id}
                            className="flex gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedAction(action)
                              onActionClick?.(action)
                            }}
                          >
                            <div className="flex-shrink-0">
                              <div className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center',
                                getActionColor(action.action),
                                'bg-current/10'
                              )}>
                                <ActionIcon className="h-5 w-5" />
                              </div>
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={action.moderator.avatar} />
                                      <AvatarFallback>
                                        {action.moderator.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">
                                      {action.moderator.name}
                                    </span>
                                    {action.moderator.role === 'AUTO' && (
                                      <Badge variant="outline" className="text-xs">
                                        Auto
                                      </Badge>
                                    )}
                                    <Badge variant={getActionBadgeVariant(action.action)}>
                                      {action.action.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {action.target.type}
                                    </Badge>
                                  </div>
                                  
                                  {action.reason && (
                                    <p className="text-sm text-muted-foreground">
                                      {action.reason}
                                    </p>
                                  )}
                                  
                                  {action.target.content && (
                                    <div className="mt-2 p-2 rounded bg-muted text-xs">
                                      {action.target.content.substring(0, 150)}
                                      {action.target.content.length > 150 && '...'}
                                    </div>
                                  )}
                                  
                                  {action.metadata && (
                                    <div className="flex items-center gap-4 mt-2">
                                      {action.metadata.aiScore !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <Shield className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            AI Score: {(action.metadata.aiScore * 100).toFixed(0)}%
                                          </span>
                                        </div>
                                      )}
                                      {action.metadata.reportCount !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <Flag className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {action.metadata.reportCount} reports
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(parseISO(action.timestamp), {
                                      addSuffix: true,
                                    })}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedAction(action)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button onClick={onLoadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Action Details Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Moderation Action Details</DialogTitle>
            <DialogDescription>
              Complete information about this moderation action
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <Badge variant={getActionBadgeVariant(selectedAction.action)} className="mt-1">
                    {selectedAction.action.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Type</p>
                  <p className="mt-1 capitalize">{selectedAction.target.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Moderator</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedAction.moderator.avatar} />
                      <AvatarFallback>{selectedAction.moderator.name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{selectedAction.moderator.name}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="mt-1">
                    {format(parseISO(selectedAction.timestamp), 'PPpp')}
                  </p>
                </div>
              </div>
              
              {selectedAction.reason && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reason</p>
                  <p className="mt-1">{selectedAction.reason}</p>
                </div>
              )}
              
              {selectedAction.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm">{selectedAction.notes}</p>
                </div>
              )}
              
              {selectedAction.target.content && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Content</p>
                  <div className="mt-1 p-3 rounded bg-muted text-sm">
                    {selectedAction.target.content}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export types
export type { ModerationAction }
