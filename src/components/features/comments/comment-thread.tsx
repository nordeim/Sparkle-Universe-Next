// src/components/features/comments/comment-thread.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MessageSquare, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSocket } from '@/hooks/use-socket'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CommentThreadProps {
  postId: string
  className?: string
  onCommentCountChange?: (count: number) => void
}

export function CommentThread({ postId, className, onCommentCountChange }: CommentThreadProps) {
  const { user } = useAuth()
  const { isConnected, on, emit, joinRoom, leaveRoom } = useSocket()
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string; timeout: NodeJS.Timeout }>>(new Map())

  const utils = api.useUtils()

  // Fetch comments
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading,
    refetch,
  } = api.comment.list.useInfiniteQuery(
    { postId, limit: 20, sortBy },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  )

  const comments = data?.pages.flatMap(page => page.items) ?? []
  const totalComments = comments.length

  // Update comment count
  useEffect(() => {
    if (onCommentCountChange && totalComments > 0) {
      onCommentCountChange(totalComments)
    }
  }, [totalComments, onCommentCountChange])

  // Join post room for real-time updates
  useEffect(() => {
    if (isConnected && postId) {
      joinRoom(`post:${postId}`)

      return () => {
        leaveRoom(`post:${postId}`)
      }
    }
  }, [isConnected, postId, joinRoom, leaveRoom])

  // Handle real-time events
  useEffect(() => {
    if (!isConnected) return

    const unsubscribers = [
      // New comment
      on('comment.created', (data: any) => {
        if (data.postId === postId) {
          utils.comment.list.setInfiniteData(
            { postId, limit: 20, sortBy },
            (oldData) => {
              if (!oldData) return oldData
              
              const newPages = [...oldData.pages]
              newPages[0] = {
                ...newPages[0],
                items: [data.comment, ...newPages[0].items],
              }
              
              return {
                ...oldData,
                pages: newPages,
              }
            }
          )
        }
      }),

      // Updated comment
      on('comment.updated', (data: any) => {
        if (data.postId === postId) {
          utils.comment.list.setInfiniteData(
            { postId, limit: 20, sortBy },
            (oldData) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                  ...page,
                  items: page.items.map(comment =>
                    comment.id === data.commentId
                      ? { ...comment, content: data.content, edited: true }
                      : comment
                  ),
                })),
              }
            }
          )
        }
      }),

      // Deleted comment
      on('comment.deleted', (data: any) => {
        if (data.postId === postId) {
          utils.comment.list.setInfiniteData(
            { postId, limit: 20, sortBy },
            (oldData) => {
              if (!oldData) return oldData
              
              return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                  ...page,
                  items: page.items.filter(comment => comment.id !== data.commentId),
                })),
              }
            }
          )
        }
      }),

      // Typing indicators
      on('comment.typing', (data: any) => {
        if (data.postId === postId && data.userId !== user?.id) {
          setTypingUsers(prev => {
            const next = new Map(prev)
            
            if (data.isTyping) {
              // Clear existing timeout
              const existing = next.get(data.userId)
              if (existing) {
                clearTimeout(existing.timeout)
              }
              
              // Set new timeout to clear typing indicator after 3 seconds
              const timeout = setTimeout(() => {
                setTypingUsers(p => {
                  const n = new Map(p)
                  n.delete(data.userId)
                  return n
                })
              }, 3000)
              
              next.set(data.userId, { username: data.username, timeout })
            } else {
              const existing = next.get(data.userId)
              if (existing) {
                clearTimeout(existing.timeout)
              }
              next.delete(data.userId)
            }
            
            return next
          })
        }
      }),
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [isConnected, on, postId, user?.id, utils, sortBy])

  const handleCommentSuccess = useCallback(() => {
    setReplyingTo(null)
    setEditingComment(null)
    refetch()
  }, [refetch])

  const handleReply = useCallback((commentId: string) => {
    setReplyingTo(commentId)
    setEditingComment(null)
  }, [])

  const handleEdit = useCallback((commentId: string) => {
    setEditingComment(commentId)
    setReplyingTo(null)
  }, [])

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingComment(null)
  }, [])

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <Skeleton className="h-32" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const typingUsersList = Array.from(typingUsers.values()).map(u => u.username)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({totalComments})
        </h3>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comment form */}
      {user && !replyingTo && !editingComment && (
        <CommentForm 
          postId={postId}
          onSuccess={handleCommentSuccess}
        />
      )}

      {/* Typing indicators */}
      <AnimatePresence>
        {typingUsersList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-muted-foreground italic flex items-center gap-1"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            {typingUsersList.length === 1 
              ? `${typingUsersList[0]} is typing...`
              : typingUsersList.length === 2
              ? `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`
              : `${typingUsersList.slice(0, -1).join(', ')} and ${typingUsersList.length - 1} others are typing...`
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
          {user && (
            <div className="mt-4 max-w-md mx-auto">
              <CommentForm 
                postId={postId}
                onSuccess={handleCommentSuccess}
                autoFocus
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <CommentItem
                  comment={comment}
                  postId={postId}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  isReplying={replyingTo === comment.id}
                  isEditing={editingComment === comment.id}
                  onCancelReply={handleCancelReply}
                  onCancelEdit={handleCancelEdit}
                  onSuccess={handleCommentSuccess}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Load more comments
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
