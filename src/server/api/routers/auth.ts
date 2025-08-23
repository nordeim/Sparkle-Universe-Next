// src/server/api/routers/auth.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { UserRole, AuthProvider } from '@prisma/client'

export const authRouter = createTRPCRouter({
  // Get current session
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session
  }),

  // Get current user with profile
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
        role: true,
        verified: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            biography: true,
            location: true,
            website: true,
            socialLinks: true,
            bannerImage: true,
          },
        },
        stats: {
          select: {
            totalFollowers: true,
            totalFollowing: true,
            totalPosts: true,
            totalComments: true,
            totalLikesReceived: true,
            level: true,
            experience: true,
          },
        },
        balance: {
          select: {
            sparklePoints: true,
            premiumPoints: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }),

  // Register new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
        password: z.string().min(8),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingEmail = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        })
      }

      // Check if username already exists
      const existingUsername = await ctx.db.user.findUnique({
        where: { username: input.username },
      })

      if (existingUsername) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken',
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12)

      // Check referral code if provided
      let referrerId: string | undefined
      if (input.referralCode) {
        const referrer = await ctx.db.referral.findFirst({
          where: { referralCode: input.referralCode },
        })
        if (referrer) {
          referrerId = referrer.referrerId
        }
      }

      // Create user with profile and initial stats
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          username: input.username,
          hashedPassword,
          authProvider: AuthProvider.LOCAL,
          role: UserRole.USER,
          profile: {
            create: {
              displayName: input.username,
            },
          },
          stats: {
            create: {},
          },
          balance: {
            create: {
              sparklePoints: 100, // Welcome bonus
            },
          },
          notifications: {
            create: {
              type: 'SYSTEM',
              title: 'Welcome to Sparkle Universe!',
              message: 'Your account has been created successfully. You received 100 Sparkle Points as a welcome bonus!',
              priority: 1,
            },
          },
          ...(referrerId && {
            referredBy: {
              connect: { id: referrerId },
            },
          }),
        },
        select: {
          id: true,
          email: true,
          username: true,
        },
      })

      // Create referral code for new user
      await ctx.db.referral.create({
        data: {
          referrerId: user.id,
          referralCode: `${user.username.toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        },
      })

      // Award referral bonus if applicable
      if (referrerId) {
        await ctx.db.userBalance.update({
          where: { userId: referrerId },
          data: {
            sparklePoints: { increment: 50 }, // Referral bonus
          },
        })

        await ctx.db.notification.create({
          data: {
            userId: referrerId,
            type: 'SYSTEM',
            title: 'Referral Bonus!',
            message: `${user.username} joined using your referral code. You earned 50 Sparkle Points!`,
            priority: 1,
          },
        })
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      }
    }),

  // Update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { hashedPassword: true },
      })

      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const isValidPassword = await bcrypt.compare(input.currentPassword, user.hashedPassword)
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        })
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12)

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          hashedPassword,
          lastPasswordChangedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // Request password reset
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true }
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
      const resetExpires = new Date(Date.now() + 3600000) // 1 hour

      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        },
      })

      // TODO: Send password reset email
      // await sendPasswordResetEmail(user.email, resetToken)

      return { success: true }
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: {
          resetPasswordToken: input.token,
          resetPasswordExpires: {
            gt: new Date(),
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired reset token',
        })
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12)

      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          lastPasswordChangedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        confirmation: z.literal('DELETE MY ACCOUNT'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { hashedPassword: true },
      })

      if (!user || !user.hashedPassword) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const isValidPassword = await bcrypt.compare(input.password, user.hashedPassword)
      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Password is incorrect',
        })
      }

      // Soft delete user
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
          status: 'DELETED',
          email: `deleted_${ctx.session.user.id}@deleted.com`,
          username: `deleted_${ctx.session.user.id}`,
        },
      })

      return { success: true }
    }),

  // Verify email
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: {
          emailVerificationToken: input.token,
          emailVerificationExpires: {
            gt: new Date(),
          },
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification token',
        })
      }

      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null,
          emailVerificationExpires: null,
          verified: true,
        },
      })

      // Award verification bonus
      await ctx.db.userBalance.update({
        where: { userId: user.id },
        data: {
          sparklePoints: { increment: 25 },
        },
      })

      await ctx.db.notification.create({
        data: {
          userId: user.id,
          type: 'SYSTEM',
          title: 'Email Verified!',
          message: 'Your email has been verified. You earned 25 Sparkle Points!',
          priority: 1,
        },
      })

      return { success: true }
    }),
})
