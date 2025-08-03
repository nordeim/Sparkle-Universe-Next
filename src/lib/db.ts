// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Middleware for soft deletes
db.$use(async (params, next) => {
  // Check for soft delete models
  if (params.model === 'User' || params.model === 'Post' || params.model === 'Comment') {
    if (params.action === 'delete') {
      // Change action to update
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
  }
  return next(params)
})

// Helper function to handle database errors
export function handleDatabaseError(error: unknown): never {
  console.error('Database error:', error)
  
  if (error instanceof Error) {
    // Handle specific Prisma errors
    if (error.message.includes('P2002')) {
      throw new Error('A record with this value already exists')
    }
    if (error.message.includes('P2025')) {
      throw new Error('Record not found')
    }
    throw error
  }
  
  throw new Error('An unknown database error occurred')
}

// Transaction helper
export async function transaction<T>(
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return db.$transaction(fn, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  })
}
