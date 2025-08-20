// src/components/ui/popover.tsx
'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

/**
 * Popover Root Component
 */
const Popover = PopoverPrimitive.Root

/**
 * Popover Trigger Component
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Popover Anchor Component for custom positioning
 */
const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * Popover Close Component for programmatic closing
 */
const PopoverClose = PopoverPrimitive.Close

/**
 * Popover Content Component with animations and styling
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ 
  className, 
  align = 'center', 
  sideOffset = 4,
  collisionPadding = 8,
  ...props 
}, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(
        'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/**
 * Popover Arrow Component for visual connection to trigger
 */
const PopoverArrow = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Arrow
    ref={ref}
    className={cn('fill-popover', className)}
    {...props}
  />
))
PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName

/**
 * Custom hook for controlling Popover programmatically
 */
export function usePopover() {
  const [open, setOpen] = React.useState(false)

  return {
    open,
    onOpenChange: setOpen,
    setOpen,
    close: () => setOpen(false),
    toggle: () => setOpen((prev) => !prev),
  }
}

/**
 * Compound Popover component for common use cases
 */
interface SimplePopoverProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export function SimplePopover({
  trigger,
  children,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  className,
  open,
  onOpenChange,
  modal = false,
}: SimplePopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={modal}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export { 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverAnchor,
  PopoverClose,
  PopoverArrow 
}
