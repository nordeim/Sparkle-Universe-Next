// src/hooks/use-socket.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import type { ServerToClientEvents, ClientToServerEvents } from '@/types'
import type { WatchPartyChat } from '@prisma/client'

type SocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>

interface UseSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  latency: number
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options

  const { user, session } = useAuth()
  const queryClient = useQueryClient()
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    latency: 0,
  })

  const socketRef = useRef<SocketInstance | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map())

  // Initialize socket connection
  const connect = useCallback(() => {
    if (!session || socketRef.current?.connected) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    const socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      timeout: 10000,
      auth: {
        sessionId: session?.user?.id,
      },
    }) as SocketInstance

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id)
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }))

      // Start latency monitoring
      startLatencyCheck()
      
      // Set up global event handlers
      setupGlobalHandlers(socket, queryClient)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }))

      stopLatencyCheck()

      // Handle reconnection for specific disconnect reasons
      if (reason === 'io server disconnect') {
        attemptReconnect()
      }
    })

    socket.on('error', (error) => {
      console.error('⚠️ WebSocket error:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: new Error(error.message || 'Socket error'),
      }))

      if (error.message === 'Authentication required') {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to continue',
          variant: 'destructive',
        })
      }
    })

    // Reattach existing event handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      handlers.forEach(handler => {
        (socket as any).on(event, handler)
      })
    })

    socketRef.current = socket
  }, [session, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      stopLatencyCheck()
    }
  }, [])

  // Type-safe emit
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, queuing event:', event)
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit(event, ...args)
      })
      return
    }

    socketRef.current.emit(event, ...args)
  }, [])

  // Type-safe event subscription with fix for handler types
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    // Store handler reference
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set())
    }
    eventHandlersRef.current.get(event)!.add(handler as Function)

    // Attach to socket if connected
    if (socketRef.current) {
      // Cast handler to any to avoid type issues with Socket.IO's overloaded signatures
      (socketRef.current as any).on(event, handler)
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler as Function)
      if (socketRef.current) {
        (socketRef.current as any).off(event, handler)
      }
    }
  }, [])

  // Type-safe once subscription
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      (socketRef.current as any).once(event, handler)
    }
    
    return () => {
      if (socketRef.current) {
        (socketRef.current as any).off(event, handler)
      }
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler as Function)
      if (socketRef.current) {
        (socketRef.current as any).off(event, handler)
      }
    } else {
      eventHandlersRef.current.delete(event)
      socketRef.current?.removeAllListeners(event)
    }
  }, [])

  // Join room
  const joinRoom = useCallback((room: string) => {
    emit('join:room', room)
  }, [emit])

  // Leave room
  const leaveRoom = useCallback((room: string) => {
    emit('leave:room', room)
  }, [emit])

  // Update presence
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy', location?: string) => {
    emit('presence:update', { status, location })
  }, [emit])

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!socketRef.current?.connected && session) {
        console.log('Attempting to reconnect...')
        connect()
      }
    }, reconnectionDelay)
  }, [connect, session, reconnectionDelay])

  // Latency monitoring
  const startLatencyCheck = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const start = Date.now()
        
        socketRef.current.timeout(5000).emit('ping', () => {
          const latency = Date.now() - start
          setState(prev => ({ ...prev, latency }))
        })
      }
    }, 5000) // Check every 5 seconds
  }, [])

  const stopLatencyCheck = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && session) {
      connect()
    }

    return () => {
      disconnect()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [autoConnect, session, connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away')
      } else {
        updatePresence('online')
        
        if (!socketRef.current?.connected && session) {
          attemptReconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updatePresence, attemptReconnect, session])

  return {
    // State
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    latency: state.latency,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    once,
    off,
    joinRoom,
    leaveRoom,
    updatePresence,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
  }
}

// Global event handlers that update React Query cache
function setupGlobalHandlers(socket: SocketInstance, queryClient: ReturnType<typeof useQueryClient>) {
  // Notification handlers
  socket.on('notification', (notification) => {
    queryClient.setQueryData(['notifications'], (old: any) => {
      if (!old) return { items: [notification], nextCursor: null, hasMore: false }
      return {
        ...old,
        items: [notification, ...old.items],
      }
    })

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    })

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
      })
    }
  })

  // Unread count updates
  socket.on('notification', (notification) => {
    if (!notification.read) {
      queryClient.setQueryData(['notifications', 'unreadCount'], (old: number = 0) => old + 1)
    }
  })

  // Post updates
  socket.on('post:updated', (post) => {
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
  socket.on('comment:created', (comment) => {
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

  // Message updates
  socket.on('message:received', (message) => {
    queryClient.setQueryData(
      ['messages', message.conversationId],
      (old: any) => {
        if (!old) return { items: [message], nextCursor: null, hasMore: false }
        return {
          ...old,
          items: [...old.items, message],
        }
      }
    )
    
    // Update conversation list
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
  })
}

// Specialized hooks for specific features

export function usePresence() {
  const { emit, on, off } = useSocket()
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy', location?: string) => {
    emit('presence:update', { status, location })
  }, [emit])

  useEffect(() => {
    const handleUserOnline = (userId: string) => {
      setOnlineUsers(prev => new Set(prev).add(userId))
    }

    const handleUserOffline = (userId: string) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }

    const unsubOnline = on('user:online', handleUserOnline)
    const unsubOffline = on('user:offline', handleUserOffline)

    // Send heartbeat every 4 minutes
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000)

    return () => {
      unsubOnline()
      unsubOffline()
      clearInterval(interval)
    }
  }, [on, off, emit, updatePresence])

  return { 
    updatePresence,
    onlineUsers: Array.from(onlineUsers),
    isUserOnline: (userId: string) => onlineUsers.has(userId)
  }
}

export function useTypingIndicator(channelId: string, channelType: string = 'conversation') {
  const { emit, on, off } = useSocket()
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string }>>(new Map())
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleUserTyping = ({ userId, username, channelId: eventChannelId }: any) => {
      if (eventChannelId === channelId) {
        setTypingUsers(prev => new Map(prev).set(userId, { username }))
      }
    }

    const handleUserStoppedTyping = ({ userId, channelId: eventChannelId }: any) => {
      if (eventChannelId === channelId) {
        setTypingUsers(prev => {
          const updated = new Map(prev)
          updated.delete(userId)
          return updated
        })
      }
    }

    const unsubscribeTyping = on('user:typing', handleUserTyping)
    const unsubscribeStoppedTyping = on('user:typing', handleUserStoppedTyping)

    return () => {
      unsubscribeTyping()
      unsubscribeStoppedTyping()
    }
  }, [on, channelId])

  const startTyping = useCallback(() => {
    emit('typing:start', { channelId, channelType })

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing:stop', { channelId, channelType })
    }, 3000)
  }, [emit, channelId, channelType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    emit('typing:stop', { channelId, channelType })
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
    emit('subscribe:post', postId)

    // Set up specific handlers for this post
    const handleReaction = (data: any) => {
      if (data.entityType === 'post' && data.entityId === postId) {
        queryClient.setQueryData(['post', postId, 'reactions'], data.counts)
      }
    }

    const handleComment = (comment: any) => {
      if (comment.postId === postId) {
        queryClient.setQueryData(
          ['comments', postId],
          (old: any) => {
            if (!old) return { items: [comment], nextCursor: null }
            return {
              ...old,
              items: [comment, ...old.items],
            }
          }
        )
      }
    }

    const handlePostUpdate = (post: any) => {
      if (post.id === postId) {
        queryClient.setQueryData(['post', postId], post)
      }
    }

    const unsubReaction = on('post:liked', handleReaction)
    const unsubComment = on('comment:created', handleComment)
    const unsubUpdate = on('post:updated', handlePostUpdate)

    return () => {
      emit('unsubscribe:post', postId)
      unsubReaction()
      unsubComment()
      unsubUpdate()
    }
  }, [postId, isConnected, emit, on, queryClient])
}

export function useWatchParty(partyId: string) {
  const { emit, on, isConnected } = useSocket()
  const [syncState, setSyncState] = useState({
    position: 0,
    playing: false,
    timestamp: Date.now()
  })
  const [chatMessages, setChatMessages] = useState<WatchPartyChat[]>([])

  useEffect(() => {
    if (!isConnected || !partyId) return

    // Join watch party
    emit('watchParty:join', partyId)

    // Handle sync updates
    const handleSync = (data: any) => {
      if (data.partyId === partyId) {
        setSyncState({
          position: data.position,
          playing: data.playing,
          timestamp: data.timestamp
        })
      }
    }

    // Handle chat messages
    const handleChat = (message: WatchPartyChat) => {
      if (message.partyId === partyId) {
        setChatMessages(prev => [...prev, message])
      }
    }

    const unsubSync = on('watchParty:sync', handleSync)
    const unsubChat = on('watchParty:message', handleChat)

    return () => {
      emit('watchParty:leave', partyId)
      unsubSync()
      unsubChat()
    }
  }, [partyId, isConnected, emit, on])

  const sendChat = useCallback((message: string) => {
    emit('watchParty:chat', message)
  }, [emit])

  const syncPlayback = useCallback((position: number, playing: boolean) => {
    emit('watchParty:sync', { position, playing })
  }, [emit])

  return {
    syncState,
    chatMessages,
    sendChat,
    syncPlayback
  }
}

// Singleton hook for app-wide socket
let globalSocket: ReturnType<typeof useSocket> | null = null

export function useGlobalSocket() {
  if (!globalSocket) {
    globalSocket = useSocket({ autoConnect: true })
  }
  return globalSocket
}

export default useSocket
