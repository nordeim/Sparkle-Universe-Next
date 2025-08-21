// src/lib/db.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/monitoring'

// Global type augmentation for PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * Creates an extended Prisma client with middleware-like functionality
 * Compatible with Prisma 5.x/6.x using the extensions API
 */
function createPrismaClient() {
  const prismaBase = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'info' },
        ]
      : [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
    errorFormat: 'minimal',
  })

  // Models that support soft delete
  const SOFT_DELETE_MODELS = new Set([
    'User', 'Post', 'Comment', 'Group', 'Event',
    'Message', 'Notification', 'Achievement', 'Quest',
    'Reaction', 'Follow', 'Block', 'Report',
  ])

  // Models that support version control
  const VERSIONED_MODELS = new Set([
    'User', 'Post', 'UserBalance', 'Trade',
    'Profile', 'Group', 'Event', 'Quest',
    'Achievement', 'StoreItem',
  ])

  // Create extended client with all middleware functionality
  const prismaExtended = prismaBase.$extends({
    name: 'sparkle-universe-extensions',
    
    // Query extensions for middleware-like behavior
    query: {
      // Global query interceptor for all operations
      async $allOperations({ model, operation, args, query }) {
        const modelName = model?.toString()
        
        // SOFT DELETE LOGIC
        if (modelName && SOFT_DELETE_MODELS.has(modelName)) {
          // Convert delete to update with soft delete
          if (operation === 'delete') {
            const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1) as keyof typeof prismaBase
            const modelInstance = prismaBase[modelKey] as any
            
            if (modelInstance && typeof modelInstance.update === 'function') {
              return await modelInstance.update({
                ...args,
                data: {
                  deleted: true,
                  deletedAt: new Date(),
                  deletedBy: undefined, // Should be set by service layer
                }
              })
            }
          }
          
          if (operation === 'deleteMany') {
            const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1) as keyof typeof prismaBase
            const modelInstance = prismaBase[modelKey] as any
            
            if (modelInstance && typeof modelInstance.updateMany === 'function') {
              return await modelInstance.updateMany({
                ...args,
                data: {
                  deleted: true,
                  deletedAt: new Date(),
                }
              })
            }
          }
          
          // Filter out soft deleted records from queries
          if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
            args.where = {
              ...args.where,
              AND: [
                ...(Array.isArray(args.where?.AND) ? args.where.AND : []),
                {
                  OR: [
                    { deleted: false },
                    { deleted: null },
                  ]
                },
                { deletedAt: null }
              ]
            }
          }
        }
        
        // AUTOMATIC UPDATEDAT
        if ((operation === 'update' || operation === 'updateMany') && args.data) {
          args.data = {
            ...args.data,
            updatedAt: new Date(),
          }
        }
        
        // VERSION CONTROL (Optimistic Locking)
        if (modelName && VERSIONED_MODELS.has(modelName) && operation === 'update') {
          const { where, data } = args
          
          // Increment version on update
          if (data.version === undefined) {
            data.version = { increment: 1 }
          }
          
          // Add version check to where clause
          if (where?.version !== undefined) {
            const currentVersion = where.version
            delete where.version
            where.AND = [
              ...(Array.isArray(where.AND) ? where.AND : []),
              { version: currentVersion }
            ]
          }
        }
        
        // Execute the query with modified args
        try {
          const result = await query(args)
          
          // Check for optimistic lock failure
          if (operation === 'update' && result === null && args.where?.version !== undefined) {
            throw new Error('Optimistic lock error: Record was modified by another process')
          }
          
          return result
        } catch (error) {
          // Enhanced logging in development
          if (process.env.NODE_ENV === 'development') {
            logger.error(`Query error in ${modelName}.${operation}:`, {
              model: modelName,
              operation,
              error,
              args: JSON.stringify(args, null, 2)
            })
          }
          throw error
        }
      },
    },
    
    // Model extensions for additional functionality
    model: {
      $allModels: {
        // Find with deleted records included
        async findManyWithDeleted<T>(this: T, args?: any) {
          const context = Prisma.getExtensionContext(this) as any
          return await context.findMany({
            ...args,
            where: {
              ...args?.where,
              deleted: undefined,
              deletedAt: undefined,
            }
          })
        },
        
        // Permanently delete (hard delete)
        async hardDelete<T>(this: T, args: any) {
          const context = Prisma.getExtensionContext(this) as any
          const modelName = context._model || context._name || 'unknown'
          return await prismaBase.$queryRaw`
            DELETE FROM ${Prisma.sql([modelName.toLowerCase()])}
            WHERE id = ${args.where.id}
          `
        },

        // Count with deleted
        async countWithDeleted<T>(this: T, args?: any) {
          const context = Prisma.getExtensionContext(this) as any
          return await context.count({
            ...args,
            where: {
              ...args?.where,
              deleted: undefined,
              deletedAt: undefined,
            }
          })
        },
      },
    },
    
    // Result extensions for computed fields
    result: {
      user: {
        // Add computed field for display name
        displayName: {
          needs: { username: true, email: true },
          compute(user) {
            return user.username || user.email?.split('@')[0] || 'Anonymous'
          },
        },
      },
      post: {
        // Add computed field for reading time
        readingTime: {
          needs: { content: true },
          compute(post) {
            if (!post.content) return 0
            const wordsPerMinute = 200
            const wordCount = typeof post.content === 'string' 
              ? post.content.split(/\s+/).length
              : JSON.stringify(post.content).split(/\s+/).length
            return Math.ceil(wordCount / wordsPerMinute)
          },
        },
      },
    },
  })

  // Set up event listeners for logging (compatible with Prisma 5.x/6.x)
  if (process.env.NODE_ENV === 'development') {
    ;(prismaBase.$on as any)('query', (e: any) => {
      logger.debug('Query:', {
        query: e.query,
        params: e.params,
        duration: e.duration,
        timestamp: new Date().toISOString(),
      })
    })
  }

  // Error logging
  ;(prismaBase.$on as any)('error', (e: any) => {
    logger.error('Database error:', e)
  })

  // Warning logging
  ;(prismaBase.$on as any)('warn', (e: any) => {
    logger.warn('Database warning:', e.message)
  })

  return prismaExtended
}

// Create or reuse the Prisma client singleton
export const db = globalForPrisma.prisma ?? createPrismaClient()
export const prisma = db // Alias for compatibility

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

/**
 * Database error handler with specific error types
 */
export function handleDatabaseError(error: unknown): never {
  logger.error('Database error:', error)
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target as string[]
        throw new Error(`Duplicate value for ${target?.join(', ') || 'field'}`)
      }
      case 'P2025':
        throw new Error('Record not found')
      case 'P2003':
        throw new Error('Foreign key constraint failed')
      case 'P2014':
        throw new Error('Invalid ID provided')
      case 'P2016':
        throw new Error('Query interpretation error')
      case 'P2024':
        throw new Error('Timed out fetching a new connection from the pool')
      case 'P2034':
        throw new Error('Transaction failed due to a write conflict or deadlock')
      default:
        throw new Error(`Database error: ${error.message}`)
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error('Invalid data provided')
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new Error('Failed to initialize database connection')
  }
  
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    throw new Error('Database client crashed')
  }
  
  if (error instanceof Error) {
    throw error
  }
  
  throw new Error('An unknown database error occurred')
}

/**
 * Transaction helper with retry logic
 */
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
        ['P2034', 'P2024'].includes(error.code) &&
        attempt < maxRetries
      ) {
        // Exponential backoff with jitter
        const backoff = Math.pow(2, attempt) * 100 + Math.random() * 100
        await new Promise(resolve => setTimeout(resolve, backoff))
        
        logger.warn(`Transaction retry attempt ${attempt}/${maxRetries} after ${backoff}ms`)
        continue
      }
      
      throw error
    }
  }
  
  throw lastError || new Error('Transaction failed after maximum retries')
}

/**
 * Batch operations helper
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = []
  const totalBatches = Math.ceil(items.length / batchSize)
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1
    const batch = items.slice(i, i + batchSize)
    
    logger.debug(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`)
    
    try {
      const batchResults = await operation(batch)
      results.push(...batchResults)
    } catch (error) {
      logger.error(`Batch ${batchNumber} failed:`, error)
      throw error
    }
  }
  
  return results
}

/**
 * Connection health check
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    await db.$queryRaw`SELECT 1 as health_check`
    const latency = Date.now() - startTime
    
    return {
      connected: true,
      latency,
    }
  } catch (error) {
    logger.error('Database connection check failed:', error)
    
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await db.$disconnect()
    logger.info('Database connection closed gracefully')
  } catch (error) {
    logger.error('Error disconnecting database:', error)
    throw error
  }
}

// Export types for use in other modules
export type { Prisma }
export type ExtendedPrismaClient = typeof db
export type TransactionClient = Prisma.TransactionClient
