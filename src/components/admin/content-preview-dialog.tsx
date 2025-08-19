// src/components/admin/content-preview-dialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  User,
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Flag,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link,
  Image,
  Video,
  Hash,
  Clock,
  TrendingUp,
  BarChart
} from 'lucide-react'
import { formatRelativeTime, formatNumber, cn } from '@/lib/utils'

interface ContentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: {
    id: string
    type: 'post' | 'comment' | 'video' | 'image'
    title?: string
    content: string
    author: {
      id: string
      username: string
      avatar?: string
      role: string
      verified: boolean
    }
    createdAt: Date
    updatedAt?: Date
    status: 'published' | 'draft' | 'archived' | 'deleted'
    moderationStatus?: 'pending' | 'approved' | 'rejected'
    stats: {
      views: number
      likes: number
      comments: number
      shares: number
      reports: number
    }
    tags?: string[]
    media?: Array<{
      type: 'image' | 'video'
      url: string
      thumbnail?: string
    }>
    metadata?: Record<string, any>
  }
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
}

export function ContentPreviewDialog({
  open,
  onOpenChange,
  content,
  onApprove,
  onReject,
  onDelete
}: ContentPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState('content')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return 'text-green-500'
      case 'draft':
      case 'pending':
        return 'text-yellow-500'
      case 'archived':
        return 'text-gray-500'
      case 'deleted':
      case 'rejected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return CheckCircle
      case 'draft':
      case 'pending':
        return Clock
      case 'archived':
        return Shield
      case 'deleted':
      case 'rejected':
        return XCircle
      default:
        return AlertTriangle
    }
  }

  const StatusIcon = getStatusIcon(content.status)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Preview
          </DialogTitle>
          <DialogDescription>
            Detailed view of {content.type} content
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="content" className="space-y-4">
              {/* Author Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={content.author.avatar} />
                    <AvatarFallback>{content.author.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{content.author.username}</p>
                      {content.author.verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <Badge variant="outline">{content.author.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Posted {formatRelativeTime(content.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn('h-5 w-5', getStatusColor(content.status))} />
                  <Badge variant="outline">{content.status}</Badge>
                  {content.moderationStatus && (
                    <Badge variant={content.moderationStatus === 'approved' ? 'default' : content.moderationStatus === 'rejected' ? 'destructive' : 'secondary'}>
                      {content.moderationStatus}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Title */}
              {content.title && (
                <div>
                  <h3 className="text-xl font-semibold">{content.title}</h3>
                </div>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {content.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Content Body */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="whitespace-pre-wrap">{content.content}</p>
                </div>
              </div>

              {/* Media */}
              {content.media && content.media.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attached Media</p>
                  <div className="grid grid-cols-2 gap-2">
                    {content.media.map((media, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border">
                        {media.type === 'image' ? (
                          <img src={media.url} alt="" className="w-full h-40 object-cover" />
                        ) : (
                          <div className="w-full h-40 bg-muted flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          {media.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-5 gap-4 p-4 rounded-lg border">
                <div className="text-center">
                  <Eye className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.views)}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.likes)}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.comments)}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="text-center">
                  <Share2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatNumber(content.stats.shares)}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </div>
                <div className="text-center">
                  <Flag className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-sm font-medium text-destructive">{formatNumber(content.stats.reports)}</p>
                  <p className="text-xs text-muted-foreground">Reports</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Content ID</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{content.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Author ID</p>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{content.author.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Type</p>
                    <Badge>{content.type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Status</p>
                    <Badge variant="outline">{content.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Created</p>
                    <p className="text-sm">{content.createdAt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Updated</p>
                    <p className="text-sm">{content.updatedAt?.toLocaleString() || 'Never'}</p>
                  </div>
                </div>

                {content.metadata && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Additional Metadata</p>
                      <div className="space-y-2">
                        {Object.entries(content.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{key}</span>
                            <span className="font-mono">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((content.stats.likes + content.stats.comments + content.stats.shares) / content.stats.views * 100).toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Based on interactions / views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Virality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(content.stats.shares / content.stats.views * 1000).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Shares per 1000 views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Report Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {(content.stats.reports / content.stats.views * 100).toFixed(3)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reports / views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Above Average</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compared to similar content
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Engagement Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Like Rate</span>
                    <span className="text-sm font-medium">{(content.stats.likes / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Comment Rate</span>
                    <span className="text-sm font-medium">{(content.stats.comments / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Share Rate</span>
                    <span className="text-sm font-medium">{(content.stats.shares / content.stats.views * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {[
                  { action: 'Content created', user: content.author.username, timestamp: content.createdAt },
                  { action: 'Content published', user: 'System', timestamp: new Date(content.createdAt.getTime() + 60000) },
                  { action: 'Moderation review requested', user: 'AutoMod', timestamp: new Date(content.createdAt.getTime() + 120000) },
                  { action: 'Content approved', user: 'Moderator1', timestamp: new Date(content.createdAt.getTime() + 300000) },
                ].map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        by {event.user} • {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {content.moderationStatus === 'pending' && (
            <>
              <Button variant="destructive" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button onClick={onApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </>
          )}
          {content.status === 'published' && (
            <Button variant="destructive" onClick={onDelete}>
              Delete Content
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ContentPreviewDialog
