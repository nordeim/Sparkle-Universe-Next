// src/hooks/use-socket.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { toast } from './use-toast'

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
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    latency: 0,
  })

  const socketRef = useRef<Socket | null>(null)
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
    })

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

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error,
      }))

      if (error.message === 'Authentication required') {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to continue',
          variant: 'destructive',
        })
      }
    })

    socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
      
      if (error.message) {
        toast({
          title: 'Connection Error',
          description: error.message,
          variant: 'destructive',
        })
      }
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts')
      toast({
        title: 'Reconnected',
        description: 'Connection restored',
      })
    })

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnection attempt', attemptNumber)
      setState(prev => ({ ...prev, isConnecting: true }))
    })

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed')
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: new Error('Failed to reconnect'),
      }))
      
      toast({
        title: 'Connection Failed',
        description: 'Unable to establish connection. Please refresh the page.',
        variant: 'destructive',
      })
    })

    // Reattach existing event handlers
    eventHandlersRef.current.forEach((handlers, event) => {
      handlers.forEach(handler => {
        socket.on(event as any, handler as any)
      })
    })

    socketRef.current = socket
  }, [isAuthenticated, user?.id, reconnection, reconnectionAttempts, reconnectionDelay])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      stopLatencyCheck()
    }
  }, [])

  // Emit event
  const emit = useCallback((event: string, ...args: any[]) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, queuing event:', event)
      // Queue events to be sent when connected
      socketRef.current?.once('connect', () => {
        socketRef.current?.emit(event as any, ...args)
      })
      return
    }

    socketRef.current.emit(event as any, ...args)
  }, [])

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    // Store handler reference
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set())
    }
    eventHandlersRef.current.get(event)!.add(handler)

    // Attach to socket if connected
    if (socketRef.current) {
      socketRef.current.on(event as any, handler)
    }

    // Return cleanup function
    return () => {
      eventHandlersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event as any, handler)
    }
  }, [])

  // Subscribe to event (once)
  const once = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.once(event as any, handler)
    }
  }, [])

  // Remove event listener
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event as any, handler)
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
  const updatePresence = useCallback((status: 'online' | 'away' | 'busy') => {
    emit('presence:update', status)
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
        // Page is hidden, update presence to away
        updatePresence('away')
      } else {
        // Page is visible, update presence to online
        updatePresence('online')
        
        // Reconnect if disconnected
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

// Singleton hook for app-wide socket
let globalSocket: ReturnType<typeof useSocket> | null = null

export function useGlobalSocket() {
  if (!globalSocket) {
    globalSocket = useSocket({ autoConnect: true })
  }
  return globalSocket
}
