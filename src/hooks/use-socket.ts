// src/hooks/use-socket.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/monitoring'
import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@/lib/socket/socket-server'

type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<SocketInstance | null>(null)

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !autoConnect) return

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: {
        token: session.user.id, // In production, use proper session token
      },
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    }) as SocketInstance

    socketRef.current = socket

    // Connection event handlers
    socket.on('connect', () => {
      logger.info('Socket connected', { socketId: socket.id })
      setIsConnected(true)
      setIsConnecting(false)
    })

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { reason })
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error)
      setIsConnecting(false)
    })

    socket.on('error', ({ message, code }) => {
      logger.error('Socket error:', { message, code })
    })

    // Set up global event handlers
    setupGlobalHandlers(socket, queryClient)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [session, autoConnect, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

  // Emit event helper
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (!socketRef.current?.connected) {
      logger.warn('Socket not connected, cannot emit event', { event })
      return
    }
    socketRef.current.emit(event, ...args)
  }, [])

  // Subscribe to event helper
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.on(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // One-time event listener
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) {
      logger.warn('Socket not initialized')
      return () => {}
    }

    socketRef.current.once(event, handler)

    // Return cleanup function
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (!socketRef.current) return
    
    if (handler) {
      socketRef.current.off(event, handler)
    } else {
      socketRef.current.off(event)
    }
  }, [])

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (!socketRef.current || socketRef.current.connected) return
    setIsConnecting(true)
    socketRef.current.connect()
  }, [])

  const disconnect = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return
    socketRef.current.disconnect()
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    emit,
    on,
    once,
    off,
    connect,
    disconnect,
  }
}

// Global event handlers that update React Query cache
function setupGlobalHandlers(socket: SocketInstance, queryClient: ReturnType<typeof useQueryClient>) {
  // Notification handlers
  socket.on('notification', (notification) => {
    // Update notifications query
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return { items: [notification], nextCursor: null, hasMore: false }
      return {
        ...old,
        items: [notification, ...old.items],
      }
    })

    // Show toast notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  })

  socket.on('unreadCountUpdate', (count) => {
    queryClient.setQueryData(['notifications', 'unreadCount'], count)
  })

  // Post updates
  socket.on('postUpdated', (post) => {
    queryClient.setQueryData(['post', post.id], post)
    
    // Update in lists
    queryClient.setQueriesData(
      { queryKey: ['posts'], exact: false },
      (old: any) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages?.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === post.id ? post : item
            ),
          })),
        }
      }
    )
  })

  // Comment updates
  socket.on('commentCreated', (comment) => {
    queryClient.setQueryData(
      ['comments', comment.postId],
      (old: any) => {
        if (!old) return { items: [comment], nextCursor: null, hasMore: false }
        return {
          ...old,
          items: [comment, ...old.items],
        }
      }
    )
  })

  // Reaction updates
  socket.on('reactionAdded', ({ entityType, entityId, counts }) => {
    const queryKey = entityType === 'post' 
      ? ['post', entityId] 
      : ['comment', entityId]
    
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      return {
        ...old,
        reactionCounts: counts,
      }
    })
  })
}

// Specialized hooks for specific features
export function usePresence() {
  const { emit, on, off } = useSocket()
  
  const updatePresence = useCallback((status: string, location?: string) => {
    emit('updatePresence', { status, location })
  }, [emit])

  useEffect(() => {
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000) // Send heartbeat every 4 minutes

    return () => clearInterval(interval)
  }, [updatePresence])

  return { updatePresence }
}

export function useTypingIndicator(channelId: string, channelType: string = 'conversation') {
  const { emit, on, off } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string }>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = ({ userId, username }: any) => {
      setTypingUsers(prev => new Map(prev).set(userId, { username }))
    }

    const handleUserStoppedTyping = ({ userId }: any) => {
      setTypingUsers(prev => {
        const updated = new Map(prev)
        updated.delete(userId)
        return updated
      })
    }

    const unsubscribeTyping = on('userTyping', handleUserTyping)
    const unsubscribeStoppedTyping = on('userStoppedTyping', handleUserStoppedTyping)

    return () => {
      unsubscribeTyping()
      unsubscribeStoppedTyping()
    }
  }, [on, channelId])

  const startTyping = useCallback(() => {
    emit('startTyping', { channelId, channelType })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { channelId, channelType })
    }, 3000)
  }, [emit, channelId, channelType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    emit('stopTyping', { channelId, channelType })
  }, [emit, channelId, channelType])

  return {
    typingUsers: Array.from(typingUsers.values()),
    startTyping,
    stopTyping,
  }
}

export function useRealtimePost(postId: string) {
  const { emit, on, off, isConnected } = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to post updates
    emit('subscribeToPost', postId)

    // Set up specific handlers for this post
    const handleReaction = (data: any) => {
      if (data.entityType === 'post' && data.entityId === postId) {
        queryClient.setQueryData(['post', postId, 'reactions'], data.counts)
      }
    }

    const unsubscribe = on('reactionAdded', handleReaction)

    return () => {
      emit('unsubscribeFromPost', postId)
      unsubscribe()
    }
  }, [postId, isConnected, emit, on, queryClient])
}
