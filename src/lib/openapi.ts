// src/lib/openapi.ts
import { OpenAPIV3 } from 'openapi-types'

export function generateOpenAPIDocument(): OpenAPIV3.Document {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Sparkle Universe API',
      version: '1.0.0',
      description: 'The next-generation community platform for Sparkle YouTube fans',
      contact: {
        name: 'Sparkle Universe Support',
        email: 'support@sparkle-universe.com',
        url: 'https://sparkle-universe.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Current environment',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Posts',
        description: 'Blog post endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
      {
        name: 'Upload',
        description: 'File upload endpoints',
      },
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@example.com',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new user',
          description: 'Create a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'username'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                    },
                    password: {
                      type: 'string',
                      format: 'password',
                      minLength: 8,
                    },
                    username: {
                      type: 'string',
                      minLength: 3,
                      maxLength: 30,
                      pattern: '^[a-zA-Z0-9_]+$',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' },
                },
              },
            },
          },
        },
      },
      '/api/users/{username}': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile',
          description: 'Get public user profile by username',
          parameters: [
            {
              name: 'username',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/UserProfile' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List posts',
          description: 'Get paginated list of posts',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: {
                type: 'integer',
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
                maximum: 100,
              },
            },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['recent', 'popular', 'trending'],
                default: 'recent',
              },
            },
            {
              name: 'category',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'tag',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of posts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Post' },
                          },
                          total: { type: 'integer' },
                          page: { type: 'integer' },
                          pageSize: { type: 'integer' },
                          totalPages: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Posts'],
          summary: 'Create post',
          description: 'Create a new blog post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: {
                      type: 'string',
                      maxLength: 255,
                    },
                    content: {
                      type: 'string',
                    },
                    excerpt: {
                      type: 'string',
                      maxLength: 500,
                    },
                    coverImage: {
                      type: 'string',
                      format: 'uri',
                    },
                    tags: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                    published: {
                      type: 'boolean',
                      default: false,
                    },
                    categoryId: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Post created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/posts/{id}': {
        get: {
          tags: ['Posts'],
          summary: 'Get post',
          description: 'Get a single post by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Post details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/PostDetail' },
                    },
                  },
                },
              },
            },
            '404': {
              description: 'Post not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Posts'],
          summary: 'Update post',
          description: 'Update an existing post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    excerpt: { type: 'string' },
                    coverImage: { type: 'string' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    published: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Post updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Posts'],
          summary: 'Delete post',
          description: 'Delete a post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '204': {
              description: 'Post deleted successfully',
            },
          },
        },
      },
      '/api/posts/{id}/comments': {
        get: {
          tags: ['Comments'],
          summary: 'Get post comments',
          description: 'Get comments for a post',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
            {
              name: 'cursor',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of comments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Comment' },
                          },
                          nextCursor: { type: 'string', nullable: true },
                          hasMore: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Comments'],
          summary: 'Create comment',
          description: 'Add a comment to a post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 5000,
                    },
                    parentId: {
                      type: 'string',
                      nullable: true,
                    },
                    youtubeTimestamp: {
                      type: 'integer',
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Comment created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Comment' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/upload/presigned-url': {
        post: {
          tags: ['Upload'],
          summary: 'Get presigned upload URL',
          description: 'Get a presigned URL for direct file upload to S3',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['filename', 'contentType', 'fileSize'],
                  properties: {
                    filename: {
                      type: 'string',
                    },
                    contentType: {
                      type: 'string',
                    },
                    fileSize: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Presigned URL generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          uploadUrl: { type: 'string' },
                          fileId: { type: 'string' },
                          key: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notifications',
          description: 'Get user notifications',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'cursor',
              in: 'query',
              schema: {
                type: 'string',
              },
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'integer',
                default: 20,
              },
            },
            {
              name: 'unreadOnly',
              in: 'query',
              schema: {
                type: 'boolean',
                default: false,
              },
            },
          ],
          responses: {
            '200': {
              description: 'List of notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Notification' },
                          },
                          nextCursor: { type: 'string', nullable: true },
                          hasMore: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          description: 'Mark a notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Notification marked as read',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            image: { type: 'string', nullable: true },
            role: {
              type: 'string',
              enum: ['USER', 'CREATOR', 'VERIFIED_CREATOR', 'MODERATOR', 'ADMIN'],
            },
            level: { type: 'integer' },
            experience: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfile: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                bio: { type: 'string', nullable: true },
                profile: {
                  type: 'object',
                  properties: {
                    displayName: { type: 'string' },
                    location: { type: 'string' },
                    website: { type: 'string' },
                    socialLinks: {
                      type: 'object',
                      properties: {
                        twitter: { type: 'string' },
                        instagram: { type: 'string' },
                        youtube: { type: 'string' },
                      },
                    },
                  },
                },
                stats: {
                  type: 'object',
                  properties: {
                    posts: { type: 'integer' },
                    followers: { type: 'integer' },
                    following: { type: 'integer' },
                  },
                },
              },
            },
          ],
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string', nullable: true },
            coverImage: { type: 'string', nullable: true },
            published: { type: 'boolean' },
            views: { type: 'integer' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            _count: {
              type: 'object',
              properties: {
                comments: { type: 'integer' },
                reactions: { type: 'integer' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        PostDetail: {
          allOf: [
            { $ref: '#/components/schemas/Post' },
            {
              type: 'object',
              properties: {
                content: { type: 'string' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                    },
                  },
                },
                category: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                  },
                },
              },
            },
          ],
        },
        Comment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            edited: { type: 'boolean' },
            youtubeTimestamp: { type: 'integer', nullable: true },
            author: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            _count: {
              type: 'object',
              properties: {
                reactions: { type: 'integer' },
                replies: { type: 'integer' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            editedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: [
                'POST_LIKED',
                'POST_COMMENTED',
                'COMMENT_LIKED',
                'USER_FOLLOWED',
                'ACHIEVEMENT_UNLOCKED',
                'LEVEL_UP',
                'MENTION',
                'SYSTEM',
              ],
            },
            title: { type: 'string' },
            message: { type: 'string' },
            read: { type: 'boolean' },
            actor: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                image: { type: 'string', nullable: true },
              },
            },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        ValidationError: {
          allOf: [
            { $ref: '#/components/schemas/Error' },
            {
              type: 'object',
              properties: {
                fields: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
              },
            },
          ],
        },
      },
    },
  }
}
