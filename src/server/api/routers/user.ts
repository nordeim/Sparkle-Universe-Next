// src/server/api/routers/user.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure,
  protectedProcedure 
} from '@/server/api/trpc'

export const userRouter = createTRPCRouter({
  // ... existing endpoints ...

  /**
   * Search users for mentions
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(20).default(5),
      excludeIds: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { query, limit, excludeIds = [] } = input

      // Search users by username or display name
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  username: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  profile: {
                    displayName: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
            {
              id: {
                notIn: excludeIds,
              },
            },
            {
              status: 'ACTIVE',
            },
            {
              deleted: false,
            },
          ],
        },
        select: {
          id: true,
          username: true,
          image: true,
          verified: true,
          role: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
        take: limit,
        orderBy: [
          {
            verified: 'desc', // Verified users first
          },
          {
            followers: {
              _count: 'desc', // Most followed users first
            },
          },
        ],
      })

      return users
    }),

  // ... rest of user router endpoints ...
})
