// src/components/ui/emoji-picker.tsx
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Smile, Search, Clock, Heart, Star, Flag, Sparkles } from 'lucide-react'

// Sparkle Universe reaction emojis
const REACTION_EMOJIS = {
  LIKE: '👍',
  LOVE: '❤️',
  FIRE: '🔥',
  SPARKLE: '✨',
  MIND_BLOWN: '🤯',
  LAUGH: '😂',
  CRY: '😢',
  ANGRY: '😠',
  CUSTOM: '⭐',
}

const EMOJI_CATEGORIES = {
  recent: {
    label: 'Recent',
    icon: Clock,
    emojis: ['👍', '❤️', '🔥', '✨', '🤯', '😂'],
  },
  reactions: {
    label: 'Reactions',
    icon: Heart,
    emojis: Object.values(REACTION_EMOJIS),
  },
  sparkle: {
    label: 'Sparkle',
    icon: Sparkles,
    emojis: ['✨', '💎', '🌟', '⭐', '💫', '🌠', '🎆', '🎇', '🪐', '🌌'],
  },
  smileys: {
    label: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
      '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
      '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
    ],
  },
  gestures: {
    label: 'Gestures',
    icon: Star,
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
      '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂',
    ],
  },
  objects: {
    label: 'Objects',
    icon: Flag,
    emojis: [
      '🎉', '🎊', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈', '🥉', '🏅',
      '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤',
      '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕',
      '🎻', '🎲', '🎯', '🎳', '🎮', '🎰', '🧩', '🔔', '🔕', '📢',
    ],
  },
}

interface EmojiPickerProps {
  value?: string
  onChange?: (emoji: string) => void
  className?: string
  disabled?: boolean
  placeholder?: string
  showSearch?: boolean
  showCategories?: boolean
  recentEmojis?: string[]
  customEmojis?: Record<string, string>
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function EmojiPicker({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = '😊',
  showSearch = true,
  showCategories = true,
  recentEmojis = [],
  customEmojis = {},
  side = 'bottom',
  align = 'start',
}: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState('reactions')
  const [recent, setRecent] = React.useState<string[]>(recentEmojis)

  const handleEmojiSelect = React.useCallback(
    (emoji: string) => {
      onChange?.(emoji)
      setOpen(false)

      // Update recent emojis
      setRecent((prev) => {
        const updated = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 10)
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('sparkle-recent-emojis', JSON.stringify(updated))
        }
        return updated
      })
    },
    [onChange]
  )

  // Load recent emojis from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sparkle-recent-emojis')
      if (stored) {
        try {
          setRecent(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse recent emojis:', e)
        }
      }
    }
  }, [])

  // Filter emojis based on search
  const getFilteredEmojis = React.useCallback(
    (emojis: string[]) => {
      if (!search) return emojis
      // For simplicity, we're just checking if the emoji is in our search
      // In a real app, you'd want to map emojis to keywords
      return emojis
    },
    [search]
  )

  const categories = React.useMemo(() => {
    const cats = { ...EMOJI_CATEGORIES }
    if (recent.length > 0) {
      cats.recent.emojis = recent
    }
    if (Object.keys(customEmojis).length > 0) {
      cats.custom = {
        label: 'Custom',
        icon: Star,
        emojis: Object.values(customEmojis),
      }
    }
    return cats
  }, [recent, customEmojis])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn('h-9 w-9', className)}
          disabled={disabled}
        >
          <span className="text-lg">{value || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-80 p-0"
        sideOffset={5}
      >
        <div className="flex flex-col">
          {showSearch && (
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emojis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          )}

          {showCategories ? (
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-6 h-10 rounded-none border-b">
                {Object.entries(categories).map(([key, category]) => {
                  const Icon = category.icon
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="data-[state=active]:bg-background rounded-none"
                    >
                      <Icon className="h-4 w-4" />
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(categories).map(([key, category]) => (
                <TabsContent key={key} value={key} className="m-0">
                  <ScrollArea className="h-64 p-3">
                    <div className="grid grid-cols-8 gap-2">
                      {getFilteredEmojis(category.emojis).map((emoji, index) => (
                        <button
                          key={`${key}-${index}`}
                          className={cn(
                            'h-8 w-8 rounded hover:bg-accent hover:text-accent-foreground',
                            'focus:bg-accent focus:text-accent-foreground',
                            'transition-colors text-lg flex items-center justify-center',
                            value === emoji && 'bg-accent text-accent-foreground'
                          )}
                          onClick={() => handleEmojiSelect(emoji)}
                          disabled={disabled}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <ScrollArea className="h-64 p-3">
              <div className="grid grid-cols-8 gap-2">
                {getFilteredEmojis(categories.reactions.emojis).map((emoji, index) => (
                  <button
                    key={index}
                    className={cn(
                      'h-8 w-8 rounded hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground',
                      'transition-colors text-lg flex items-center justify-center',
                      value === emoji && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleEmojiSelect(emoji)}
                    disabled={disabled}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Quick emoji selector for reactions
export function QuickEmojiSelector({
  onSelect,
  className,
}: {
  onSelect: (emoji: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1', className)}>
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <button
          key={key}
          onClick={() => onSelect(emoji)}
          className={cn(
            'h-8 w-8 rounded hover:bg-accent hover:text-accent-foreground',
            'transition-all hover:scale-110 active:scale-95',
            'flex items-center justify-center text-lg'
          )}
          title={key}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default EmojiPicker
