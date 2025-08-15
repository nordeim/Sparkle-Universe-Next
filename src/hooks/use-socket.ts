// src/hooks/use-socket.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'
import type { 
  Notification, 
  Post, 
  Comment, 
  Message,
  User,
  WatchPartyChat
} from '@prisma/client'

// Type-safe event definitions aligned with schema
interface ServerToClientEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  error: (error: { message: string; code?: string }) => void
  
  // Notification events
  notification: (notification: Notification) => void
  unreadCountUpdate: (count: number) => void
  
  // Post events
  postUpdated: (post: Post) => void
  postDeleted: (postId: string) => void
  
  // Comment events
  commentCreated: (comment: Comment & { author: User }) => void
  commentUpdated: (comment: Comment) => void
  commentDeleted: (commentId: string) => void
  
  // Reaction events
  reactionAdded: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reaction: string
    userId: string
    counts: Record<string, number>
  }) => void
  reactionRemoved: (data: {
    entityType: 'post' | 'comment'
    entityId: string
    reaction: string
    userId: string
    counts: Record<string, number>
  }) => void
  
  // Message events
  messageReceived: (message: Message) => void
  messageRead: (data: { messageId: string; userId: string }) => void
  conversationUpdated: (conversationId: string) => void
  
  // Typing indicators
  userTyping: (data: { 
    channelId: string
    channelType: string
    userId: string
    username: string 
  }) => void
  userStoppedTyping: (data: { 
    channelId: string
    channelType: string
    userId: string 
  }) => void
  
  // Presence events
  userOnline: (userId: string) => void
  userOffline: (userId: string) => void
  presenceUpdate: (data: {
    userId: string
    status: 'online' | 'away' | 'busy'
    location?: string
  }) => void
  
  // Watch party events
  watchPartyUpdate: (data: {
    partyId: string
    event: 'userJoined' | 'userLeft' | 'playbackSync' | 'chatMessage'
    payload: any
  }) => void
  watchPartyChat: (message: WatchPartyChat) => void
  watchPartySync: (data: {
    partyId: string
    position: number
    playing: boolean
    timestamp: number
  }) => void
  
  // Room events
  joinedRoom: (room: string) => void
  leftRoom: (room: string) => void
  roomUserCount: (data: { room: string; count: number }) => void
  
  // System events
  maintenanceMode: (enabled: boolean) => void
  announcement: (message: string) => void
}

interface ClientToServerEvents {
  // Presence
  updatePresence: (data: { status: string; location?: string }) => void
  
  // Typing
  startTyping: (data: { channelId: string; channelType: string }) => void
  stopTyping: (data: { channelId: string; channelType: string }) => void
  
  // Subscriptions
  subscribeToPost: (postId: string) => void
  unsubscribeFromPost: (postId: string) => void
  subscribeToConversation: (conversationId: string) => void
  unsubscribeFromConversation: (conversationId: string) => void
  
  // Watch party
  joinWatchParty: (partyId: string) => void
  leaveWatchParty: (partyId: string) => void
  sendWatchPartyChat: (data: { partyId: string; message: string }) => void
  syncWatchParty: (data: { 
    partyId: string
    position: number
    playing: boolean 
  }) => void
  
  // Rooms
  'join:room': (room: string) => void
  'leave:room': (room: string) => void
  
  // Ping for latency
  ping: (callback: () => void) => void
}

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

  const { user, isAuthenticated } = useAuth()
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
    if (!isAuthenticated || socketRef.current?.connected) {
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
        sessionId: user?.id,
      },
    }) as SocketInstance

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id)
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
      console.log('WebSocket disconnected:', reason)
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }))

      stopLatencyCheck()

      // Handle reconnection for specific disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        attemptReconnect()
      }
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: new Error(error.message),
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
        socket.on(event as keyof ServerToClientEvents, handler as any)
      })
    })

    socketRef.current = socket
  }, [isAuthenticated, user?.id, reconnection, reconnectionAttempts, reconnectionDelay, queryClient])

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
      // Queue events to be sent when connected
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit(event, ...args)
      })
      return
    }

    socketRef.current.emit(event, ...args)
  }, [])

  // Type-safe event subscription
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
      socketRef.current.on(event, handler)
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler as Function)
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Type-safe once subscription
  const once = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.once(event, handler)
    }
    
    return () => {
      socketRef.current?.off(event, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler as Function)
      socketRef.current?.off(event, handler)
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
    emit('updatePresence', { status, location })
  }, [emit])

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!socketRef.current?.connected && isAuthenticated) {
        console.log('Attempting to reconnect...')
        connect()
      }
    }, reconnectionDelay)
  }, [connect, isAuthenticated, reconnectionDelay])

  // Latency monitoring
  const startLatencyCheck = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const start = Date.now()
        
        socketRef.current.emit('ping', () => {
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
    if (autoConnect && isAuthenticated) {
      connect()
    }

    return () => {
      disconnect()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [autoConnect, isAuthenticated, connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away')
      } else {
        updatePresence('online')
        
        if (!socketRef.current?.connected && isAuthenticated) {
          attemptReconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updatePresence, attemptReconnect, isAuthenticated])

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

  // Message updates
  socket.on('messageReceived', (message) => {
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
    emit('updatePresence', { status, location })
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

    const unsubOnline = on('userOnline', handleUserOnline)
    const unsubOffline = on('userOffline', handleUserOffline)

    // Send heartbeat every 4 minutes
    const interval = setInterval(() => {
      updatePresence('online')
    }, 4 * 60 * 1000)

    return () => {
      unsubOnline()
      unsubOffline()
      clearInterval(interval)
    }
  }, [on, emit, updatePresence])

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

    const unsubReaction = on('reactionAdded', handleReaction)
    const unsubComment = on('commentCreated', handleComment)

    return () => {
      emit('unsubscribeFromPost', postId)
      unsubReaction()
      unsubComment()
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
    emit('joinWatchParty', partyId)

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

    const unsubSync = on('watchPartySync', handleSync)
    const unsubChat = on('watchPartyChat', handleChat)

    return () => {
      emit('leaveWatchParty', partyId)
      unsubSync()
      unsubChat()
    }
  }, [partyId, isConnected, emit, on])

  const sendChat = useCallback((message: string) => {
    emit('sendWatchPartyChat', { partyId, message })
  }, [emit, partyId])

  const syncPlayback = useCallback((position: number, playing: boolean) => {
    emit('syncWatchParty', { partyId, position, playing })
  }, [emit, partyId])

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
