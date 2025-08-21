// src/server/api/root.ts
import { createTRPCRouter, createCallerFactory } from '@/server/api/trpc'
import { userRouter } from '@/server/api/routers/user'
import { postRouter } from '@/server/api/routers/post'
import { authRouter } from '@/server/api/routers/auth'
import { commentRouter } from '@/server/api/routers/comment'
import { notificationRouter } from '@/server/api/routers/notification'
import { searchRouter } from '@/server/api/routers/search'
import { youtubeRouter } from '@/server/api/routers/youtube'
import { analyticsRouter } from '@/server/api/routers/analytics'
import { uploadRouter } from '@/server/api/routers/upload'
import { adminRouter } from '@/server/api/routers/admin'
import { gamificationRouter } from '@/server/api/routers/gamification'
import { socialRouter } from '@/server/api/routers/social'
import { messageRouter } from '@/server/api/routers/message'
import { groupRouter } from '@/server/api/routers/group'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
  notification: notificationRouter,
  search: searchRouter,
  youtube: youtubeRouter,
  analytics: analyticsRouter,
  upload: uploadRouter,
  admin: adminRouter,
  gamification: gamificationRouter,
  social: socialRouter,
  message: messageRouter,
  group: groupRouter,
})

// Export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)

// Type helpers
export type RouterInput<
  TRouter extends keyof AppRouter['_def']['procedures']
> = AppRouter['_def']['procedures'][TRouter]['_def']['$types']['input']

export type RouterOutput<
  TRouter extends keyof AppRouter['_def']['procedures']
> = AppRouter['_def']['procedures'][TRouter]['_def']['$types']['output']
