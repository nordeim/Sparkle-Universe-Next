// src/components/admin/moderator-queue.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield,
  AlertTriangle,
  Flag,
  Eye,
  Check,
  X,
  MessageSquare,
  FileText,
  User,
  Clock,
  ChevronRight,
  Filter,
  SortDesc
} from 'lucide-react'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { ModerationQueueItem } from '@/types'

interface QueueItem extends ModerationQueueItem {
  reporter?: {
    id: string
    name: string
    avatar?: string
  }
  aiAnalysis?: {
    score: number
    categories: string[]
    confidence: number
  }
}

export function ModeratorQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'post' | 'comment' | 'user' | 'message'>('all')
  const [priority, setPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('priority')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [actionNote, setActionNote] = useState('')

  useEffect(() => {
    fetchQueue()
  }, [filter, priority, sortBy])

  const fetchQueue = async () => {
    setLoading(true)
    try {
      // Mock data generation
      const items: QueueItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `mod-${i}`,
        type: ['post', 'comment', 'user', 'message'][Math.floor(Math.random() * 4)] as any,
        entityId: `entity-${i}`,
        reason: ['spam', 'inappropriate', 'harassment', 'misinformation'][Math.floor(Math.random() * 4)],
        reportCount: Math.floor(Math.random() * 10) + 1,
        priority: Math.floor(Math.random() * 4),
        status: ['pending', 'reviewing'][Math.floor(Math.random() * 2)] as any,
        createdAt: new Date(Date.now() - Math.random() * 86400000),
        content: `This is ${['offensive', 'spam', 'inappropriate', 'misleading'][Math.floor(Math.random() * 4)]} content that needs review...`,
        author: {
          id: `user-${i}`,
          username: `User${i}`,
          image: `https://avatar.vercel.sh/user${i}`,
          bio: null,
          verified: false,
          role: 'USER',
          level: Math.floor(Math.random() * 10) + 1,
          createdAt: new Date()
        },
        reporter: {
          id: `reporter-${i}`,
          name: `Reporter ${i}`,
          avatar: `https://avatar.vercel.sh/reporter${i}`
        },
        aiAnalysis: Math.random() > 0.5 ? {
          score: Math.random() * 100,
          categories: ['toxic', 'spam', 'nsfw'].slice(0, Math.floor(Math.random() * 3) + 1),
          confidence: Math.random() * 100
        } : undefined
      }))

      // Apply filters and sorting
      let filtered = items
      if (filter !== 'all') {
        filtered = filtered.filter(item => item.type === filter)
      }
      if (priority !== 'all') {
        const priorityMap = { high: 3, medium: 2, low: 1 }
        filtered = filtered.filter(item => item.priority === priorityMap[priority as keyof typeof priorityMap])
      }

      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.createdAt.getTime() - a.createdAt.getTime()
          case 'oldest':
            return a.createdAt.getTime() - b.createdAt.getTime()
          case 'priority':
            return b.priority - a.priority
          default:
            return 0
        }
      })

      setQueue(filtered)
    } catch (error) {
      console.error('Failed to fetch moderation queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (itemId: string, action: 'approve' | 'reject' | 'escalate') => {
    setProcessing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove from queue
      setQueue(prev => prev.filter(item => item.id !== itemId))
      setSelectedItem(null)
      setActionNote('')
    } catch (error) {
      console.error('Failed to process moderation action:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return 'destructive'
      case 2:
        return 'secondary'
      case 1:
        return 'outline'
      default:
        return 'default'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3:
        return 'High'
      case 2:
        return 'Medium'
      case 1:
        return 'Low'
      default:
        return 'Normal'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post':
        return FileText
      case 'comment':
        return MessageSquare
      case 'user':
        return User
      default:
        return Flag
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Queue List */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Moderation Queue</CardTitle>
                <CardDescription>{queue.length} items pending review</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {queue.map(item => {
                  const TypeIcon = getTypeIcon(item.type)
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        selectedItem?.id === item.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <TypeIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(item.priority)}>
                                {getPriorityLabel(item.priority)}
                              </Badge>
                              <Badge variant="outline">{item.type}</Badge>
                              <Badge variant="outline">{item.reason}</Badge>
                              {item.aiAnalysis && (
                                <Badge variant="secondary">
                                  AI: {item.aiAnalysis.score.toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">{item.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Flag className="h-3 w-3" />
                                {item.reportCount} reports
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(item.createdAt)}
                              </span>
                              {item.author && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.author.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel */}
      <div className="space-y-4">
        {selectedItem ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Content</p>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">{selectedItem.content}</p>
                  </div>
                </div>

                {selectedItem.author && (
                  <div>
                    <p className="text-sm font-medium mb-2">Author</p>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedItem.author.image || undefined} />
                        <AvatarFallback>{selectedItem.author.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedItem.author.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Level {selectedItem.author.level} • Joined {formatRelativeTime(selectedItem.author.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.reporter && (
                  <div>
                    <p className="text-sm font-medium mb-2">Reported by</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedItem.reporter.avatar} />
                        <AvatarFallback>{selectedItem.reporter.name[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm">{selectedItem.reporter.name}</p>
                    </div>
                  </div>
                )}

                {selectedItem.aiAnalysis && (
                  <div>
                    <p className="text-sm font-medium mb-2">AI Analysis</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Violation Score</span>
                        <span className="font-mono">{selectedItem.aiAnalysis.score.toFixed(1)}%</span>
                      </div>
                      <Progress value={selectedItem.aiAnalysis.score} />
                      <div className="flex items-center gap-1">
                        {selectedItem.aiAnalysis.categories.map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Confidence: {selectedItem.aiAnalysis.confidence.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Action Note</p>
                  <Textarea
                    placeholder="Add a note about your decision..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={() => handleAction(selectedItem.id, 'approve')}
                    disabled={processing}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleAction(selectedItem.id, 'reject')}
                    disabled={processing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => handleAction(selectedItem.id, 'escalate')}
                    disabled={processing}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Escalate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Content
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  View User Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Moderation History
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an item to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ModeratorQueue
