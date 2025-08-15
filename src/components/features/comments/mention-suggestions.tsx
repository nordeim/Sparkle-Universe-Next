// src/components/features/comments/mention-suggestions.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MentionSuggestionsProps {
  search: string
  onSelect: (username: string) => void
  onClose: () => void
}

export function MentionSuggestions({ search, onSelect, onClose }: MentionSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: users, isLoading } = api.user.search.useQuery(
    { query: search, limit: 5 },
    { 
      enabled: search.length > 0,
      keepPreviousData: true,
    }
  )

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!users || users.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % users.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
          break
        case 'Enter':
          e.preventDefault()
          onSelect(users[selectedIndex].username)
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [users, selectedIndex, onSelect, onClose])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!search) return null

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto bg-popover border rounded-lg shadow-lg z-50"
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        </div>
      ) : users && users.length > 0 ? (
        <div className="py-1">
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.username)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'w-full px-4 py-2 flex items-center gap-3 hover:bg-accent transition-colors',
                selectedIndex === index && 'bg-accent'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">@{user.username}</span>
                  {user.verified && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      ✓
                    </Badge>
                  )}
                </div>
                {user.profile?.displayName && (
                  <p className="text-xs text-muted-foreground">
                    {user.profile.displayName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  )
}
