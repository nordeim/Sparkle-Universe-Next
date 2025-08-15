// src/components/features/comments/comment-form.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { useSocket } from '@/hooks/use-socket'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Send, X, Loader2, AtSign, Smile } from 'lucide-react'
import { MentionSuggestions } from './mention-suggestions'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { useDebounce } from '@/hooks/use-debounce'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentFormProps {
  postId: string
  parentId?: string
  commentId?: string
  initialContent?: string
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
  placeholder?: string
  autoFocus?: boolean
  isEdit?: boolean
}

export function CommentForm({
  postId,
  parentId,
  commentId,
  initialContent = '',
  onSuccess,
  onCancel,
  className,
  placeholder = 'Write a comment...',
  autoFocus = false,
  isEdit = false,
}: CommentFormProps) {
  const { user } = useAuth()
  const { emit } = useSocket()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: initialContent,
    },
  })

  const content = form.watch('content')
  const debouncedContent = useDebounce(content, 500)

  // Create/update comment mutation
  const createMutation = api.comment.create.useMutation({
    onSuccess: () => {
      form.reset()
      toast({
        title: 'Comment posted!',
      })
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateMutation = api.comment.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Comment updated!',
      })
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Typing indicators
  const startTyping = api.comment.startTyping.useMutation()
  const stopTyping = api.comment.stopTyping.useMutation()

  useEffect(() => {
    if (debouncedContent && !isEdit && !isTyping) {
      setIsTyping(true)
      startTyping.mutate({ postId, parentId })
    } else if (!debouncedContent && isTyping) {
      setIsTyping(false)
      stopTyping.mutate({ postId, parentId })
    }

    return () => {
      if (isTyping) {
        stopTyping.mutate({ postId, parentId })
      }
    }
  }, [debouncedContent, isEdit, isTyping, postId, parentId])

  // Handle mention detection
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setShowMentions(true)
      setMentionSearch(mentionMatch[1])
      setMentionIndex(mentionMatch.index || 0)
    } else {
      setShowMentions(false)
    }
  }, [content])

  const onSubmit = async (data: CommentFormData) => {
    // Extract mentions
    const mentions = extractMentions(data.content)

    if (isEdit && commentId) {
      updateMutation.mutate({
        id: commentId,
        content: data.content,
      })
    } else {
      createMutation.mutate({
        postId,
        parentId,
        content: data.content,
        mentions,
      })
    }
  }

  const handleMentionSelect = (username: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const beforeMention = content.substring(0, mentionIndex)
    const afterMention = content.substring(textarea.selectionStart)
    const newContent = `${beforeMention}@${username} ${afterMention}`

    form.setValue('content', newContent)
    setShowMentions(false)

    // Set cursor position after mention
    setTimeout(() => {
      const newPosition = mentionIndex + username.length + 2
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    
    form.setValue('content', newContent)
    setShowEmojiPicker(false)

    // Set cursor position after emoji
    setTimeout(() => {
      const newPosition = start + emoji.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn('relative', className)}>
      <div className="flex gap-3">
        {/* User avatar */}
        {user && !isEdit && (
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Comment input */}
        <div className="flex-1">
          <div className="relative">
            <Textarea
              {...form.register('content')}
              ref={textareaRef}
              placeholder={placeholder}
              className={cn(
                'min-h-[80px] resize-none pr-20',
                form.formState.errors.content && 'border-destructive'
              )}
              onKeyDown={handleKeyDown}
              autoFocus={autoFocus}
              disabled={isSubmitting}
            />
            
            {/* Action buttons */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isSubmitting}
              >
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={isSubmitting}
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker onSelect={handleEmojiSelect} />
              </div>
            )}

            {/* Mention suggestions */}
            {showMentions && (
              <MentionSuggestions
                search={mentionSearch}
                onSelect={handleMentionSelect}
                onClose={() => setShowMentions(false)}
              />
            )}
          </div>

          {/* Error message */}
          {form.formState.errors.content && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.content.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Ctrl+Enter to submit
            </p>
            
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                {isEdit ? 'Update' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // Remove duplicates
}
