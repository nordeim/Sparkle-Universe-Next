// src/lib/auth/auth.config.ts
import { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { logger } from '@/lib/monitoring'

// Module augmentation for NextAuth types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      username: string
      role: UserRole
      image: string | null
      email: string
      level?: number
      sparklePoints?: number
      premiumPoints?: number
    }
  }

  interface User {
    id: string
    username: string
    role: UserRole
    email: string
    image?: string | null
    level?: number
    sparklePoints?: number
    premiumPoints?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
    email: string
    level?: number
  }
}

declare module '@auth/prisma-adapter' {
  interface AdapterUser {
    id: string
    email: string
    username: string
    role: UserRole
    image?: string | null
  }
}

// Fix adapter type compatibility
const prismaAdapter = PrismaAdapter(db as any) as any

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/welcome',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split('@')[0] + Math.random().toString(36).slice(2, 6),
          role: 'USER' as UserRole,
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
          role: 'USER' as UserRole,
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            username: true,
            hashedPassword: true,
            role: true,
            image: true,
            status: true,
            emailVerified: true,
            level: true,
            sparklePoints: true,
            premiumPoints: true,
            failedLoginAttempts: true,
            accountLockedUntil: true,
          },
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials')
        }

        // Check account lockout
        if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
          throw new Error('Account temporarily locked. Please try again later.')
        }

        if (user.status === 'BANNED') {
          throw new Error('Account banned')
        }

        if (user.status === 'SUSPENDED') {
          throw new Error('Account suspended')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          // Increment failed login attempts
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lastFailedLoginAt: new Date(),
              // Lock account after 5 failed attempts
              accountLockedUntil: user.failedLoginAttempts >= 4 
                ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
                : null,
            },
          })
          throw new Error('Invalid credentials')
        }

        // Reset failed login attempts on successful login
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastFailedLoginAt: null,
            accountLockedUntil: null,
          },
        })

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          image: user.image,
          level: user.level,
          sparklePoints: user.sparklePoints,
          premiumPoints: user.premiumPoints,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Check if user is banned
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { status: true, id: true },
        })

        if (existingUser?.status === 'BANNED') {
          return false
        }

        // For OAuth sign-ins, ensure username is unique
        if (account && account.provider !== 'credentials') {
          const userWithUsername = await db.user.findUnique({
            where: { username: user.username },
          })

          if (userWithUsername && userWithUsername.email !== user.email) {
            // Generate a unique username
            user.username = user.username + Math.random().toString(36).slice(2, 6)
          }

          // Update or create OAuth account
          if (existingUser) {
            await db.account.upsert({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
              update: {
                accessToken: account.access_token,
                expiresAt: account.expires_at,
                refreshToken: account.refresh_token,
                idToken: account.id_token,
                tokenType: account.token_type,
                scope: account.scope,
                sessionState: account.session_state,
              },
              create: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refreshToken: account.refresh_token,
                accessToken: account.access_token,
                expiresAt: account.expires_at,
                tokenType: account.token_type,
                scope: account.scope,
                idToken: account.id_token,
                sessionState: account.session_state,
              },
            })
          }
        }

        return true
      } catch (error) {
        logger.error('Sign in error:', error)
        return false
      }
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.email = token.email
        session.user.level = token.level
      }

      // Fetch fresh user data for important fields
      if (session.user.id) {
        const userData = await db.user.findUnique({
          where: { id: session.user.id },
          select: {
            sparklePoints: true,
            premiumPoints: true,
            level: true,
            image: true,
          },
        })

        if (userData) {
          session.user.sparklePoints = userData.sparklePoints
          session.user.premiumPoints = userData.premiumPoints
          session.user.level = userData.level
          session.user.image = userData.image
        }
      }

      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.email = user.email
        token.level = user.level
      }

      // Update user's last seen
      if (token.id) {
        await db.user.update({
          where: { id: token.id },
          data: { 
            lastSeenAt: new Date(),
            onlineStatus: 'ONLINE',
          },
        }).catch(() => {
          // Silently fail - this is not critical
        })
      }

      return token
    },
    redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      logger.info('User signed in:', { userId: user.id, isNewUser })
      
      if (isNewUser && user.id) {
        // Create default profile
        await db.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            displayName: user.name || user.username,
          },
        })

        // Create user stats
        await db.userStats.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        })

        // Send welcome notification
        await db.notification.create({
          data: {
            type: 'SYSTEM',
            userId: user.id,
            title: 'Welcome to Sparkle Universe!',
            message: "We're excited to have you join our community. Start by completing your profile and making your first post!",
            priority: 1,
          },
        })

        // Award welcome achievement
        await db.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: 'welcome', // Assuming this achievement exists
            unlockedAt: new Date(),
            progress: 1,
          },
        }).catch(() => {
          // Achievement might not exist yet
        })
      }

      // Log login history
      if (user.id) {
        await db.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress: '', // Would need to get from request context
            userAgent: '', // Would need to get from request context
            success: true,
          },
        }).catch(() => {
          // Non-critical
        })
      }
    },
    async signOut({ session, token }) {
      if (token?.id) {
        await db.user.update({
          where: { id: token.id },
          data: { onlineStatus: 'OFFLINE' },
        }).catch(() => {
          // Non-critical
        })
      }
      logger.info('User signed out:', { userId: token?.id })
    },
    async createUser({ user }) {
      logger.info('New user created:', { email: user.email, id: user.id })
    },
    async updateUser({ user }) {
      logger.info('User updated:', { id: user.id })
    },
    async linkAccount({ account, user, profile }) {
      logger.info('Account linked:', { 
        userId: user.id, 
        provider: account.provider 
      })
    },
    async session({ session, token }) {
      // Can be used for session tracking
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
