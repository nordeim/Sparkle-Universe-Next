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
