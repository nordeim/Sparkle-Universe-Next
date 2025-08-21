// src/lib/auth/auth.config.ts
import { NextAuthOptions, DefaultSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

// Extend the built-in session types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      username: string
      role: UserRole
      image: string | null
      email: string
    }
  }

  interface User {
    username: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: UserRole
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          },
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials')
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
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Check if user is banned
      const existingUser = await db.user.findUnique({
        where: { email: user.email! },
        select: { status: true },
      })

      if (existingUser?.status === 'BANNED') {
        return false
      }

      // For OAuth sign-ins, ensure username is unique
      if (account?.provider !== 'credentials') {
        const userWithUsername = await db.user.findUnique({
          where: { username: user.username },
        })

        if (userWithUsername && userWithUsername.email !== user.email) {
          // Generate a unique username
          user.username = user.username + Math.random().toString(36).slice(2, 6)
        }
      }

      return true
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }

      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
      }

      // Update user's last seen
      if (token.id) {
        await db.user.update({
          where: { id: token.id },
          data: { lastSeenAt: new Date() },
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
      if (isNewUser) {
        // Create default profile
        await db.profile.create({
          data: {
            userId: user.id!,
            displayName: user.name || user.username,
          },
        })

        // Send welcome notification
        await db.notification.create({
          data: {
            type: 'SYSTEM',
            userId: user.id!,
            title: 'Welcome to Sparkle Universe!',
            message: "We're excited to have you join our community. Start by completing your profile and making your first post!",
          },
        })
      }
    },
    async createUser({ user }) {
      console.log('New user created:', user.email)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
