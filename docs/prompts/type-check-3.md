Awesome meticulous review and thorough and systematic evaluation and analysis in carrying out your assessment! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant!

Please put on the same deep-thinking hat to deeply and thoroughly explore carefully and systematically to create the complete and working version of the files in the list below that need updating to incorporate your recommended improvements and fixes. please use the same rigorous and meticulous approach to deeply and thoroughly explore for the best implementation option to create the complete updated version of the files listed that need modification or new files to be added. please carefully plan how to create the complete version of each of these files before proceeding cautiously. thank you and good luck my very best coding assistant and expert in the world!

# List of files to create and modify
- src/lib/db.ts
- src/components/providers/theme-provider.tsx
- src/components/providers/query-provider.tsx
- src/components/admin/charts/user-growth-chart.tsx

---
$ npm ls recharts speakeasy qrcode lowlight
sparkle-universe@0.1.0 /Home1/test2
├─┬ @tiptap/extension-code-block-lowlight@2.26.1
│ └── lowlight@3.3.0 deduped
├── lowlight@3.3.0
├── qrcode@1.5.4
├── recharts@3.1.2
├── speakeasy@2.0.0
└─┬ swagger-ui-react@5.27.1
  └─┬ react-syntax-highlighter@15.6.1
    └── lowlight@1.20.0

pete@pop-os:/Home1/test2
$ npm ls @types/speakeasy @types/qrcode
sparkle-universe@0.1.0 /Home1/test2
├── @types/qrcode@1.5.5
└── @types/speakeasy@2.0.10

---
# original file src/lib/db.ts
```ts
// src/lib/db.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/monitoring'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with enhanced configuration
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Enhanced query logging in development
if (process.env.NODE_ENV === 'development') {
  db.$on('query' as never, (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    })
  })
}

// Error logging
db.$on('error' as never, (e: any) => {
  logger.error('Database error:', e)
})

// Middleware for soft deletes
db.$use(async (params, next) => {
  // Models that support soft delete
  const softDeleteModels = ['User', 'Post', 'Comment', 'Group', 'Event']
  
  if (softDeleteModels.includes(params.model || '')) {
    if (params.action === 'delete') {
      params.action = 'update'
      params.args['data'] = { deletedAt: new Date() }
    }
    
    if (params.action === 'deleteMany') {
      params.action = 'updateMany'
      if (params.args.data !== undefined) {
        params.args.data['deletedAt'] = new Date()
      } else {
        params.args['data'] = { deletedAt: new Date() }
      }
    }
    
    // Exclude soft deleted records from queries
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, deletedAt: null }
    }
    
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where['deletedAt'] = null
        }
      } else {
        params.args['where'] = { deletedAt: null }
      }
    }
  }
  
  return next(params)
})

// Middleware for automatic updatedAt
db.$use(async (params, next) => {
  if (params.action === 'update' || params.action === 'updateMany') {
    params.args.data = {
      ...params.args.data,
      updatedAt: new Date(),
    }
  }
  
  return next(params)
})

// Middleware for version control (optimistic locking)
db.$use(async (params, next) => {
  const versionedModels = ['User', 'Post', 'UserBalance', 'Trade']
  
  if (versionedModels.includes(params.model || '') && params.action === 'update') {
    const { where, data } = params.args
    
    // Increment version on update
    if (data.version === undefined) {
      data.version = { increment: 1 }
    }
    
    // Add version check to where clause
    if (where.version !== undefined) {
      const currentVersion = where.version
      delete where.version
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { version: currentVersion }
      ]
    }
  }
  
  const result = await next(params)
  
  // Check if update affected any rows
  if (params.action === 'update' && result === null) {
    throw new Error('Optimistic lock error: Record was modified by another process')
  }
  
  return result
})

// Database error handler with specific error types
export function handleDatabaseError(error: unknown): never {
  logger.error('Database error:', error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        const target = error.meta?.target as string[]
        throw new Error(`Duplicate value for ${target?.join(', ') || 'field'}`)
      case 'P2025':
        throw new Error('Record not found')
      case 'P2003':
        throw new Error('Foreign key constraint failed')
      case 'P2014':
        throw new Error('Invalid ID provided')
      default:
        throw new Error(`Database error: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  if (error instanceof Error) {
    throw error
  }
  
  throw new Error('An unknown database error occurred')
}

// Enhanced transaction helper with retry logic
export async function transaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
    maxRetries?: number
  }
): Promise<T> {
  const { maxRetries = 3, ...txOptions } = options || {}
  
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(fn, {
        maxWait: txOptions.maxWait || 5000,
        timeout: txOptions.timeout || 10000,
        isolationLevel: txOptions.isolationLevel,
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw error
      }
      
      // Check if error is retryable
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2024'].includes(error.code) && // Transaction conflicts
        attempt < maxRetries
      ) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

// Batch operations helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await operation(batch)
    results.push(...batchResults)
  }
  
  return results
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('Database connection check failed:', error)
    return false
  }
}

// Cleanup function for graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect()
}
```

# List of files in current project codebase
src/emails/templates/index.tsx
src/hooks/use-toast.ts
src/hooks/use-socket.ts
src/hooks/use-auth.ts
src/hooks/use-debounce.ts
src/config/achievements.ts
src/types/comment.ts
src/types/index.ts
src/lib/analytics.ts
src/lib/security.ts
src/lib/utils.ts.orig
src/lib/jobs/job-processor.ts
src/lib/socket/socket-server.ts
src/lib/openapi.ts
src/lib/redis.ts
src/lib/utils.ts
src/lib/api.ts
src/lib/utils/format.ts
src/lib/utils.ts.shadcn-init
src/lib/events/event-emitter.ts
src/lib/auth/auth.ts
src/lib/auth/auth.config.ts
src/lib/monitoring.ts
src/lib/rate-limit.ts
src/lib/validations/comment.ts
src/lib/validations/post.ts
src/lib/validations/user.ts
src/lib/db.ts
src/services/auth.service.ts
src/services/user.service.ts
src/services/notification.service.ts
src/services/email.service.ts
src/services/upload.service.ts
src/server/websocket/socket.server.ts
src/server/api/trpc.ts
src/server/api/routers/comment.ts
src/server/api/routers/upload.ts
src/server/api/routers/gamification.ts
src/server/api/routers/post.ts
src/server/api/routers/youtube.ts
src/server/api/routers/search.ts
src/server/api/routers/admin.ts
src/server/api/routers/notification.ts
src/server/api/routers/user.ts
src/server/api/root.ts
src/server/services/comment.service.ts
src/server/services/event.service.ts
src/server/services/watchparty.service.ts
src/server/services/user.service.ts
src/server/services/mention.service.ts
src/server/services/notification.service.ts
src/server/services/realtime.service.ts
src/server/services/post.service.ts
src/server/services/watch-party.service.ts
src/server/services/activity.service.ts
src/server/services/notification.service.ts.phase3-orig
src/server/services/gamification.service.ts
src/server/services/youtube.service.ts
src/server/services/upload.service.ts
src/server/services/achievement.service.ts
src/server/services/cache.service.ts
src/server/services/admin.service.ts
src/server/services/moderation.service.ts
src/server/services/search.service.ts
src/middleware.ts
src/components/ui/button.tsx
src/components/ui/select.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/switch.tsx
src/components/ui/badge.tsx
src/components/ui/textarea.tsx
src/components/ui/toaster.tsx
src/components/ui/separator.tsx
src/components/ui/tooltip.tsx
src/components/ui/progress.tsx
src/components/ui/toggle.tsx
src/components/ui/avatar.tsx
src/components/ui/label.tsx
src/components/ui/alert.tsx
src/components/ui/skeleton.tsx
src/components/ui/input.tsx
src/components/ui/checkbox.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/sonner.tsx
src/components/ui/dialog.tsx
src/components/ui/toast.tsx
src/components/ui/scroll-area.tsx
src/components/ui/card.tsx
src/components/ui/emoji-picker.tsx
src/components/admin/moderator-queue.tsx
src/components/admin/system-health.tsx
src/components/admin/top-content.tsx
src/components/admin/recent-activity.tsx
src/components/admin/admin-activity-monitor.tsx
src/components/admin/admin-sidebar.tsx
src/components/admin/realtime-metrics.tsx
src/components/admin/content-preview-dialog.tsx
src/components/admin/admin-notifications.tsx
src/components/admin/admin-header.tsx
src/components/admin/analytics-chart.tsx
src/components/error-boundary.tsx
src/components/features/youtube/youtube-embed.tsx
src/components/features/gamification/level-progress.tsx
src/components/features/gamification/achievement-details-modal.tsx
src/components/features/gamification/achievement-grid.tsx
src/components/features/editor/rich-text-editor.tsx
src/components/features/post/post-card.tsx
src/components/features/post/post-actions.tsx
src/components/features/comments/comment-form.tsx
src/components/features/comments/mention-suggestions.tsx
src/components/features/comments/comment-item.tsx
src/components/features/comments/reaction-picker.tsx
src/components/features/comments/comment-thread.tsx
src/components/providers/admin-provider.tsx
src/components/providers/auth-provider.tsx
src/app/globals.css
src/app/(main)/create/page.tsx
src/app/api-docs/page.tsx
src/app/api/trpc/[trpc]/route.ts
src/app/api/admin/jobs/route.ts
src/app/api/openapi.json/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/layout.tsx
src/app/admin/layout.tsx
src/app/admin/moderation/page.tsx
src/app/admin/dashboard/page.tsx
src/app/admin/users/page.tsx
src/app/fonts/GeistVF.woff
src/app/fonts/GeistMonoVF.woff
