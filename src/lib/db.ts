// src/lib/db.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/monitoring'

// Global type augmentation for PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

/**
 * Creates an extended Prisma client with middleware-like functionality
 * Compatible with Prisma 6.x using the extensions API
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
    'Message', 'Notification', 'Achievement', 'Quest'
  ])

  // Models that support version control
  const VERSIONED_MODELS = new Set([
    'User', 'Post', 'UserBalance', 'Trade', 
    'Profile', 'Group', 'Event'
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
            // Transform delete to update with soft delete fields
            const updatedArgs = {
              ...args,
              data: {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: undefined, // Should be set by the service layer with userId
              }
            }
            // Execute as update instead of delete
            return await prismaBase[modelName.charAt(0).toLowerCase() + modelName.slice(1) as keyof typeof prismaBase]
              .update(updatedArgs as any)
          }
          
          if (operation === 'deleteMany') {
            // Transform deleteMany to updateMany
            const updatedArgs = {
              ...args,
              data: {
                deleted: true,
                deletedAt: new Date(),
              }
            }
            return await prismaBase[modelName.charAt(0).toLowerCase() + modelName.slice(1) as keyof typeof prismaBase]
              .updateMany(updatedArgs as any)
          }
          
          // Filter out soft deleted records from queries
          if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
            args.where = {
              ...args.where,
              deleted: false,
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
          // Auto-increment version on update
          if (args.data && !args.data.version) {
            args.data.version = { increment: 1 }
          }
          
          // Add version check to where clause if provided
          if (args.where?.version !== undefined) {
            const currentVersion = args.where.version
            delete args.where.version
            args.where = {
              ...args.where,
              AND: [
                ...(Array.isArray(args.where.AND) ? args.where.AND : []),
                { version: currentVersion }
              ]
            }
          }
        }
        
        // Execute the query with modified args
        try {
          const result = await query(args)
          
          // Check for optimistic lock failure
          if (operation === 'update' && result === null && args.where?.AND) {
            throw new Error('Optimistic lock error: Record was modified by another process')
          }
          
          return result
        } catch (error) {
          // Log query errors with context
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
        // Add a method to find with deleted records included
        async findManyWithDeleted<T>(this: T, args?: any) {
          const context = Prisma.getExtensionContext(this) as any
          return await context.findMany({
            ...args,
            where: {
              ...args?.where,
              // Override the soft delete filter
              deleted: undefined,
            }
          })
        },
        
        // Add a method to permanently delete (hard delete)
        async hardDelete<T>(this: T, args: any) {
          const context = Prisma.getExtensionContext(this) as any
          // Use raw delete operation bypassing soft delete
          return await prismaBase.$queryRaw`
            DELETE FROM ${Prisma.sql([context._model.toLowerCase()])}
            WHERE id = ${args.where.id}
          `
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
            return user.username || user.email.split('@')[0]
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

  // Set up event listeners for logging (Prisma 6.x compatible)
  if (process.env.NODE_ENV === 'development') {
    ;(prismaBase.$on as any)('query', (e: any) => {
      logger.debug('Query:', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        timestamp: new Date().toISOString(),
      })
    })
  }

  // Error logging
  ;(prismaBase.$on as any)('error', (e: any) => {
    logger.error('Database error:', {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString(),
    })
  })

  // Warning logging
  ;(prismaBase.$on as any)('warn', (e: any) => {
    logger.warn('Database warning:', {
      message: e.message,
      timestamp: new Date().toISOString(),
    })
  })

  return prismaExtended
}

// Create or reuse the Prisma client singleton
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

/**
 * Enhanced database error handler with specific error types
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
 * Enhanced transaction helper with retry logic and deadlock handling
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
        isolationLevel: txOptions.isolationLevel || Prisma.TransactionIsolationLevel.ReadCommitted,
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw error
      }
      
      // Check if error is retryable (deadlock or timeout)
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
 * Batch operations helper for efficient bulk processing
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
 * Connection health check with detailed diagnostics
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
 * Graceful shutdown helper
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
