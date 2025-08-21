// src/server/api/routers/group.ts
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"
import { GroupVisibility, GroupMemberRole } from "@prisma/client"

export const groupRouter = createTRPCRouter({
  // Create a new group
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(50),
      description: z.string().max(500),
      visibility: z.nativeEnum(GroupVisibility).default('PUBLIC'),
      guidelines: z.string().optional(),
      tags: z.array(z.string()).max(5).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { name, description, visibility, guidelines, tags } = input

      // Check if group name already exists
      const existingGroup = await ctx.db.group.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
          deleted: false,
        },
      })

      if (existingGroup) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A group with this name already exists',
        })
      }

      // Create group with user as owner
      const group = await ctx.db.group.create({
        data: {
          name,
          description,
          visibility,
          guidelines: guidelines ? { text: guidelines } : undefined,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
              joinedAt: new Date(),
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      })

      return group
    }),

  // Get group by ID or slug
  get: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      slug: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!input.id && !input.slug) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either ID or slug is required',
        })
      }

      const group = await ctx.db.group.findFirst({
        where: {
          OR: [
            { id: input.id },
            { slug: input.slug },
          ],
          deleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              image: true,
              role: true,
            },
          },
          members: {
            where: {
              deleted: false,
            },
            take: 5,
            orderBy: {
              joinedAt: 'desc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
              events: true,
            },
          },
        },
      })

      if (!group) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        })
      }

      // Check if group is private and user is not a member
      if (group.visibility === 'PRIVATE' || group.visibility === 'HIDDEN') {
        const userId = ctx.session?.user?.id
        if (!userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This group is private',
          })
        }

        const isMember = await ctx.db.groupMember.findFirst({
          where: {
            groupId: group.id,
            userId,
            deleted: false,
          },
        })

        if (!isMember) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This group is private',
          })
        }
      }

      return group
    }),

  // Join a group
  join: protectedProcedure
    .input(z.object({
      groupId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { groupId } = input

      const group = await ctx.db.group.findUnique({
        where: { id: groupId },
      })

      if (!group || group.deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        })
      }

      // Check if already a member
      const existingMember = await ctx.db.groupMember.findFirst({
        where: {
          groupId,
          userId,
          deleted: false,
        },
      })

      if (existingMember) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already a member of this group',
        })
      }

      // Check group visibility
      if (group.visibility === 'INVITE_ONLY') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This group is invite-only',
        })
      }

      // Create membership
      const member = await ctx.db.groupMember.create({
        data: {
          groupId,
          userId,
          role: 'MEMBER',
          joinedAt: new Date(),
        },
      })

      // Create notification for group owner
      await ctx.db.notification.create({
        data: {
          userId: group.ownerId,
          type: 'SYSTEM',
          actorId: userId,
          entityId: groupId,
          entityType: 'group',
          title: 'New Member',
          message: `Someone joined your group "${group.name}"`,
        },
      })

      return member
    }),

  // Leave a group
  leave: protectedProcedure
    .input(z.object({
      groupId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const { groupId } = input

      const member = await ctx.db.groupMember.findFirst({
        where: {
          groupId,
          userId,
          deleted: false,
        },
      })

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not a member of this group',
        })
      }

      if (member.role === 'OWNER') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Group owner cannot leave the group. Transfer ownership first.',
        })
      }

      // Soft delete membership
      await ctx.db.groupMember.update({
        where: { id: member.id },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // Get group posts
  getPosts: publicProcedure
    .input(z.object({
      groupId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { groupId, limit, cursor } = input

      const posts = await ctx.db.groupPost.findMany({
        where: {
          groupId,
          deleted: false,
        },
        include: {
          post: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  role: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                  reactions: true,
                },
              },
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (posts.length > limit) {
        const nextItem = posts.pop()
        nextCursor = nextItem!.id
      }

      return {
        posts,
        nextCursor,
      }
    }),

  // Search groups
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { query, limit } = input

      const groups = await ctx.db.group.findMany({
        where: {
          deleted: false,
          visibility: { in: ['PUBLIC', 'PRIVATE'] }, // Don't show HIDDEN groups
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          visibility: true,
          image: true,
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
        take: limit,
        orderBy: {
          members: {
            _count: 'desc',
          },
        },
      })

      return groups
    }),
})
