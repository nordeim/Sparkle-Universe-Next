// src/server/api/routers/upload.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure 
} from '@/server/api/trpc'
import { UploadService } from '@/server/services/upload.service'

export const uploadRouter = createTRPCRouter({
  // Get presigned upload URL
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
      uploadType: z.enum(['avatar', 'cover', 'post', 'comment']),
    }))
    .mutation(async ({ ctx, input }) => {
      const uploadService = new UploadService()
      return uploadService.getPresignedUploadUrl({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Delete file
  deleteFile: protectedProcedure
    .input(z.object({
      fileUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const uploadService = new UploadService()
      return uploadService.deleteFile({
        fileUrl: input.fileUrl,
        userId: ctx.session.user.id,
      })
    }),
})
