// src/components/features/comments/reaction-picker.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ReactionType } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Heart, 
  Flame, 
  Sparkles, 
  Brain, 
  Laugh, 
  Frown,
  Angry,
  Star,
  MoreHorizontal
} from 'lucide-react'

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void
  currentReaction?: ReactionType | null
  className?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const reactionConfig = {
  [ReactionType.LIKE]: {
    icon: Heart,
    label: 'Like',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.LOVE]: {
    icon: Heart,
    label: 'Love',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    animation: 'hover:scale-110 hover:rotate-12',
    filled: true,
  },
  [ReactionType.FIRE]: {
    icon: Flame,
    label: 'Fire',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.SPARKLE]: {
    icon: Sparkles,
    label: 'Sparkle',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    animation: 'hover:scale-110 hover:rotate-12',
  },
  [ReactionType.MIND_BLOWN]: {
    icon: Brain,
    label: 'Mind Blown',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.LAUGH]: {
    icon: Laugh,
    label: 'Haha',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.CRY]: {
    icon: Frown,
    label: 'Sad',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.ANGRY]: {
    icon: Angry,
    label: 'Angry',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    animation: 'hover:scale-110',
  },
  [ReactionType.CUSTOM]: {
    icon: Star,
    label: 'Custom',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    animation: 'hover:scale-110',
  },
}

export function ReactionPicker({
  onSelect,
  currentReaction,
  className,
  disabled = false,
  size = 'md',
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredReaction, setHoveredReaction] = useState<ReactionType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const sizeConfig = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizeConfig = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300)
  }

  const handleReactionSelect = (type: ReactionType) => {
    onSelect(type)
    setIsOpen(false)
  }

  const CurrentIcon = currentReaction 
    ? reactionConfig[currentReaction].icon 
    : Heart

  const currentConfig = currentReaction 
    ? reactionConfig[currentReaction]
    : null

  return (
    <div 
      ref={containerRef}
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={cn(
          sizeConfig[size],
          'transition-all',
          currentConfig && currentConfig.bgColor,
        )}
        onClick={() => {
          if (currentReaction) {
            onSelect(currentReaction) // Toggle off
          } else {
            setIsOpen(!isOpen)
          }
        }}
      >
        {currentReaction ? (
          <CurrentIcon 
            className={cn(
              iconSizeConfig[size],
              currentConfig?.color,
              currentConfig?.filled && 'fill-current',
            )} 
          />
        ) : (
          <MoreHorizontal className={cn(iconSizeConfig[size], 'text-muted-foreground')} />
        )}
      </Button>

      {/* Reaction picker */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute bottom-full left-0 mb-2 z-50',
              'bg-popover border rounded-lg shadow-lg',
              'p-2 flex gap-1',
            )}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
            }}
            onMouseLeave={handleMouseLeave}
          >
            {Object.entries(reactionConfig)
              .filter(([type]) => type !== ReactionType.CUSTOM) // Exclude custom for now
              .map(([type, config]) => {
                const Icon = config.icon
                const isSelected = currentReaction === type
                const isHovered = hoveredReaction === type

                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReactionSelect(type as ReactionType)}
                    onMouseEnter={() => setHoveredReaction(type as ReactionType)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    className={cn(
                      'relative p-2 rounded-lg transition-all',
                      'hover:bg-accent',
                      isSelected && config.bgColor,
                      config.animation,
                    )}
                  >
                    <Icon 
                      className={cn(
                        iconSizeConfig[size],
                        config.color,
                        (isSelected || isHovered) && config.filled && 'fill-current',
                      )} 
                    />
                    
                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className={cn(
                            'absolute bottom-full left-1/2 -translate-x-1/2 mb-1',
                            'px-2 py-1 rounded text-xs',
                            'bg-popover border whitespace-nowrap',
                          )}
                        >
                          {config.label}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
