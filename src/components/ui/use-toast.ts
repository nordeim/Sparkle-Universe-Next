// src/components/ui/use-toast.ts
import * as React from 'react'
import { toast as sonnerToast, ExternalToast } from 'sonner'

/**
 * Toast configuration types
 */
export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Toast state management
 */
interface ToastState {
  toasts: Array<{
    id: string
    title?: string
    description?: string
    variant?: ToastProps['variant']
  }>
}

/**
 * Convert variant to sonner toast type
 */
function getToastType(variant?: ToastProps['variant']) {
  switch (variant) {
    case 'destructive':
      return 'error'
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'message'
  }
}

/**
 * Main toast hook with sonner integration
 */
export function useToast() {
  const [state, setState] = React.useState<ToastState>({
    toasts: [],
  })

  const toast = React.useCallback((props: ToastProps) => {
    const { title, description, variant, duration = 5000, action } = props
    const id = Math.random().toString(36).substr(2, 9)

    // Add to local state for tracking
    setState((prev) => ({
      toasts: [...prev.toasts, { id, title, description, variant }],
    }))

    // Create sonner options
    const sonnerOptions: ExternalToast = {
      duration,
      id,
      action: action ? {
        label: action.label,
        onClick: () => {
          action.onClick()
          sonnerToast.dismiss(id)
        }
      } : undefined,
    }

    // Format message for sonner
    const message = title || description || 'Notification'
    const descriptionText = title && description ? description : undefined

    // Show toast based on variant
    const toastType = getToastType(variant)
    switch (toastType) {
      case 'error':
        sonnerToast.error(message, {
          ...sonnerOptions,
          description: descriptionText,
        })
        break
      case 'success':
        sonnerToast.success(message, {
          ...sonnerOptions,
          description: descriptionText,
        })
        break
      case 'warning':
        sonnerToast.warning(message, {
          ...sonnerOptions,
          description: descriptionText,
        })
        break
      case 'info':
        sonnerToast.info(message, {
          ...sonnerOptions,
          description: descriptionText,
        })
        break
      default:
        sonnerToast(message, {
          ...sonnerOptions,
          description: descriptionText,
        })
    }

    // Auto-remove from state after duration
    setTimeout(() => {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== id),
      }))
    }, duration)

    return id
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      sonnerToast.dismiss(toastId)
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== toastId),
      }))
    } else {
      sonnerToast.dismiss()
      setState({ toasts: [] })
    }
  }, [])

  const success = React.useCallback((message: string, description?: string) => {
    return toast({
      title: message,
      description,
      variant: 'success',
    })
  }, [toast])

  const error = React.useCallback((message: string, description?: string) => {
    return toast({
      title: message,
      description,
      variant: 'destructive',
    })
  }, [toast])

  const warning = React.useCallback((message: string, description?: string) => {
    return toast({
      title: message,
      description,
      variant: 'warning',
    })
  }, [toast])

  const info = React.useCallback((message: string, description?: string) => {
    return toast({
      title: message,
      description,
      variant: 'info',
    })
  }, [toast])

  const promise = React.useCallback(
    <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => {
      return sonnerToast.promise(promise, {
        loading,
        success: (data) => typeof success === 'function' ? success(data) : success,
        error: (err) => typeof error === 'function' ? error(err) : error,
      })
    },
    []
  )

  return {
    toast,
    dismiss,
    success,
    error,
    warning,
    info,
    promise,
    toasts: state.toasts,
  }
}

/**
 * Export convenience toast functions
 */
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description })
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description })
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description })
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description })
  },
  message: (message: string, description?: string) => {
    sonnerToast(message, { description })
  },
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
}
