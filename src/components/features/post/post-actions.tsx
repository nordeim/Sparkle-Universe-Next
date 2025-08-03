// src/components/features/post/post-actions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn, formatNumber } from '@/lib/utils'
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PostActionsProps {
  postId: string
  likes: number
  comments: number
  isLiked: boolean
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  className?: string
  size?: 'sm' | 'default'
}

export function PostActions({
  postId,
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  className,
  size = 'default',
}: PostActionsProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const buttonSize = size === 'sm' ? 'sm' : 'default'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Like button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onLike}
        className={cn(
          'gap-2 transition-colors',
          isLiked && 'text-red-500 hover:text-red-600'
        )}
      >
        <AnimatePresence mode="wait">
          {isLiked ? (
            <motion.div
              key="liked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Heart className={cn(iconSize, 'fill-current')} />
            </motion.div>
          ) : (
            <motion.div
              key="unliked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart className={iconSize} />
            </motion.div>
          )}
        </AnimatePresence>
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-xs'
        )}>
          {formatNumber(likes)}
        </span>
      </Button>

      {/* Comment button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onComment}
        className="gap-2"
      >
        <MessageSquare className={iconSize} />
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-xs'
        )}>
          {formatNumber(comments)}
        </span>
      </Button>

      {/* Share button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onShare}
        className="gap-2 ml-auto"
      >
        <Share2 className={iconSize} />
        {size !== 'sm' && <span>Share</span>}
      </Button>

      {/* Sparkle animation on like */}
      <AnimatePresence>
        {isLiked && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-8 left-4 pointer-events-none"
          >
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
