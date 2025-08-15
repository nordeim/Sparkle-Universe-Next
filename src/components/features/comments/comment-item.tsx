// src/components/features/comments/comment-item.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { api } from '@/lib/api'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommentForm } from './comment-form'
import { ReactionPicker } from './reaction-picker'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { 
  MessageSquare, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Flag,
  Pin,
  Clock,
  Youtube,
  Reply,
  Quote,
  Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type RouterOutputs } from '@/lib/api'
import { ReactionType } from '@prisma/client'

type Comment = RouterOutputs['comment']['list']['items'][0]

interface CommentItemProps {
  comment: Comment
  postId: string
  onReply?: (commentId: string) => void
  onEdit?: (commentId: string) => void
  isReplying?: boolean
  isEditing?: boolean
  onCancelReply?: () => void
  onCancelEdit?: () => void
  onSuccess?: () => void
  depth?: number
}

export function CommentItem({ 
  comment, 
  postId,
  onReply,
  onEdit,
  isReplying,
  isEditing,
  onCancelReply,
  onCancelEdit,
  onSuccess,
  depth = 0,
}: CommentItemProps) {
  const { user } = useAuth()
  const [currentReaction, setCurrentReaction] = useState<ReactionType | null>(
    comment.userReaction?.reactionType || null
  )
  const [reactionCounts, setReactionCounts] = useState(comment.reactionCounts)
  const [showReplies, setShowReplies] = useState(depth === 0 && comment.replies && comment.replies.length > 0)
  const [loadingReplies, setLoadingReplies] = useState(false)

  const utils = api.useUtils()

  // Mutations
  const reactionMutation = api.comment.react.useMutation({
    onMutate: ({ type }) => {
      // Optimistic update
      const oldReaction = currentReaction
      setCurrentReaction(type)
      
      // Update counts
      if (reactionCounts) {
        const newCounts = { ...reactionCounts }
        if (oldReaction) {
          newCounts[oldReaction]--
          newCounts.total--
        }
        if (type !== oldReaction) {
          newCounts[type]++
          newCounts.total++
        }
        setReactionCounts(newCounts)
      }
    },
    onError: (error) => {
      // Revert on error
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      })
      // Refetch to get correct state
      utils.comment.list.invalidate()
    },
  })

  const deleteMutation = api.comment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted',
      })
      onSuccess?.()
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive',
      })
    },
  })

  const pinMutation = api.comment.togglePin.useMutation({
    onSuccess: () => {
      toast({
        title: comment.pinned ? 'Comment unpinned' : 'Comment pinned',
      })
      utils.comment.list.invalidate()
    },
  })

  // Fetch replies
  const { data: repliesData, isLoading: repliesLoading } = api.comment.getThread.useQuery(
    { commentId: comment.id, limit: 10 },
    { enabled: showReplies && !comment.replies }
  )

  const handleReaction = (type: ReactionType) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to react to comments',
      })
      return
    }

    // If clicking the same reaction, remove it
    const newType = currentReaction === type ? null : type
    
    if (newType) {
      reactionMutation.mutate({ commentId: comment.id, type: newType })
    } else if (currentReaction) {
      // Remove reaction
      reactionMutation.mutate({ commentId: comment.id, type: currentReaction, remove: true })
      setCurrentReaction(null)
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate({ id: comment.id })
    }
  }

  const handlePin = () => {
    pinMutation.mutate({ commentId: comment.id })
  }

  const isAuthor = user?.id === comment.authorId
  const canEdit = isAuthor && !comment.deleted
  const canDelete = isAuthor || user?.role === 'ADMIN'
  const canPin = user?.id === comment.post?.authorId

  // Don't render deeply nested comments beyond 5 levels
  if (depth > 5) return null

  // Format timestamps
  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn(
      'group',
      depth > 0 && 'ml-12 mt-4'
    )}>
      <div className={cn(
        'flex gap-3',
        comment.deleted && 'opacity-50'
      )}>
        {/* Avatar */}
        <Link href={`/user/${comment.author.username}`}>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.author.image || undefined} />
            <AvatarFallback>
              {comment.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                href={`/user/${comment.author.username}`}
                className="font-semibold hover:underline"
              >
                {comment.author.username}
              </Link>
              
              {comment.author.verified && (
                <Badge variant="secondary" className="h-5 px-1">
                  ✓
                </Badge>
              )}
              
              {comment.pinned && (
                <Badge variant="default" className="h-5">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              
              {comment.edited && (
                <span className="text-sm text-muted-foreground">(edited)</span>
              )}
              
              {comment.youtubeTimestamp && (
                <Badge variant="outline" className="h-5">
                  <Youtube className="h-3 w-3 mr-1" />
                  {formatTimestamp(comment.youtubeTimestamp)}
                </Badge>
              )}
              
              {comment.quotedTimestamp && (
                <Badge variant="outline" className="h-5">
                  <Quote className="h-3 w-3 mr-1" />
                  {comment.quotedTimestamp}
                </Badge>
              )}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(comment.id)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {canPin && (
                  <>
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="h-4 w-4 mr-2" />
                      {comment.pinned ? 'Unpin' : 'Pin'} comment
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Comment content */}
          {isEditing ? (
            <CommentForm
              postId={postId}
              commentId={comment.id}
              initialContent={comment.content}
              onSuccess={onSuccess}
              onCancel={onCancelEdit}
              isEdit
            />
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          )}

          {/* Actions */}
          {!comment.deleted && !isEditing && (
            <div className="flex items-center gap-4 text-sm">
              {/* Reaction picker */}
              <div className="flex items-center gap-2">
                <ReactionPicker
                  onSelect={handleReaction}
                  currentReaction={currentReaction}
                  size="sm"
                  disabled={!user}
                />
                
                {reactionCounts && reactionCounts.total > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {Object.entries(reactionCounts)
                      .filter(([type, count]) => type !== 'total' && count > 0)
                      .slice(0, 3)
                      .map(([type, count]) => (
                        <span key={type} className="flex items-center">
                          {count}
                        </span>
                      ))}
                    {reactionCounts.total > 0 && (
                      <span className="ml-1">
                        ({reactionCounts.total} total)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {user && depth < 5 && (
                <button
                  onClick={() => onReply?.(comment.id)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </button>
              )}

              {comment._count.replies > 0 && depth < 5 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  {showReplies ? 'Hide' : 'Show'} {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSuccess={onSuccess}
                onCancel={onCancelReply}
                autoFocus
                placeholder={`Reply to @${comment.author.username}...`}
              />
            </div>
          )}

          {/* Replies */}
          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {repliesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading replies...
                  </div>
                ) : (
                  <>
                    {(comment.replies || repliesData?.items || []).map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        postId={postId}
                        onReply={onReply}
                        onEdit={onEdit}
                        isReplying={isReplying}
                        isEditing={isEditing}
                        onCancelReply={onCancelReply}
                        onCancelEdit={onCancelEdit}
                        onSuccess={onSuccess}
                        depth={depth + 1}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
