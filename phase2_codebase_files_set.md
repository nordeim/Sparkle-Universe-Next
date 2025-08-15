# src/lib/rate-limit.ts
```ts
// src/lib/rate-limit.ts
import { redisUtils } from '@/lib/redis'

interface RateLimitConfig {
  requests: number
  window: number // in seconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { requests: 1000, window: 3600 },           // 1000 per hour
  auth: { requests: 5, window: 900 },              // 5 per 15 minutes
  post: { requests: 10, window: 3600 },            // 10 posts per hour
  comment: { requests: 30, window: 3600 },         // 30 comments per hour
  reaction: { requests: 100, window: 3600 },       // 100 reactions per hour
  upload: { requests: 20, window: 3600 },          // 20 uploads per hour
}

class RateLimiter {
  async limit(
    identifier: string,
    type: keyof typeof RATE_LIMITS = 'api'
  ): Promise<{ success: boolean; limit: number; remaining: number; reset: Date }> {
    const config = RATE_LIMITS[type]
    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    const count = await redisUtils.incrementWithExpiry(key, config.window)
    const remaining = Math.max(0, config.requests - count)
    const reset = new Date((window + 1) * config.window * 1000)
    
    return {
      success: count <= config.requests,
      limit: config.requests,
      remaining,
      reset,
    }
  }

  async reset(identifier: string, type: keyof typeof RATE_LIMITS = 'api'): Promise<void> {
    const config = RATE_LIMITS[type]
    const now = Date.now()
    const window = Math.floor(now / (config.window * 1000))
    const key = `ratelimit:${type}:${identifier}:${window}`
    
    await redis.del(key)
  }

  async isRateLimited(identifier: string, type: keyof typeof RATE_LIMITS = 'api'): Promise<boolean> {
    const result = await this.limit(identifier, type)
    return !result.success
  }
}

export const ratelimit = new RateLimiter()

```

# src/lib/redis.ts
```ts
// src/lib/redis.ts
import Redis from 'ioredis'
import { createAdapter } from '@socket.io/redis-adapter'

// Main Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

// Pub/Sub clients for Socket.IO adapter
export const pubClient = redis.duplicate()
export const subClient = redis.duplicate()

// Create Socket.IO adapter
export const createSocketAdapter = () => {
  return createAdapter(pubClient, subClient)
}

// Redis utilities
export const redisUtils = {
  // Cache operations with automatic JSON serialization
  async getJSON<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  },

  async setJSON<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value)
    if (ttl) {
      await redis.setex(key, ttl, serialized)
    } else {
      await redis.set(key, serialized)
    }
  },

  // Atomic increment with expiry
  async incrementWithExpiry(key: string, ttl: number): Promise<number> {
    const multi = redis.multi()
    multi.incr(key)
    multi.expire(key, ttl)
    const results = await multi.exec()
    return results?.[0]?.[1] as number || 0
  },

  // Leaderboard operations
  async addToLeaderboard(key: string, member: string, score: number): Promise<void> {
    await redis.zadd(key, score, member)
  },

  async getLeaderboard(key: string, limit: number = 10): Promise<Array<{member: string, score: number}>> {
    const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES')
    const leaderboard: Array<{member: string, score: number}> = []
    
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        member: results[i],
        score: parseFloat(results[i + 1]),
      })
    }
    
    return leaderboard
  },

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.setJSON(`session:${sessionId}`, data, ttl)
  },

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.getJSON<T>(`session:${sessionId}`)
  },

  // Rate limiting
  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `rate:${identifier}:${Math.floor(Date.now() / (window * 1000))}`
    const count = await this.incrementWithExpiry(key, window)
    return count <= limit
  },
}

// Connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err)
})

redis.on('ready', () => {
  console.log('✅ Redis ready')
})

export default redis

```

# src/lib/security.ts
```ts
// src/lib/security.ts
import crypto from 'crypto'
import DOMPurify from 'isomorphic-dompurify'
import bcrypt from 'bcryptjs'

// HTML sanitization for user-generated content
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'iframe', // For embeds
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'target', 'rel',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):)|^\/(?!\/)/,
    ADD_TAGS: ['iframe'], // For YouTube embeds
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate short codes (for things like party codes)
export function generateShortCode(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  const bytes = crypto.randomBytes(length)
  
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length]
  }
  
  return code
}

// Hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12')
  return bcrypt.hash(password, saltRounds)
}

// Verify passwords
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Encrypt sensitive data
export function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

// Decrypt sensitive data
export function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Generate CSRF tokens
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// Validate CSRF tokens
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  )
}

// Rate limit key generator
export function getRateLimitKey(identifier: string, action: string): string {
  const window = Math.floor(Date.now() / 60000) // 1-minute windows
  return `rate:${action}:${identifier}:${window}`
}

// IP address extraction
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  return '127.0.0.1'
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate username format
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

// Mask sensitive data for logging
export function maskSensitiveData(data: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'email']
  
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  const masked = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***REDACTED***'
    }
  }
  
  return masked
}

```

# src/lib/utils.ts
```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${path}`
}

export function generateUsername(email: string): string {
  const base = email.split('@')[0]
  const random = Math.random().toString(36).substring(2, 6)
  return `${base}${random}`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function extractExcerpt(content: string, maxLength: number = 160): string {
  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '')
  
  // Truncate to max length
  if (text.length <= maxLength) return text
  
  // Find the last complete word within the limit
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return truncated.substring(0, lastSpace) + '...'
}

export function calculateReadingTime(content: string): number {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225
  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  
  return Math.max(1, readingTime) // Minimum 1 minute
}

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`
  return `${(num / 1000000000).toFixed(1)}B`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function getInitials(name: string): string {
  const words = name.trim().split(' ')
  if (words.length === 0) return ''
  if (words.length === 1) return words[0][0].toUpperCase()
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function isServer() {
  return typeof window === 'undefined'
}

export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

```

# src/app/(main)/create/page.tsx
```tsx
// src/app/(main)/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createPostSchema, type CreatePostInput } from '@/lib/validations/post'
import { api } from '@/lib/api'
import { RichTextEditor } from '@/components/features/editor/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { YouTubeEmbed } from '@/components/features/youtube/youtube-embed'
import { toast } from '@/hooks/use-toast'
import { 
  Loader2, 
  Save, 
  Send,
  X,
  Plus,
  Eye,
  Youtube,
  Hash,
  FileText,
} from 'lucide-react'
import { extractYouTubeVideoId } from '@/lib/validations/post'

export default function CreatePostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      tags: [],
      isDraft: false,
    },
  })

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && !isSubmitting) {
        handleSaveDraft()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [form.formState.isDirty])

  // Get categories
  const { data: categories } = api.category.list.useQuery()

  const createPost = api.post.create.useMutation({
    onSuccess: (post) => {
      if (post.isDraft) {
        toast({
          title: 'Draft saved!',
          description: 'Your draft has been saved successfully.',
        })
        setIsSavingDraft(false)
      } else {
        toast({
          title: 'Post published!',
          description: 'Your post has been published successfully.',
        })
        router.push(`/post/${post.slug}`)
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setIsSubmitting(false)
      setIsSavingDraft(false)
    },
  })

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    const data = form.getValues()
    createPost.mutate({
      ...data,
      tags,
      isDraft: true,
    })
  }

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true)
    createPost.mutate({
      ...data,
      tags,
      isDraft: false,
    })
  }

  const handleAddTag = () => {
    if (tagInput && tags.length < 5) {
      const formattedTag = tagInput.toLowerCase().replace(/\s+/g, '-')
      if (!tags.includes(formattedTag)) {
        setTags([...tags, formattedTag])
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleYouTubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoId = extractYouTubeVideoId(e.target.value)
    if (videoId) {
      form.setValue('youtubeVideoId', videoId)
    }
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share your thoughts with the Sparkle community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">
                  <FileText className="mr-2 h-4 w-4" />
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="write" className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter an engaging title for your post"
                    {...form.register('title')}
                    className="mt-2 text-lg"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="excerpt" className="text-base">
                    Excerpt
                  </Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of your post (optional)"
                    {...form.register('excerpt')}
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be shown in post previews
                  </p>
                </div>

                <div>
                  <Label className="text-base">
                    Content <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-2">
                    <RichTextEditor
                      content={form.watch('content')}
                      onChange={(content) => form.setValue('content', content)}
                      placeholder="Write your post content..."
                      className="border rounded-lg"
                    />
                  </div>
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardContent className="pt-6">
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <h1>{form.watch('title') || 'Untitled Post'}</h1>
                      {form.watch('excerpt') && (
                        <p className="lead">{form.watch('excerpt')}</p>
                      )}
                      {form.watch('youtubeVideoId') && (
                        <div className="my-6">
                          <YouTubeEmbed videoId={form.watch('youtubeVideoId')!} />
                        </div>
                      )}
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: form.watch('content') || '<p>No content yet...</p>' 
                        }} 
                      />
                    </article>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Publish Settings</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="draft">Save as draft</Label>
                <Switch
                  id="draft"
                  checked={form.watch('isDraft')}
                  onCheckedChange={(checked) => form.setValue('isDraft', checked)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="flex-1"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Draft
                    </>
                  )}
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting || isSavingDraft}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('categoryId')}
                onValueChange={(value) => form.setValue('categoryId', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label htmlFor="tags">
                Tags
                <span className="text-sm text-muted-foreground ml-2">
                  ({tags.length}/5)
                </span>
              </Label>
              
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  disabled={tags.length >= 5}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5 || !tagInput}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* YouTube */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label htmlFor="youtube">
                <Youtube className="inline h-4 w-4 mr-2" />
                YouTube Video
              </Label>
              <Input
                id="youtube"
                placeholder="YouTube video URL or ID"
                onChange={handleYouTubeUrlChange}
              />
              {form.watch('youtubeVideoId') && (
                <div className="mt-4">
                  <YouTubeEmbed 
                    videoId={form.watch('youtubeVideoId')!} 
                    showDetails={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.back()}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

```

# src/app/api/trpc/[trpc]/route.ts
```ts
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

/**
 * This wraps the tRPC API handler so we can use it on Vercel Edge Functions
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            )
          }
        : undefined,
  })

export { handler as GET, handler as POST }

```

# src/components/features/editor/rich-text-editor.tsx
```tsx
// src/components/features/editor/rich-text-editor.tsx
'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { 
  Bold, 
  Italic, 
  Strikethrough,
  Code,
  List, 
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
  minHeight?: string
}

export function RichTextEditor({ 
  content, 
  onChange,
  placeholder = 'Start writing your amazing post...',
  className,
  editable = true,
  minHeight = '400px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: 'rounded-lg overflow-hidden mx-auto',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-lg bg-muted p-4 font-mono text-sm',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL')

    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addYouTubeVideo = useCallback(() => {
    const url = window.prompt('YouTube URL')

    if (url) {
      editor?.commands.setYoutubeVideo({
        src: url,
      })
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1 bg-muted/50 rounded-t-lg sticky top-0 z-10">
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            aria-label="Code"
          >
            <Code className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            aria-label="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Media */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={setLink}
            className={editor.isActive('link') ? 'bg-muted' : ''}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={addImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={addYouTubeVideo}
          >
            <YoutubeIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* History */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Floating menu for empty lines */}
      {editable && (
        <FloatingMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-background border rounded-lg shadow-lg p-2 flex items-center gap-1"
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4 mr-2" />
            Heading 1
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4 mr-2" />
            Heading 2
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4 mr-2" />
            Quote
          </Button>
        </FloatingMenu>
      )}

      {/* Bubble menu for text selection */}
      {editable && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1"
        >
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button
            size="sm"
            variant="ghost"
            onClick={setLink}
            className={editor.isActive('link') ? 'bg-muted' : ''}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Editor content */}
      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none",
          "prose-headings:font-bold prose-headings:tracking-tight",
          "prose-p:leading-7",
          "prose-pre:bg-muted prose-pre:text-muted-foreground",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']",
          "prose-blockquote:border-l-primary prose-blockquote:not-italic",
          "prose-img:rounded-lg prose-img:shadow-md",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "min-h-[var(--min-height)]"
        )}
        style={{ '--min-height': minHeight } as any}
      />

      {/* Character count */}
      <div className="border-t p-2 text-sm text-muted-foreground flex justify-between">
        <span>
          {editor.storage.characterCount.characters()} characters
        </span>
        <span>
          {editor.storage.characterCount.words()} words
        </span>
      </div>
    </div>
  )
}

```

# src/components/features/post/post-card.tsx
```tsx
// src/components/features/post/post-card.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PostActions } from './post-actions'
import { YouTubeEmbed } from '@/components/features/youtube/youtube-embed'
import { type RouterOutputs } from '@/lib/api'
import { cn } from '@/lib/utils'
import { 
  MoreHorizontal, 
  Bookmark, 
  Share2, 
  Flag, 
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  Hash,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'
import { api } from '@/lib/api'

type Post = RouterOutputs['post']['list']['items'][0]

interface PostCardProps {
  post: Post
  className?: string
  showAuthor?: boolean
  showActions?: boolean
  variant?: 'default' | 'compact' | 'featured'
}

export function PostCard({ 
  post, 
  className,
  showAuthor = true,
  showActions = true,
  variant = 'default',
}: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post._count.reactions)
  const [isBookmarked, setIsBookmarked] = useState(false)

  const utils = api.useUtils()

  const likeMutation = api.post.like.useMutation({
    onMutate: () => {
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
    },
    onError: () => {
      setIsLiked(false)
      setLikeCount(prev => prev - 1)
      toast({
        title: 'Error',
        description: 'Failed to like post',
        variant: 'destructive',
      })
    },
  })

  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: () => {
      setIsLiked(false)
      setLikeCount(prev => prev - 1)
    },
    onError: () => {
      setIsLiked(true)
      setLikeCount(prev => prev + 1)
      toast({
        title: 'Error',
        description: 'Failed to unlike post',
        variant: 'destructive',
      })
    },
  })

  const bookmarkMutation = api.post.bookmark.useMutation({
    onMutate: () => {
      setIsBookmarked(true)
    },
    onSuccess: () => {
      toast({
        title: 'Bookmarked!',
        description: 'Post saved to your bookmarks',
      })
    },
    onError: () => {
      setIsBookmarked(false)
      toast({
        title: 'Error',
        description: 'Failed to bookmark post',
        variant: 'destructive',
      })
    },
  })

  const shareMutation = api.post.share.useMutation({
    onSuccess: (data) => {
      if (data.shareUrl.startsWith('http')) {
        window.open(data.shareUrl, '_blank')
      } else {
        navigator.clipboard.writeText(data.shareUrl)
        toast({
          title: 'Link copied!',
          description: 'Post link copied to clipboard',
        })
      }
    },
  })

  const handleLike = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to like posts',
      })
      return
    }

    if (isLiked) {
      unlikeMutation.mutate({ postId: post.id })
    } else {
      likeMutation.mutate({ postId: post.id })
    }
  }

  const handleBookmark = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to bookmark posts',
      })
      return
    }

    bookmarkMutation.mutate({ postId: post.id })
  }

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    shareMutation.mutate({ postId: post.id, platform })
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-4 py-4', className)}>
        <div className="flex-1 min-w-0">
          <Link href={`/post/${post.slug}`}>
            <h3 className="font-semibold line-clamp-1 hover:text-primary transition-colors">
              {post.title}
            </h3>
          </Link>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{post.author.username}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.stats?.viewCount || 0}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            <MessageSquare className="h-3 w-3 mr-1" />
            {post._count.comments}
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-lg transition-all duration-300',
      variant === 'featured' && 'border-primary/20',
      className
    )}>
      {/* Cover image or YouTube embed */}
      {(post.coverImage || post.youtubeVideoId) && (
        <div className="relative aspect-video">
          {post.youtubeVideoId ? (
            <YouTubeEmbed videoId={post.youtubeVideoId} showDetails={false} />
          ) : post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              className="object-cover"
            />
          ) : null}
          {variant === 'featured' && (
            <Badge className="absolute top-4 left-4 bg-primary">
              <TrendingUp className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      )}

      <CardContent className="pt-6">
        {/* Author info */}
        {showAuthor && (
          <div className="flex items-center justify-between mb-4">
            <Link 
              href={`/user/${post.author.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar>
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>
                  {post.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{post.author.username}</p>
                  {post.author.verified && (
                    <Badge variant="secondary" className="h-5 px-1">
                      ✓
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </Link>

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  Share on Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  Share on Facebook
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Report post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Content */}
        <Link href={`/post/${post.slug}`}>
          <h3 className={cn(
            "font-bold hover:text-primary transition-colors",
            variant === 'featured' ? 'text-2xl mb-3' : 'text-xl mb-2'
          )}>
            {post.title}
          </h3>
        </Link>
        
        {post.excerpt && (
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {post.category && (
            <Link href={`/category/${post.category.slug}`}>
              <Badge variant="outline" className="hover:bg-primary/10">
                {post.category.name}
              </Badge>
            </Link>
          )}
          {post.tags.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              {post.tags.slice(0, 3).map(tag => (
                <Link key={tag.id} href={`/tag/${tag.name}`}>
                  <Badge 
                    variant="secondary" 
                    className="hover:bg-secondary/80 transition-colors"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                </Link>
              ))}
              {post.tags.length > 3 && (
                <Badge variant="ghost" className="text-xs">
                  +{post.tags.length - 3} more
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{post.stats?.viewCount || 0} views</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{post._count.comments} comments</span>
          </div>
          {post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} min read</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="pt-4 border-t">
          <PostActions
            postId={post.id}
            likes={likeCount}
            comments={post._count.comments}
            isLiked={isLiked}
            onLike={handleLike}
            onComment={() => {}}
            onShare={() => handleShare('copy')}
            className="w-full"
          />
        </CardFooter>
      )}
    </Card>
  )
}

```

# src/components/features/post/post-actions.tsx
```tsx
// src/components/features/post/post-actions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn, formatNumber } from '@/lib/utils'
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PostActionsProps {
  postId: string
  likes: number
  comments: number
  isLiked: boolean
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  className?: string
  size?: 'sm' | 'default'
}

export function PostActions({
  postId,
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  className,
  size = 'default',
}: PostActionsProps) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const buttonSize = size === 'sm' ? 'sm' : 'default'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Like button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onLike}
        className={cn(
          'gap-2 transition-colors',
          isLiked && 'text-red-500 hover:text-red-600'
        )}
      >
        <AnimatePresence mode="wait">
          {isLiked ? (
            <motion.div
              key="liked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Heart className={cn(iconSize, 'fill-current')} />
            </motion.div>
          ) : (
            <motion.div
              key="unliked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Heart className={iconSize} />
            </motion.div>
          )}
        </AnimatePresence>
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-xs'
        )}>
          {formatNumber(likes)}
        </span>
      </Button>

      {/* Comment button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onComment}
        className="gap-2"
      >
        <MessageSquare className={iconSize} />
        <span className={cn(
          'font-medium',
          size === 'sm' && 'text-xs'
        )}>
          {formatNumber(comments)}
        </span>
      </Button>

      {/* Share button */}
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={onShare}
        className="gap-2 ml-auto"
      >
        <Share2 className={iconSize} />
        {size !== 'sm' && <span>Share</span>}
      </Button>

      {/* Sparkle animation on like */}
      <AnimatePresence>
        {isLiked && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="absolute -top-8 left-4 pointer-events-none"
          >
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

```

# src/lib/api.ts
```ts
// src/lib/api.ts
import { createTRPCReact } from '@trpc/react-query'
import { type AppRouter } from '@/server/api/root'

export const api = createTRPCReact<AppRouter>()

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>

// Re-export for convenience
export { type AppRouter } from '@/server/api/root'

```

# src/lib/validations/comment.ts
```ts
// src/lib/validations/comment.ts
import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  youtubeTimestamp: z.number().int().min(0).optional(),
})

export const updateCommentSchema = z.object({
  id: z.string().cuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

```

# src/lib/validations/post.ts
```ts
// src/lib/validations/post.ts
import { z } from 'zod'

// Base post schema
const postBaseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => val.trim()),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform(val => val?.trim()),
  categoryId: z.string().cuid().optional(),
  youtubeVideoId: z.string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID')
    .optional(),
})

// Create post schema
export const createPostSchema = postBaseSchema.extend({
  tags: z.array(z.string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tags can only contain letters, numbers, hyphens, and underscores')
  )
    .max(5, 'Maximum 5 tags allowed')
    .optional()
    .default([]),
  seriesId: z.string().cuid().optional(),
  seriesOrder: z.number().int().positive().optional(),
  isDraft: z.boolean().optional().default(false),
})

// Update post schema
export const updatePostSchema = z.object({
  id: z.string().cuid(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => val.trim())
    .optional(),
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional(),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform(val => val?.trim()),
  tags: z.array(z.string()
    .min(1)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tags can only contain letters, numbers, hyphens, and underscores')
  )
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
  categoryId: z.string().cuid().optional(),
  youtubeVideoId: z.string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, 'Invalid YouTube video ID')
    .optional()
    .nullable(),
})

// Post filter schema
export const postFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  cursor: z.string().optional(),
  authorId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  tag: z.string().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(['latest', 'popular', 'trending']).optional().default('latest'),
})

// Series schema
export const createSeriesSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  coverImage: z.string().url().optional(),
})

// Types
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostFilterInput = z.infer<typeof postFilterSchema>
export type CreateSeriesInput = z.infer<typeof createSeriesSchema>

// YouTube validation helpers
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^[a-zA-Z0-9_-]{11}$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }

  return null
}

export const validateYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null
}

```

# src/lib/validations/user.ts
```ts
// src/lib/validations/user.ts
import { z } from 'zod'

// Username validation
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')

// Profile update schema
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
  displayName: z.string()
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .nullable(),
  twitterUsername: z.string()
    .max(15, 'Invalid Twitter username')
    .regex(/^[A-Za-z0-9_]*$/, 'Invalid Twitter username')
    .optional()
    .nullable(),
  instagramUsername: z.string()
    .max(30, 'Invalid Instagram username')
    .regex(/^[A-Za-z0-9_.]*$/, 'Invalid Instagram username')
    .optional()
    .nullable(),
  tiktokUsername: z.string()
    .max(24, 'Invalid TikTok username')
    .regex(/^[A-Za-z0-9_.]*$/, 'Invalid TikTok username')
    .optional()
    .nullable(),
  discordUsername: z.string()
    .max(32, 'Invalid Discord username')
    .optional()
    .nullable(),
  youtubeChannelId: z.string()
    .regex(/^UC[A-Za-z0-9_-]{22}$/, 'Invalid YouTube channel ID')
    .optional()
    .nullable(),
  interests: z.array(z.string()).max(10, 'Maximum 10 interests allowed').optional(),
  skills: z.array(z.string()).max(10, 'Maximum 10 skills allowed').optional(),
  pronouns: z.string().max(20, 'Pronouns must be less than 20 characters').optional(),
})

// User preferences schema
export const userPreferencesSchema = z.object({
  language: z.string().length(2, 'Invalid language code').optional(),
  timezone: z.string().optional(),
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']).optional(),
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'followers', 'private']).optional(),
    showEmail: z.boolean().optional(),
    showStats: z.boolean().optional(),
    allowMessages: z.enum(['everyone', 'followers', 'none']).optional(),
  }).optional(),
  notificationPrefs: z.object({
    postLikes: z.boolean().optional(),
    postComments: z.boolean().optional(),
    newFollowers: z.boolean().optional(),
    mentions: z.boolean().optional(),
    directMessages: z.boolean().optional(),
    groupInvites: z.boolean().optional(),
    eventReminders: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
  }).optional(),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: usernameSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

```

# src/server/api/trpc.ts
```ts
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { getServerSession } from 'next-auth'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { authOptions } from '@/lib/auth/auth.config'
import { db } from '@/lib/db'
import { ratelimit } from '@/lib/rate-limit'
import type { Session } from 'next-auth'

interface CreateContextOptions {
  session: Session | null
  headers: Headers
  req?: Request
}

/**
 * This helper generates the "internals" for a tRPC context.
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
    headers: opts.headers,
    req: opts.req,
  }
}

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 */
export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions | CreateNextContextOptions
) => {
  // Get session from NextAuth
  const session = await getServerSession(authOptions)

  // For API routes
  if ('req' in opts && 'res' in opts) {
    return createInnerTRPCContext({
      session,
      headers: new Headers(),
      req: opts.req as any,
    })
  }

  // For app directory
  return createInnerTRPCContext({
    session,
    headers: opts.resHeaders,
    req: opts.req,
  })
}

/**
 * Initialize tRPC backend
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory

/**
 * These are the pieces you use to build your tRPC API
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

/**
 * Middleware for timing procedures
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now()
  const result = await next()
  const end = Date.now()
  console.log(`[TRPC] ${path} took ${end - start}ms`)
  return result
})

/**
 * Middleware for rate limiting
 */
const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  // Get identifier from session or IP
  const identifier = ctx.session?.user?.id ?? ctx.headers.get('x-forwarded-for') ?? 'anonymous'
  
  const { success } = await ratelimit.limit(identifier)
  
  if (!success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    })
  }

  return next()
})

/**
 * Middleware for authenticated procedures
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    })
  }
  
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Middleware for admin procedures
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'You must be an admin to perform this action',
    })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

/**
 * Public (unauthenticated) procedure with rate limiting
 */
export const publicProcedureWithRateLimit = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)
  .use(enforceUserIsAuthed)

/**
 * Admin procedure
 */
export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(enforceUserIsAuthed)
  .use(enforceUserIsAdmin)

```

# src/server/api/routers/comment.ts
```ts
// src/server/api/routers/comment.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { CommentService } from '@/server/services/comment.service'
import { createCommentSchema, updateCommentSchema } from '@/lib/validations/comment'

export const commentRouter = createTRPCRouter({
  // Create comment
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.createComment({
        ...input,
        authorId: ctx.session.user.id,
      })
    }),

  // Update comment
  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.updateComment(
        input.id,
        ctx.session.user.id,
        input.content
      )
    }),

  // Delete comment
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.deleteComment(input.id, ctx.session.user.id)
    }),

  // Get comments for post
  getByPost: publicProcedure
    .input(z.object({
      postId: z.string().cuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      sortBy: z.enum(['newest', 'oldest', 'popular']).default('newest'),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getPostComments({
        ...input,
        viewerId: ctx.session?.user?.id,
      })
    }),

  // Get comment thread
  getThread: publicProcedure
    .input(z.object({
      commentId: z.string().cuid(),
      depth: z.number().min(1).max(5).default(3),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getCommentThread(
        input.commentId,
        input.depth
      )
    }),

  // Like comment
  like: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.likeComment(
        input.commentId,
        ctx.session.user.id
      )
    }),

  // Unlike comment
  unlike: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.unlikeComment(
        input.commentId,
        ctx.session.user.id
      )
    }),

  // Report comment
  report: protectedProcedure
    .input(z.object({
      commentId: z.string().cuid(),
      reason: z.enum(['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER']),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.reportComment({
        ...input,
        reporterId: ctx.session.user.id,
      })
    }),

  // Get user's recent comments
  getUserComments: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const commentService = new CommentService(ctx.db)
      return commentService.getUserComments(input)
    }),
})

```

# src/server/api/routers/gamification.ts
```ts
// src/server/api/routers/gamification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure,
  publicProcedure 
} from '@/server/api/trpc'
import { GamificationService } from '@/server/services/gamification.service'

export const gamificationRouter = createTRPCRouter({
  // Get user's XP and level
  getProgress: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          experience: true,
          level: true,
          sparklePoints: true,
          premiumPoints: true,
        },
      })

      const gamificationService = new GamificationService(ctx.db)
      const nextLevelXP = gamificationService.calculateXPForLevel((user?.level || 1) + 1)
      const currentLevelXP = gamificationService.calculateXPForLevel(user?.level || 1)

      return {
        experience: user?.experience || 0,
        level: user?.level || 1,
        sparklePoints: user?.sparklePoints || 0,
        premiumPoints: user?.premiumPoints || 0,
        nextLevelXP,
        currentLevelXP,
        progress: ((user?.experience || 0) - currentLevelXP) / (nextLevelXP - currentLevelXP),
      }
    }),

  // Get user's achievements
  getAchievements: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
      filter: z.enum(['all', 'unlocked', 'locked', 'showcased']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const whereClause: any = {
        userId: ctx.session.user.id,
      }

      if (input.filter === 'unlocked') {
        whereClause.unlockedAt = { not: null }
      } else if (input.filter === 'locked') {
        whereClause.unlockedAt = null
      } else if (input.filter === 'showcased') {
        whereClause.showcased = true
      }

      const achievements = await ctx.db.userAchievement.findMany({
        where: whereClause,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          achievement: true,
        },
        orderBy: [
          { showcased: 'desc' },
          { unlockedAt: 'desc' },
        ],
      })

      let nextCursor: string | undefined = undefined
      if (achievements.length > input.limit) {
        const nextItem = achievements.pop()
        nextCursor = nextItem!.id
      }

      return {
        items: achievements,
        nextCursor,
      }
    }),

  // Get active quests
  getQuests: protectedProcedure
    .query(async ({ ctx }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getActiveQuests(ctx.session.user.id)
    }),

  // Claim quest rewards
  claimQuestReward: protectedProcedure
    .input(z.object({
      questId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quest = await ctx.db.userQuest.findUnique({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        include: {
          quest: true,
        },
      })

      if (!quest || quest.status !== 'COMPLETED') {
        throw new Error('Quest not completed or already claimed')
      }

      await ctx.db.userQuest.update({
        where: {
          userId_questId: {
            userId: ctx.session.user.id,
            questId: input.questId,
          },
        },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date(),
        },
      })

      return { success: true }
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['xp', 'sparklePoints', 'achievements']).default('xp'),
      period: z.enum(['daily', 'weekly', 'monthly', 'alltime']).default('weekly'),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const gamificationService = new GamificationService(ctx.db)
      return gamificationService.getLeaderboard(
        input.type,
        input.period,
        input.limit
      )
    }),

  // Showcase achievement
  showcaseAchievement: protectedProcedure
    .input(z.object({
      achievementId: z.string().cuid(),
      showcased: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const userAchievement = await ctx.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
      })

      if (!userAchievement || !userAchievement.unlockedAt) {
        throw new Error('Achievement not unlocked')
      }

      // Update showcase status
      await ctx.db.userAchievement.update({
        where: {
          userId_achievementId: {
            userId: ctx.session.user.id,
            achievementId: input.achievementId,
          },
        },
        data: {
          showcased: input.showcased,
          showcaseOrder: input.showcased ? 0 : null,
        },
      })

      return { success: true }
    }),
})

```

# src/server/api/routers/post.ts
```ts
// src/server/api/routers/post.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { 
  createPostSchema, 
  updatePostSchema,
  postFilterSchema 
} from '@/lib/validations/post'
import { PostService } from '@/server/services/post.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'
import { SearchService } from '@/server/services/search.service'

export const postRouter = createTRPCRouter({
  // Create a new post
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      const searchService = new SearchService(ctx.db)
      
      const post = await postService.createPost({
        ...input,
        authorId: ctx.session.user.id,
      })

      // Index post for search
      await searchService.indexPost(post)

      // Emit post created event
      await eventService.emit('post.created', {
        postId: post.id,
        authorId: post.authorId,
        title: post.title,
      })

      return post
    }),

  // Update existing post
  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      const searchService = new SearchService(ctx.db)
      
      const post = await postService.updatePost(
        input.id,
        ctx.session.user.id,
        input
      )

      // Update search index
      await searchService.indexPost(post)

      // Invalidate cache
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      return post
    }),

  // Delete post
  delete: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      const searchService = new SearchService(ctx.db)
      const eventService = new EventService()
      
      const post = await postService.deletePost(
        input.id, 
        ctx.session.user.id
      )

      // Remove from search
      await searchService.deletePost(input.id)

      // Invalidate cache
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      // Emit deletion event
      await eventService.emit('post.deleted', {
        postId: input.id,
        authorId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Get post by slug
  getBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `post:${input.slug}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const post = await postService.getPostBySlug(
        input.slug,
        ctx.session?.user?.id
      )

      // Cache for 5 minutes
      await cacheService.set(cacheKey, post, 300)

      return post
    }),

  // Get post by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `post:${input.id}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const post = await postService.getPostById(
        input.id,
        ctx.session?.user?.id
      )

      // Cache for 5 minutes
      await cacheService.set(cacheKey, post, 300)

      return post
    }),

  // List posts with filtering
  list: publicProcedure
    .input(postFilterSchema)
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.listPosts({
        ...input,
        userId: ctx.session?.user?.id,
      })
    }),

  // Get user's feed
  feed: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache for first page
      if (!input.cursor) {
        const cacheKey = `feed:${ctx.session.user.id}:${input.limit}`
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached
      }

      const feed = await postService.getUserFeed(
        ctx.session.user.id,
        input
      )

      // Cache first page for 1 minute
      if (!input.cursor) {
        const cacheKey = `feed:${ctx.session.user.id}:${input.limit}`
        await cacheService.set(cacheKey, feed, 60)
      }

      return feed
    }),

  // Get trending posts
  trending: publicProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'all']).default('week'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache
      const cacheKey = `trending:${input.period}:${input.limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const trending = await postService.getTrendingPosts(input)

      // Cache for 30 minutes
      await cacheService.set(cacheKey, trending, 1800)

      return trending
    }),

  // Like a post
  like: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      type: z.enum(['LIKE', 'LOVE', 'FIRE', 'SPARKLE']).default('LIKE'),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      const reaction = await postService.likePost(
        input.postId, 
        ctx.session.user.id,
        input.type
      )

      // Emit like event
      await eventService.emit('post.liked', {
        postId: input.postId,
        userId: ctx.session.user.id,
        type: input.type,
      })

      return reaction
    }),

  // Unlike a post
  unlike: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      await postService.unlikePost(input.postId, ctx.session.user.id)

      // Emit unlike event
      await eventService.emit('post.unliked', {
        postId: input.postId,
        userId: ctx.session.user.id,
      })

      return { success: true }
    }),

  // Bookmark a post
  bookmark: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      folderId: z.string().cuid().optional(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.bookmarkPost({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Remove bookmark
  unbookmark: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.unbookmarkPost(
        input.postId, 
        ctx.session.user.id
      )
    }),

  // Get bookmarks
  getBookmarks: protectedProcedure
    .input(z.object({
      folderId: z.string().cuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.getUserBookmarks({
        ...input,
        userId: ctx.session.user.id,
      })
    }),

  // Share a post
  share: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      platform: z.enum(['twitter', 'facebook', 'linkedin', 'copy']),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const eventService = new EventService()
      
      const shareUrl = await postService.sharePost(
        input.postId,
        input.platform
      )

      // Track share
      await eventService.emit('post.shared', {
        postId: input.postId,
        userId: ctx.session.user.id,
        platform: input.platform,
      })

      return { shareUrl }
    }),

  // Report a post
  report: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
      reason: z.enum([
        'SPAM',
        'INAPPROPRIATE',
        'HARASSMENT',
        'MISINFORMATION',
        'COPYRIGHT',
        'OTHER',
      ]),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.reportPost({
        ...input,
        reporterId: ctx.session.user.id,
      })
    }),

  // Get related posts
  getRelated: publicProcedure
    .input(z.object({
      postId: z.string().cuid(),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache
      const cacheKey = `related:${input.postId}:${input.limit}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const related = await postService.getRelatedPosts(
        input.postId,
        input.limit
      )

      // Cache for 1 hour
      await cacheService.set(cacheKey, related, 3600)

      return related
    }),

  // Get post series
  getSeries: publicProcedure
    .input(z.object({
      seriesId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      return postService.getPostSeries(input.seriesId)
    }),

  // Toggle post publish status
  togglePublish: protectedProcedure
    .input(z.object({
      postId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const postService = new PostService(ctx.db)
      const cacheService = new CacheService()
      
      const post = await postService.togglePublishStatus(
        input.postId,
        ctx.session.user.id
      )

      // Invalidate caches
      await cacheService.invalidate(`post:${post.slug}`)
      await cacheService.invalidate(`post:${post.id}`)

      return post
    }),
})

```

# src/server/api/routers/youtube.ts
```ts
// src/server/api/routers/youtube.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { YouTubeService } from '@/server/services/youtube.service'
import { WatchPartyService } from '@/server/services/watch-party.service'

export const youtubeRouter = createTRPCRouter({
  // Get video details
  getVideo: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoDetails(input.videoId)
    }),

  // Sync YouTube channel
  syncChannel: protectedProcedure
    .input(z.object({
      channelId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.syncChannel(
        input.channelId,
        ctx.session.user.id
      )
    }),

  // Create watch party
  createWatchParty: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().optional(),
      youtubeVideoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      scheduledStart: z.date(),
      maxParticipants: z.number().min(2).max(100).default(50),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.createWatchParty({
        ...input,
        hostId: ctx.session.user.id,
      })
    }),

  // Join watch party
  joinWatchParty: protectedProcedure
    .input(z.object({
      partyId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.joinParty(
        input.partyId,
        ctx.session.user.id
      )
    }),

  // Get upcoming watch parties
  getUpcomingParties: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const watchPartyService = new WatchPartyService(ctx.db)
      return watchPartyService.getUpcomingParties(input)
    }),

  // Get trending videos
  getTrendingVideos: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getTrendingVideos(input.limit)
    }),

  // Create video clip
  createClip: protectedProcedure
    .input(z.object({
      youtubeVideoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
      title: z.string().min(1).max(100),
      description: z.string().optional(),
      startTime: z.number().min(0),
      endTime: z.number().min(1),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.createVideoClip({
        ...input,
        creatorId: ctx.session.user.id,
      })
    }),

  // Get video analytics
  getVideoAnalytics: publicProcedure
    .input(z.object({
      videoId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/),
    }))
    .query(async ({ ctx, input }) => {
      const youtubeService = new YouTubeService(ctx.db)
      return youtubeService.getVideoAnalytics(input.videoId)
    }),
})

```

# src/server/api/routers/search.ts
```ts
// src/server/api/routers/search.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  publicProcedure 
} from '@/server/api/trpc'
import { SearchService } from '@/server/services/search.service'

export const searchRouter = createTRPCRouter({
  // Global search
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      type: z.enum(['all', 'posts', 'users', 'tags']).default('all'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.search(input)
    }),

  // Search suggestions
  suggestions: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getSuggestions(input.query, input.limit)
    }),

  // Trending searches
  trending: publicProcedure
    .query(async ({ ctx }) => {
      const searchService = new SearchService(ctx.db)
      return searchService.getTrendingSearches()
    }),
})

```

# src/server/api/routers/notification.ts
```ts
// src/server/api/routers/notification.ts
import { z } from 'zod'
import { 
  createTRPCRouter, 
  protectedProcedure 
} from '@/server/api/trpc'
import { NotificationService } from '@/server/services/notification.service'

export const notificationRouter = createTRPCRouter({
  // Get notifications
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      unreadOnly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.db.notification.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.unreadOnly && { read: false }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (notifications.length > input.limit) {
        const nextItem = notifications.pop()
        nextCursor = nextItem!.id
      }

      return {
        items: notifications,
        nextCursor,
      }
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.markAsRead(
        input.notificationId,
        ctx.session.user.id
      )
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.markAllAsRead(ctx.session.user.id)
    }),

  // Get unread count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notificationService = new NotificationService(ctx.db)
      return notificationService.getUnreadCount(ctx.session.user.id)
    }),

  // Update preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      postLikes: z.boolean().optional(),
      postComments: z.boolean().optional(),
      newFollowers: z.boolean().optional(),
      mentions: z.boolean().optional(),
      directMessages: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        update: input,
      })
    }),
})

```

# src/server/api/routers/user.ts
```ts
// src/server/api/routers/user.ts
import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure 
} from '@/server/api/trpc'
import { 
  updateProfileSchema, 
  userPreferencesSchema 
} from '@/lib/validations/user'
import { UserService } from '@/server/services/user.service'
import { CacheService } from '@/server/services/cache.service'
import { EventService } from '@/server/services/event.service'

export const userRouter = createTRPCRouter({
  // Get user profile by username
  getProfile: publicProcedure
    .input(z.object({
      username: z.string().min(1).max(50),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `user:profile:${input.username}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const profile = await userService.getProfileByUsername(input.username)
      
      // Cache for 5 minutes
      await cacheService.set(cacheKey, profile, 300)
      
      return profile
    }),

  // Get current user's profile
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const userService = new UserService(ctx.db)
      return userService.getProfileById(ctx.session.user.id)
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      const updatedProfile = await userService.updateProfile(
        ctx.session.user.id, 
        input
      )

      // Emit profile update event
      await eventService.emit('user.profile.updated', {
        userId: ctx.session.user.id,
        changes: input,
      })

      // Invalidate cache
      const cacheService = new CacheService()
      await cacheService.invalidate(`user:profile:${updatedProfile.username}`)
      
      return updatedProfile
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.updatePreferences(ctx.session.user.id, input)
    }),

  // Follow a user
  follow: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot follow yourself',
        })
      }

      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      const result = await userService.followUser(
        ctx.session.user.id, 
        input.userId
      )

      // Emit follow event for real-time updates
      await eventService.emit('user.followed', {
        followerId: ctx.session.user.id,
        followingId: input.userId,
      })
      
      return result
    }),

  // Unfollow a user
  unfollow: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      const result = await userService.unfollowUser(
        ctx.session.user.id, 
        input.userId
      )

      // Emit unfollow event
      await eventService.emit('user.unfollowed', {
        followerId: ctx.session.user.id,
        followingId: input.userId,
      })
      
      return result
    }),

  // Get user's followers
  getFollowers: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getFollowers(input)
    }),

  // Get users that a user is following
  getFollowing: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getFollowing(input)
    }),

  // Check if current user follows a specific user
  isFollowing: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.isFollowing(ctx.session.user.id, input.userId)
    }),

  // Get user statistics
  getStats: publicProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const cacheService = new CacheService()
      
      // Try cache first
      const cacheKey = `user:stats:${input.userId}`
      const cached = await cacheService.get(cacheKey)
      if (cached) return cached

      const stats = await userService.getUserStats(input.userId)
      
      // Cache for 1 hour
      await cacheService.set(cacheKey, stats, 3600)
      
      return stats
    }),

  // Block a user
  block: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot block yourself',
        })
      }

      const userService = new UserService(ctx.db)
      return userService.blockUser(ctx.session.user.id, input.userId)
    }),

  // Unblock a user
  unblock: protectedProcedure
    .input(z.object({
      userId: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.unblockUser(ctx.session.user.id, input.userId)
    }),

  // Get blocked users
  getBlockedUsers: protectedProcedure
    .query(async ({ ctx }) => {
      const userService = new UserService(ctx.db)
      return userService.getBlockedUsers(ctx.session.user.id)
    }),

  // Search users
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.searchUsers(input.query, input.limit)
    }),

  // Get recommended users to follow
  getRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      return userService.getRecommendedUsers(ctx.session.user.id, input.limit)
    }),

  // Delete user account
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string().min(1),
      confirmation: z.literal('DELETE MY ACCOUNT'),
    }))
    .mutation(async ({ ctx, input }) => {
      const userService = new UserService(ctx.db)
      const eventService = new EventService()
      
      // Verify password
      const isValid = await userService.verifyPassword(
        ctx.session.user.id, 
        input.password
      )
      
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid password',
        })
      }

      // Delete account
      await userService.deleteAccount(ctx.session.user.id)

      // Emit account deletion event
      await eventService.emit('user.account.deleted', {
        userId: ctx.session.user.id,
      })

      return { success: true }
    }),
})

```

# src/server/api/root.ts
```ts
// src/server/api/root.ts
import { createTRPCRouter } from '@/server/api/trpc'
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

```

# src/server/services/comment.service.ts
```ts
// src/server/services/comment.service.ts
import { 
  PrismaClient, 
  Prisma,
  ModerationStatus,
  ReactionType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { CacheService } from './cache.service'
import { sanitizeHtml } from '@/lib/security'

export class CommentService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.cacheService = new CacheService()
  }

  async createComment(input: {
    content: string
    postId: string
    authorId: string
    parentId?: string
    youtubeTimestamp?: number
  }) {
    // Validate post exists and is published
    const post = await this.db.post.findUnique({
      where: { id: input.postId },
      select: { 
        id: true, 
        authorId: true, 
        title: true,
        allowComments: true,
        published: true,
      },
    })

    if (!post || !post.published) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (!post.allowComments) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Comments are disabled for this post',
      })
    }

    // Validate parent comment if provided
    if (input.parentId) {
      const parentComment = await this.db.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, deleted: true },
      })

      if (!parentComment || parentComment.deleted || parentComment.postId !== input.postId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Parent comment not found',
        })
      }
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(input.content)

    // Create comment
    const comment = await this.db.comment.create({
      data: {
        content: sanitizedContent,
        postId: input.postId,
        authorId: input.authorId,
        parentId: input.parentId,
        youtubeTimestamp: input.youtubeTimestamp,
        moderationStatus: ModerationStatus.AUTO_APPROVED, // TODO: Add AI moderation
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId: input.postId },
      data: { commentCount: { increment: 1 } },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: input.authorId },
      data: { totalComments: { increment: 1 } },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.authorId,
      action: 'comment.created',
      entityType: 'comment',
      entityId: comment.id,
      entityData: {
        postId: input.postId,
        content: comment.content.substring(0, 100),
      },
    })

    // Send notifications
    if (post.authorId !== input.authorId) {
      await this.notificationService.createNotification({
        type: 'POST_COMMENTED',
        userId: post.authorId,
        actorId: input.authorId,
        entityId: comment.id,
        entityType: 'comment',
        title: 'New comment on your post',
        message: `commented on "${post.title}"`,
        actionUrl: `/post/${input.postId}#comment-${comment.id}`,
      })
    }

    // Notify parent comment author
    if (input.parentId) {
      const parentComment = await this.db.comment.findUnique({
        where: { id: input.parentId },
        select: { authorId: true },
      })

      if (parentComment && parentComment.authorId !== input.authorId) {
        await this.notificationService.createNotification({
          type: 'COMMENT_REPLY',
          userId: parentComment.authorId,
          actorId: input.authorId,
          entityId: comment.id,
          entityType: 'comment',
          title: 'New reply to your comment',
          message: 'replied to your comment',
          actionUrl: `/post/${input.postId}#comment-${comment.id}`,
        })
      }
    }

    // Check for mentions
    await this.processMentions(comment)

    // Invalidate post cache
    await this.cacheService.invalidate(`post:${input.postId}`)

    return comment
  }

  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, content: true },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    if (comment.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to edit this comment',
      })
    }

    // Sanitize content
    const sanitizedContent = sanitizeHtml(content)

    // Store edit history
    const editHistory = {
      content: comment.content,
      editedAt: new Date(),
    }

    const updatedComment = await this.db.comment.update({
      where: { id: commentId },
      data: {
        content: sanitizedContent,
        edited: true,
        editedAt: new Date(),
        editHistory: {
          push: editHistory,
        },
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })

    return updatedComment
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId },
      select: { 
        authorId: true, 
        postId: true,
        _count: {
          select: { replies: true },
        },
      },
    })

    if (!comment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    if (comment.authorId !== userId) {
      // Check if user is admin/moderator
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this comment',
        })
      }
    }

    // Soft delete
    await this.db.comment.update({
      where: { id: commentId },
      data: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: '[Deleted]',
      },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId: comment.postId },
      data: { commentCount: { decrement: 1 } },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: comment.authorId },
      data: { totalComments: { decrement: 1 } },
    })

    return { success: true }
  }

  async getPostComments(params: {
    postId: string
    limit: number
    cursor?: string
    sortBy: 'newest' | 'oldest' | 'popular'
    viewerId?: string
  }) {
    const where: Prisma.CommentWhereInput = {
      postId: params.postId,
      deleted: false,
      parentId: null, // Top-level comments only
    }

    let orderBy: Prisma.CommentOrderByWithRelationInput = {}
    switch (params.sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'popular':
        orderBy = { reactions: { _count: 'desc' } }
        break
    }

    const comments = await this.db.comment.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        reactions: params.viewerId ? {
          where: { userId: params.viewerId },
          select: { type: true },
        } : false,
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
        // Include first 3 replies
        replies: {
          where: { deleted: false },
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            _count: {
              select: {
                reactions: true,
              },
            },
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (comments.length > params.limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: comments.map(comment => ({
        ...comment,
        isLiked: params.viewerId ? 
          comment.reactions.some(r => r.type === ReactionType.LIKE) : 
          false,
      })),
      nextCursor,
    }
  }

  async getCommentThread(commentId: string, maxDepth: number) {
    const rootComment = await this.db.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })

    if (!rootComment || rootComment.deleted) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Comment not found',
      })
    }

    // Recursively fetch replies up to maxDepth
    const fetchReplies = async (parentId: string, depth: number): Promise<any[]> => {
      if (depth >= maxDepth) return []

      const replies = await this.db.comment.findMany({
        where: {
          parentId,
          deleted: false,
        },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            include: {
              profile: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              replies: true,
            },
          },
        },
      })

      // Fetch replies for each comment
      const repliesWithChildren = await Promise.all(
        replies.map(async (reply) => ({
          ...reply,
          replies: await fetchReplies(reply.id, depth + 1),
        }))
      )

      return repliesWithChildren
    }

    const thread = {
      ...rootComment,
      replies: await fetchReplies(commentId, 1),
    }

    return thread
  }

  async likeComment(commentId: string, userId: string) {
    try {
      const reaction = await this.db.reaction.create({
        data: {
          commentId,
          userId,
          type: ReactionType.LIKE,
        },
      })

      // Get comment author
      const comment = await this.db.comment.findUnique({
        where: { id: commentId },
        select: { authorId: true, postId: true },
      })

      if (comment && comment.authorId !== userId) {
        // Create notification
        await this.notificationService.createNotification({
          type: 'COMMENT_LIKED',
          userId: comment.authorId,
          actorId: userId,
          entityId: commentId,
          entityType: 'comment',
          title: 'Your comment was liked',
          message: 'liked your comment',
          actionUrl: `/post/${comment.postId}#comment-${commentId}`,
        })
      }

      return reaction
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already liked this comment',
          })
        }
      }
      throw error
    }
  }

  async unlikeComment(commentId: string, userId: string) {
    await this.db.reaction.deleteMany({
      where: {
        commentId,
        userId,
        type: ReactionType.LIKE,
      },
    })

    return { success: true }
  }

  async reportComment(params: {
    commentId: string
    reporterId: string
    reason: string
    description?: string
  }) {
    const report = await this.db.report.create({
      data: {
        entityType: 'comment',
        entityId: params.commentId,
        reporterId: params.reporterId,
        reason: params.reason as any,
        description: params.description,
      },
    })

    // Update comment moderation status
    await this.db.comment.update({
      where: { id: params.commentId },
      data: {
        moderationStatus: ModerationStatus.UNDER_REVIEW,
      },
    })

    return report
  }

  async getUserComments(params: {
    userId: string
    limit: number
    cursor?: string
  }) {
    const comments = await this.db.comment.findMany({
      where: {
        authorId: params.userId,
        deleted: false,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (comments.length > params.limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: comments,
      nextCursor,
    }
  }

  private async processMentions(comment: any) {
    // Extract @mentions from content
    const mentionRegex = /@(\w+)/g
    const matches = comment.content.matchAll(mentionRegex)
    
    for (const match of matches) {
      const username = match[1]
      const mentionedUser = await this.db.user.findUnique({
        where: { username },
        select: { id: true },
      })

      if (mentionedUser && mentionedUser.id !== comment.authorId) {
        // Create mention record
        await this.db.mention.create({
          data: {
            mentionerId: comment.authorId,
            mentionedId: mentionedUser.id,
            commentId: comment.id,
            postId: comment.postId,
          },
        })

        // Send notification
        await this.notificationService.createNotification({
          type: 'MENTION',
          userId: mentionedUser.id,
          actorId: comment.authorId,
          entityId: comment.id,
          entityType: 'comment',
          title: 'You were mentioned',
          message: `mentioned you in a comment`,
          actionUrl: `/post/${comment.postId}#comment-${comment.id}`,
        })
      }
    }
  }
}

```

# src/server/services/event.service.ts
```ts
// src/server/services/event.service.ts
import { EventEmitter } from 'events'
import { redis } from '@/lib/redis'

export interface DomainEvent {
  name: string
  payload: any
  timestamp: Date
  userId?: string
  metadata?: Record<string, any>
}

export class EventService extends EventEmitter {
  private static instance: EventService
  private pubClient = redis.duplicate()
  private subClient = redis.duplicate()

  private constructor() {
    super()
    this.setMaxListeners(100) // Increase max listeners
    this.setupRedisSubscriptions()
  }

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  private setupRedisSubscriptions() {
    // Subscribe to Redis events for distributed systems
    this.subClient.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as DomainEvent
        super.emit(event.name, event)
      } catch (error) {
        console.error('Failed to parse Redis event:', error)
      }
    })

    // Subscribe to all domain events
    this.subClient.subscribe('domain:events').catch(console.error)
  }

  async emit(eventName: string, payload: any): Promise<void> {
    const event: DomainEvent = {
      name: eventName,
      payload,
      timestamp: new Date(),
      userId: payload.userId || payload.actorId,
      metadata: {
        source: process.env.NODE_ENV,
        version: '1.0.0',
      },
    }

    // Emit locally
    super.emit(eventName, event)

    // Publish to Redis for distributed systems
    await this.pubClient.publish('domain:events', JSON.stringify(event))

    // Log the event
    if (process.env.NODE_ENV === 'development') {
      console.log(`Event emitted: ${eventName}`, {
        userId: event.userId,
        timestamp: event.timestamp,
      })
    }

    // Store critical events in database for event sourcing
    if (this.isCriticalEvent(eventName)) {
      await this.storeEvent(event)
    }
  }

  onEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.on(eventName, handler)
  }

  offEvent(eventName: string, handler: (event: DomainEvent) => void): void {
    this.off(eventName, handler)
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'user.deleted',
      'post.deleted',
      'payment.completed',
      'subscription.changed',
      'moderation.action',
    ]
    return criticalEvents.some(e => eventName.startsWith(e))
  }

  private async storeEvent(event: DomainEvent): Promise<void> {
    // Store in Redis with TTL for event replay capability
    const key = `event:${event.name}:${Date.now()}`
    await this.pubClient.setex(key, 86400 * 7, JSON.stringify(event)) // 7 days TTL
  }

  // Utility method to replay events (for debugging or recovery)
  async replayEvents(
    eventName: string,
    from: Date,
    to: Date = new Date()
  ): Promise<DomainEvent[]> {
    const pattern = `event:${eventName}:*`
    const keys = await this.pubClient.keys(pattern)
    const events: DomainEvent[] = []

    for (const key of keys) {
      const data = await this.pubClient.get(key)
      if (data) {
        const event = JSON.parse(data) as DomainEvent
        const eventTime = new Date(event.timestamp)
        if (eventTime >= from && eventTime <= to) {
          events.push(event)
        }
      }
    }

    return events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  // Clean up connections
  async disconnect(): Promise<void> {
    await Promise.all([
      this.pubClient.quit(),
      this.subClient.quit(),
    ])
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()

```

# src/server/services/user.service.ts
```ts
// src/server/services/user.service.ts (OPTIMIZED VERSION)
import { PrismaClient, Prisma, UserRole, UserStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { generateUsername } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { GamificationService } from './gamification.service'
import { CacheService, CacheType } from './cache.service'

// Query builders for User model (addressing 70+ relations warning)
class UserQueryBuilder {
  // Basic profile - minimal fields for lists
  static basicProfile() {
    return {
      select: {
        id: true,
        username: true,
        image: true,
        role: true,
        verified: true,
        createdAt: true,
      }
    }
  }

  // Extended profile - for profile pages
  static extendedProfile() {
    return {
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        verified: true,
        createdAt: true,
        lastSeenAt: true,
        profile: {
          select: {
            displayName: true,
            location: true,
            website: true,
            bio: true,
            interests: true,
            skills: true,
            pronouns: true,
            socialLinks: true,
          }
        },
        stats: true,
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          }
        }
      }
    }
  }

  // Dashboard view - for authenticated user
  static dashboardView() {
    return {
      select: {
        ...this.extendedProfile().select,
        sparklePoints: true,
        premiumPoints: true,
        experience: true,
        level: true,
        balance: true,
        subscription: true,
        notificationPrefs: true,
        _count: {
          select: {
            ...this.extendedProfile().select._count.select,
            notifications: { where: { read: false } },
          }
        }
      }
    }
  }
}

export class UserService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private gamificationService: GamificationService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.gamificationService = new GamificationService(db)
    this.cacheService = new CacheService()
  }

  async getProfileByUsername(username: string) {
    // Use cache with proper type
    const cacheKey = `user:${username}`
    const cached = await this.cacheService.get(cacheKey, CacheType.USER_PROFILE)
    if (cached) return cached

    // Use optimized query pattern
    const user = await this.db.user.findUnique({
      where: { username },
      ...UserQueryBuilder.extendedProfile(),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    if (user.status === UserStatus.BANNED) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This user has been banned',
      })
    }

    // Update last seen in background (don't wait)
    this.db.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    }).catch(console.error)

    // Cache the result
    await this.cacheService.set(cacheKey, user, undefined, CacheType.USER_PROFILE)

    return user
  }

  async getProfileById(userId: string) {
    // Use dashboard view for authenticated user's own profile
    const user = await this.db.user.findUnique({
      where: { id: userId },
      ...UserQueryBuilder.dashboardView(),
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    // Get recent achievements separately (avoid loading all)
    const recentAchievements = await this.db.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
      take: 10,
      include: {
        achievement: true,
      },
    })

    return {
      ...user,
      recentAchievements,
    }
  }

  async followUser(followerId: string, followingId: string) {
    try {
      // Use transaction for atomic operations
      const result = await this.db.$transaction(async (tx) => {
        // Create follow relationship
        const follow = await tx.follow.create({
          data: {
            followerId,
            followingId,
          },
        })

        // Update stats
        await Promise.all([
          tx.userStats.update({
            where: { userId: followerId },
            data: { totalFollowing: { increment: 1 } },
          }),
          tx.userStats.update({
            where: { userId: followingId },
            data: { totalFollowers: { increment: 1 } },
          }),
        ])

        return follow
      })

      // Award XP for following
      await this.gamificationService.awardXP(
        followerId,
        XP_REWARDS.FOLLOW,
        'follow',
        followingId
      )

      // Award XP for being followed
      await this.gamificationService.awardXP(
        followingId,
        XP_REWARDS.FOLLOWED,
        'followed',
        followerId
      )

      // Create notification
      await this.notificationService.createNotification({
        type: 'USER_FOLLOWED',
        userId: followingId,
        actorId: followerId,
        entityId: followerId,
        entityType: 'user',
        title: 'New follower',
        message: 'started following you',
      })

      // Track activity
      await this.activityService.trackActivity({
        userId: followerId,
        action: 'user.followed',
        entityType: 'user',
        entityId: followingId,
      })

      // Update quest progress
      await this.gamificationService.updateQuestProgress(
        followerId,
        'FOLLOW_USERS'
      )

      // Invalidate caches
      await Promise.all([
        this.cacheService.invalidate(`user:${followerId}`),
        this.cacheService.invalidate(`user:${followingId}`),
      ])

      return result
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already following this user',
          })
        }
      }
      throw error
    }
  }

  async searchUsers(query: string, limit: number) {
    // Use basic profile for search results
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
        status: UserStatus.ACTIVE,
      },
      ...UserQueryBuilder.basicProfile(),
      orderBy: [
        { verified: 'desc' },
        { stats: { totalFollowers: 'desc' } },
      ],
      take: limit,
    })
  }

  // ... rest of the methods remain similar but use query builders
}

```

# src/server/services/notification.service.ts
```ts
// src/server/services/notification.service.ts
import { PrismaClient, NotificationType } from '@prisma/client'
import { eventService } from './event.service'

export class NotificationService {
  constructor(private db: PrismaClient) {}

  async createNotification(params: {
    type: string
    userId: string
    actorId?: string
    entityId?: string
    entityType?: string
    title: string
    message: string
    data?: any
    imageUrl?: string
    actionUrl?: string
    priority?: number
  }) {
    try {
      // Check user notification preferences
      const prefs = await this.db.notificationPreference.findUnique({
        where: { userId: params.userId },
      })

      // Check if this notification type is enabled
      const notificationTypeKey = this.getPreferenceKey(params.type)
      if (prefs && notificationTypeKey && !prefs[notificationTypeKey]) {
        return null // User has disabled this notification type
      }

      // Create notification
      const notification = await this.db.notification.create({
        data: {
          type: params.type as NotificationType,
          userId: params.userId,
          actorId: params.actorId,
          entityId: params.entityId,
          entityType: params.entityType,
          title: params.title,
          message: params.message,
          data: params.data,
          imageUrl: params.imageUrl,
          actionUrl: params.actionUrl,
          priority: params.priority || 0,
        },
        include: {
          actor: {
            include: {
              profile: true,
            },
          },
        },
      })

      // Emit real-time notification
      eventService.emit('notification.created', {
        userId: params.userId,
        notification,
      })

      // Queue email notification if enabled
      if (prefs?.emailNotifications) {
        await this.queueEmailNotification(notification)
      }

      // Queue push notification if enabled
      if (prefs?.pushNotifications) {
        await this.queuePushNotification(notification)
      }

      return notification
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.db.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async markAllAsRead(userId: string) {
    return this.db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  }

  async getUnreadCount(userId: string) {
    const count = await this.db.notification.count({
      where: {
        userId,
        read: false,
      },
    })
    return { count }
  }

  private getPreferenceKey(notificationType: string): keyof NotificationPreference | null {
    const mapping: Record<string, keyof NotificationPreference> = {
      'POST_LIKED': 'postLikes',
      'POST_COMMENTED': 'postComments',
      'COMMENT_LIKED': 'postComments',
      'USER_FOLLOWED': 'newFollowers',
      'MENTION': 'mentions',
      'DIRECT_MESSAGE': 'directMessages',
      'GROUP_INVITE': 'groupInvites',
      'EVENT_REMINDER': 'eventReminders',
    }
    return mapping[notificationType] || null
  }

  private async queueEmailNotification(notification: any) {
    // TODO: Implement email queue
    console.log('Queueing email notification:', notification.id)
  }

  private async queuePushNotification(notification: any) {
    // TODO: Implement push notification queue
    console.log('Queueing push notification:', notification.id)
  }
}

```

# src/server/services/realtime.service.ts
```ts
// src/server/services/realtime.service.ts
import { Server as HTTPServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'
import { redisClient } from '@/lib/redis'

export class RealtimeService {
  private io: SocketServer
  private db: PrismaClient

  constructor(server: HTTPServer, db: PrismaClient) {
    this.db = db
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
    })

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = verify(token, process.env.JWT_SECRET!) as any
        const user = await this.db.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, role: true },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.user = user
        next()
      } catch (error) {
        next(new Error('Invalid token'))
      }
    })
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      const user = socket.data.user
      console.log(`User ${user.username} connected`)

      // Join user's personal room
      socket.join(`user:${user.id}`)

      // Update online status
      await this.setUserOnline(user.id, socket.id)

      // Join followed users' activity rooms
      const following = await this.db.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      })
      
      for (const follow of following) {
        socket.join(`activity:${follow.followingId}`)
      }

      // Event handlers
      socket.on('join:post', async (postId: string) => {
        socket.join(`post:${postId}`)
        await this.updatePresence(user.id, 'post', postId)
      })

      socket.on('leave:post', async (postId: string) => {
        socket.leave(`post:${postId}`)
      })

      socket.on('join:watchParty', async (partyId: string) => {
        socket.join(`party:${partyId}`)
        await this.updatePresence(user.id, 'watchParty', partyId)
      })

      socket.on('typing:start', async (data: { channelId: string }) => {
        socket.to(data.channelId).emit('user:typing', {
          userId: user.id,
          username: user.username,
        })
      })

      socket.on('typing:stop', async (data: { channelId: string }) => {
        socket.to(data.channelId).emit('user:stopTyping', {
          userId: user.id,
        })
      })

      socket.on('disconnect', async () => {
        console.log(`User ${user.username} disconnected`)
        await this.setUserOffline(user.id, socket.id)
      })
    })
  }

  // Public methods for emitting events
  async notifyUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  async notifyFollowers(userId: string, event: string, data: any) {
    this.io.to(`activity:${userId}`).emit(event, data)
  }

  async notifyPost(postId: string, event: string, data: any) {
    this.io.to(`post:${postId}`).emit(event, data)
  }

  async notifyWatchParty(partyId: string, event: string, data: any) {
    this.io.to(`party:${partyId}`).emit(event, data)
  }

  // Online status management
  private async setUserOnline(userId: string, socketId: string) {
    await this.db.websocketSession.create({
      data: {
        userId,
        socketId,
      },
    })

    await this.db.user.update({
      where: { id: userId },
      data: { onlineStatus: true },
    })

    // Store in Redis for quick access
    await redisClient.sadd(`online:users`, userId)
    
    // Notify followers
    this.notifyFollowers(userId, 'user:online', { userId })
  }

  private async setUserOffline(userId: string, socketId: string) {
    await this.db.websocketSession.delete({
      where: { socketId },
    })

    // Check if user has other active sessions
    const activeSessions = await this.db.websocketSession.count({
      where: { userId },
    })

    if (activeSessions === 0) {
      await this.db.user.update({
        where: { id: userId },
        data: { onlineStatus: false },
      })

      // Remove from Redis
      await redisClient.srem(`online:users`, userId)
      
      // Notify followers
      this.notifyFollowers(userId, 'user:offline', { userId })
    }
  }

  private async updatePresence(userId: string, type: string, location: string) {
    await this.db.presenceTracking.upsert({
      where: {
        userId_location: {
          userId,
          location,
        },
      },
      create: {
        userId,
        location,
        locationType: type,
      },
      update: {
        lastActiveAt: new Date(),
      },
    })
  }
}

```

# src/server/services/post.service.ts
```ts
// src/server/services/post.service.ts
import { 
  PrismaClient, 
  Prisma, 
  ContentStatus,
  ModerationStatus,
  ReactionType 
} from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { generateSlug, extractExcerpt, calculateReadingTime } from '@/lib/utils'
import { NotificationService } from './notification.service'
import { ActivityService } from './activity.service'
import { AchievementService } from './achievement.service'

export class PostService {
  private notificationService: NotificationService
  private activityService: ActivityService
  private achievementService: AchievementService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.activityService = new ActivityService(db)
    this.achievementService = new AchievementService(db)
  }

  async createPost(input: {
    title: string
    content: string
    excerpt?: string
    tags?: string[]
    categoryId?: string
    authorId: string
    youtubeVideoId?: string
    seriesId?: string
    seriesOrder?: number
    isDraft?: boolean
  }) {
    const slug = await this.generateUniqueSlug(input.title)
    const excerpt = input.excerpt || extractExcerpt(input.content)
    const readingTime = calculateReadingTime(input.content)
    const wordCount = input.content.split(/\s+/).length

    const post = await this.db.post.create({
      data: {
        title: input.title,
        content: input.content,
        excerpt,
        slug,
        authorId: input.authorId,
        categoryId: input.categoryId,
        youtubeVideoId: input.youtubeVideoId,
        seriesId: input.seriesId,
        seriesOrder: input.seriesOrder,
        readingTime,
        wordCount,
        isDraft: input.isDraft || false,
        published: !input.isDraft,
        publishedAt: !input.isDraft ? new Date() : null,
        contentStatus: input.isDraft 
          ? ContentStatus.DRAFT 
          : ContentStatus.PUBLISHED,
        tags: input.tags ? {
          connectOrCreate: input.tags.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag,
              slug: generateSlug(tag),
            },
          })),
        } : undefined,
        stats: {
          create: {},
        },
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId: input.authorId },
      data: { totalPosts: { increment: 1 } },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.authorId,
      action: 'post.created',
      entityType: 'post',
      entityId: post.id,
      entityData: {
        title: post.title,
        slug: post.slug,
      },
    })

    // Check achievements
    await this.achievementService.checkPostAchievements(input.authorId)

    // Send notifications to followers (if published)
    if (!input.isDraft) {
      await this.notifyFollowers(post)
    }

    return post
  }

  async updatePost(
    postId: string,
    userId: string,
    input: Partial<{
      title: string
      content: string
      excerpt: string
      tags: string[]
      categoryId: string
      youtubeVideoId: string
    }>
  ) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to edit this post',
      })
    }

    // Calculate new values if content changed
    let updateData: any = { ...input }
    if (input.content) {
      updateData.readingTime = calculateReadingTime(input.content)
      updateData.wordCount = input.content.split(/\s+/).length
      if (!input.excerpt) {
        updateData.excerpt = extractExcerpt(input.content)
      }
    }

    // Update the post
    const updatedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        lastEditedAt: new Date(),
        tags: input.tags ? {
          set: [], // Clear existing tags
          connectOrCreate: input.tags.map(tag => ({
            where: { name: tag },
            create: { 
              name: tag,
              slug: generateSlug(tag),
            },
          })),
        } : undefined,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    // Create revision
    await this.db.postRevision.create({
      data: {
        postId,
        editorId: userId,
        title: post.title,
        content: post.content,
        version: await this.getNextRevisionVersion(postId),
        changeNote: 'Post updated',
      },
    })

    return updatedPost
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to delete this post',
      })
    }

    // Soft delete
    const deletedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        contentStatus: ContentStatus.DELETED,
        deletedAt: new Date(),
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId },
      data: { totalPosts: { decrement: 1 } },
    })

    return deletedPost
  }

  async getPostBySlug(slug: string, viewerId?: string) {
    const post = await this.db.post.findUnique({
      where: { 
        slug,
        contentStatus: ContentStatus.PUBLISHED,
      },
      include: {
        author: {
          include: {
            profile: true,
            stats: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        series: {
          include: {
            posts: {
              where: { 
                published: true,
                contentStatus: ContentStatus.PUBLISHED,
              },
              orderBy: { seriesOrder: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                seriesOrder: true,
              },
            },
          },
        },
        poll: {
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    // Check if user has blocked the author
    if (viewerId) {
      const blocked = await this.db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: viewerId,
            blockedId: post.authorId,
          },
        },
      })

      if (blocked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Content not available',
        })
      }
    }

    // Increment view count
    await this.incrementViewCount(post.id, viewerId)

    // Check if viewer has liked the post
    let isLiked = false
    let userReaction = null
    if (viewerId) {
      const reaction = await this.db.reaction.findUnique({
        where: {
          postId_userId_type: {
            postId: post.id,
            userId: viewerId,
            type: ReactionType.LIKE,
          },
        },
      })
      isLiked = !!reaction
      userReaction = reaction
    }

    return {
      ...post,
      isLiked,
      userReaction,
    }
  }

  async getPostById(postId: string, viewerId?: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          include: {
            profile: true,
            stats: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    // Allow author to see their own drafts
    if (post.isDraft && post.authorId !== viewerId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    return post
  }

  async listPosts(params: {
    limit: number
    cursor?: string
    authorId?: string
    categoryId?: string
    tag?: string
    featured?: boolean
    sortBy?: 'latest' | 'popular' | 'trending'
    userId?: string // Viewer ID
  }) {
    const where: Prisma.PostWhereInput = {
      published: true,
      contentStatus: ContentStatus.PUBLISHED,
      authorId: params.authorId,
      categoryId: params.categoryId,
      featured: params.featured,
      tags: params.tag ? {
        some: { name: params.tag },
      } : undefined,
    }

    // Exclude posts from blocked users
    if (params.userId) {
      const blockedUsers = await this.db.block.findMany({
        where: { blockerId: params.userId },
        select: { blockedId: true },
      })
      const blockedIds = blockedUsers.map(b => b.blockedId)
      
      where.authorId = {
        notIn: blockedIds,
      }
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }
    if (params.sortBy === 'popular') {
      orderBy = { stats: { totalReactionCount: 'desc' } }
    } else if (params.sortBy === 'trending') {
      orderBy = { stats: { engagementRate: 'desc' } }
    }

    const posts = await this.db.post.findMany({
      where,
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy,
    })

    let nextCursor: string | undefined = undefined
    if (posts.length > params.limit) {
      const nextItem = posts.pop()
      nextCursor = nextItem!.id
    }

    // Check which posts are liked by the viewer
    let likedPostIds: string[] = []
    if (params.userId) {
      const reactions = await this.db.reaction.findMany({
        where: {
          userId: params.userId,
          postId: { in: posts.map(p => p.id) },
          type: ReactionType.LIKE,
        },
        select: { postId: true },
      })
      likedPostIds = reactions.map(r => r.postId)
    }

    return {
      items: posts.map(post => ({
        ...post,
        isLiked: likedPostIds.includes(post.id),
      })),
      nextCursor,
    }
  }

  async getUserFeed(userId: string, params: {
    limit: number
    cursor?: string
  }) {
    // Get users that the viewer follows
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    const followingIds = following.map(f => f.followingId)

    // Include the user's own posts
    followingIds.push(userId)

    return this.listPosts({
      ...params,
      authorId: { in: followingIds } as any,
      userId,
    })
  }

  async getTrendingPosts(params: {
    period: 'day' | 'week' | 'month' | 'all'
    limit: number
  }) {
    let dateFilter: Date | undefined
    const now = new Date()
    
    switch (params.period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const posts = await this.db.post.findMany({
      where: {
        published: true,
        contentStatus: ContentStatus.PUBLISHED,
        publishedAt: dateFilter ? { gte: dateFilter } : undefined,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { stats: { engagementRate: 'desc' } },
        { stats: { totalReactionCount: 'desc' } },
        { stats: { viewCount: 'desc' } },
      ],
      take: params.limit,
    })

    return posts
  }

  async likePost(postId: string, userId: string, type: ReactionType) {
    try {
      // Create reaction
      const reaction = await this.db.reaction.create({
        data: {
          postId,
          userId,
          type,
        },
      })

      // Update post stats
      await this.db.postStats.update({
        where: { postId },
        data: {
          totalReactionCount: { increment: 1 },
          [`${type.toLowerCase()}Count`]: { increment: 1 },
        },
      })

      // Update user stats
      await this.db.userStats.update({
        where: { userId },
        data: { totalLikesGiven: { increment: 1 } },
      })

      // Get post author
      const post = await this.db.post.findUnique({
        where: { id: postId },
        select: { authorId: true, title: true },
      })

      if (post && post.authorId !== userId) {
        // Update author stats
        await this.db.userStats.update({
          where: { userId: post.authorId },
          data: { totalLikesReceived: { increment: 1 } },
        })

        // Create notification
        await this.notificationService.createNotification({
          type: 'POST_LIKED',
          userId: post.authorId,
          actorId: userId,
          entityId: postId,
          entityType: 'post',
          message: `reacted to your post "${post.title}"`,
          data: { reactionType: type },
        })
      }

      // Track activity
      await this.activityService.trackActivity({
        userId,
        action: 'post.liked',
        entityType: 'post',
        entityId: postId,
        metadata: { type },
      })

      return reaction
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Already reacted to this post',
          })
        }
      }
      throw error
    }
  }

  async unlikePost(postId: string, userId: string) {
    const reaction = await this.db.reaction.findFirst({
      where: {
        postId,
        userId,
      },
    })

    if (!reaction) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Reaction not found',
      })
    }

    // Delete reaction
    await this.db.reaction.delete({
      where: { id: reaction.id },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId },
      data: {
        totalReactionCount: { decrement: 1 },
        [`${reaction.type.toLowerCase()}Count`]: { decrement: 1 },
      },
    })

    // Update user stats
    await this.db.userStats.update({
      where: { userId },
      data: { totalLikesGiven: { decrement: 1 } },
    })

    // Get post author
    const post = await this.db.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (post && post.authorId !== userId) {
      // Update author stats
      await this.db.userStats.update({
        where: { userId: post.authorId },
        data: { totalLikesReceived: { decrement: 1 } },
      })
    }
  }

  async bookmarkPost(params: {
    postId: string
    userId: string
    folderId?: string
    notes?: string
  }) {
    try {
      const bookmark = await this.db.bookmark.create({
        data: {
          postId: params.postId,
          userId: params.userId,
          folderId: params.folderId,
          notes: params.notes,
        },
      })

      // Update post stats
      await this.db.postStats.update({
        where: { postId: params.postId },
        data: { bookmarkCount: { increment: 1 } },
      })

      return bookmark
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Post already bookmarked',
          })
        }
      }
      throw error
    }
  }

  async unbookmarkPost(postId: string, userId: string) {
    await this.db.bookmark.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    // Update post stats
    await this.db.postStats.update({
      where: { postId },
      data: { bookmarkCount: { decrement: 1 } },
    })
  }

  async getUserBookmarks(params: {
    userId: string
    folderId?: string
    limit: number
    cursor?: string
  }) {
    const bookmarks = await this.db.bookmark.findMany({
      where: {
        userId: params.userId,
        folderId: params.folderId,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      include: {
        post: {
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            category: true,
            tags: true,
            stats: true,
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        },
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    let nextCursor: string | undefined = undefined
    if (bookmarks.length > params.limit) {
      const nextItem = bookmarks.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: bookmarks,
      nextCursor,
    }
  }

  async sharePost(postId: string, platform: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      select: { 
        title: true, 
        slug: true,
        excerpt: true,
      },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    const postUrl = `${process.env.NEXT_PUBLIC_APP_URL}/post/${post.slug}`
    const encodedUrl = encodeURIComponent(postUrl)
    const encodedTitle = encodeURIComponent(post.title)
    const encodedExcerpt = encodeURIComponent(post.excerpt || '')

    let shareUrl: string
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'copy':
        shareUrl = postUrl
        break
      default:
        shareUrl = postUrl
    }

    // Update share count
    await this.db.postStats.update({
      where: { postId },
      data: { shareCount: { increment: 1 } },
    })

    return shareUrl
  }

  async reportPost(params: {
    postId: string
    reporterId: string
    reason: string
    description?: string
  }) {
    const report = await this.db.report.create({
      data: {
        entityType: 'post',
        entityId: params.postId,
        reporterId: params.reporterId,
        reason: params.reason as any,
        description: params.description,
      },
    })

    // Update post moderation status
    await this.db.post.update({
      where: { id: params.postId },
      data: {
        moderationStatus: ModerationStatus.UNDER_REVIEW,
      },
    })

    return report
  }

  async getRelatedPosts(postId: string, limit: number) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    })

    if (!post) return []

    const tagIds = post.tags.map(t => t.id)

    // Find posts with similar tags
    const relatedPosts = await this.db.post.findMany({
      where: {
        AND: [
          { id: { not: postId } },
          { published: true },
          { contentStatus: ContentStatus.PUBLISHED },
          {
            OR: [
              { categoryId: post.categoryId },
              { tags: { some: { id: { in: tagIds } } } },
              { authorId: post.authorId },
            ],
          },
        ],
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        category: true,
        tags: true,
        stats: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: [
        { stats: { engagementRate: 'desc' } },
        { publishedAt: 'desc' },
      ],
      take: limit,
    })

    return relatedPosts
  }

  async getPostSeries(seriesId: string) {
    const series = await this.db.postSeries.findUnique({
      where: { id: seriesId },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        posts: {
          where: {
            published: true,
            contentStatus: ContentStatus.PUBLISHED,
          },
          orderBy: { seriesOrder: 'asc' },
          include: {
            author: {
              include: {
                profile: true,
              },
            },
            stats: true,
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        },
      },
    })

    if (!series) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Series not found',
      })
    }

    return series
  }

  async togglePublishStatus(postId: string, userId: string) {
    const post = await this.db.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Post not found',
      })
    }

    if (post.authorId !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized',
      })
    }

    const updatedPost = await this.db.post.update({
      where: { id: postId },
      data: {
        published: !post.published,
        isDraft: post.published,
        publishedAt: !post.published ? new Date() : post.publishedAt,
        contentStatus: !post.published 
          ? ContentStatus.PUBLISHED 
          : ContentStatus.DRAFT,
      },
    })

    // Send notifications if newly published
    if (!post.published && updatedPost.published) {
      await this.notifyFollowers(updatedPost)
    }

    return updatedPost
  }

  // Helper methods
  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = generateSlug(title)
    let counter = 1

    while (await this.db.post.findUnique({ where: { slug } })) {
      slug = `${generateSlug(title)}-${counter}`
      counter++
    }

    return slug
  }

  private async incrementViewCount(postId: string, viewerId?: string) {
    // Simple view count increment
    await this.db.postStats.update({
      where: { postId },
      data: { viewCount: { increment: 1 } },
    })

    // Track unique views if viewer is logged in
    if (viewerId) {
      const existingView = await this.db.viewHistory.findFirst({
        where: {
          postId,
          userId: viewerId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      })

      if (!existingView) {
        await this.db.viewHistory.create({
          data: {
            postId,
            userId: viewerId,
          },
        })

        await this.db.postStats.update({
          where: { postId },
          data: { uniqueViewCount: { increment: 1 } },
        })
      }
    }

    // Update engagement rate
    await this.updateEngagementRate(postId)
  }

  private async updateEngagementRate(postId: string) {
    const stats = await this.db.postStats.findUnique({
      where: { postId },
    })

    if (!stats) return

    // Calculate engagement rate
    const engagementRate = stats.viewCount > 0
      ? ((stats.totalReactionCount + stats.commentCount + stats.shareCount) / stats.viewCount) * 100
      : 0

    await this.db.postStats.update({
      where: { postId },
      data: { engagementRate },
    })
  }

  private async getNextRevisionVersion(postId: string): Promise<number> {
    const lastRevision = await this.db.postRevision.findFirst({
      where: { postId },
      orderBy: { version: 'desc' },
    })

    return (lastRevision?.version || 0) + 1
  }

  private async notifyFollowers(post: any) {
    // Get all followers of the post author
    const followers = await this.db.follow.findMany({
      where: {
        followingId: post.authorId,
        notifyNewPosts: true,
      },
      select: { followerId: true },
    })

    // Create notifications for each follower
    const notifications = followers.map(f => ({
      type: 'USER_POSTED' as const,
      userId: f.followerId,
      actorId: post.authorId,
      entityId: post.id,
      entityType: 'post',
      message: `published a new post: "${post.title}"`,
      title: 'New Post',
    }))

    // Bulk create notifications
    for (const notification of notifications) {
      await this.notificationService.createNotification(notification)
    }
  }
}

```

# src/server/services/watch-party.service.ts
```ts
// src/server/services/watch-party.service.ts
import { PrismaClient, EventStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NotificationService } from './notification.service'
import { generateSecureToken } from '@/lib/security'

export class WatchPartyService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async createWatchParty(input: {
    title: string
    description?: string
    youtubeVideoId: string
    scheduledStart: Date
    maxParticipants: number
    isPublic: boolean
    hostId: string
  }) {
    // Generate unique party code
    const partyCode = generateSecureToken(6).toUpperCase()

    const watchParty = await this.db.watchParty.create({
      data: {
        ...input,
        partyCode,
        youtubeVideoUrl: `https://youtube.com/watch?v=${input.youtubeVideoId}`,
        currentParticipants: 1, // Host counts as participant
      },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
      },
    })

    // Add host as participant
    await this.db.watchPartyParticipant.create({
      data: {
        partyId: watchParty.id,
        userId: input.hostId,
        role: 'host',
      },
    })

    // Notify followers if public
    if (input.isPublic) {
      const followers = await this.db.follow.findMany({
        where: { followingId: input.hostId },
        select: { followerId: true },
      })

      for (const follower of followers) {
        await this.notificationService.createNotification({
          type: 'WATCH_PARTY_INVITE',
          userId: follower.followerId,
          actorId: input.hostId,
          entityId: watchParty.id,
          entityType: 'watchParty',
          title: 'Watch Party Starting Soon',
          message: `is hosting "${watchParty.title}"`,
          actionUrl: `/watch-party/${watchParty.id}`,
        })
      }
    }

    return watchParty
  }

  async joinParty(partyId: string, userId: string) {
    const party = await this.db.watchParty.findUnique({
      where: { id: partyId },
      include: { participants: true },
    })

    if (!party) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Watch party not found',
      })
    }

    if (party.currentParticipants >= party.maxParticipants) {
      throw new TRPCError({
        code: 'RESOURCE_EXHAUSTED',
        message: 'Watch party is full',
      })
    }

    // Check if already participant
    const existing = party.participants.find(p => p.userId === userId)
    if (existing) {
      return existing
    }

    // Add participant
    const participant = await this.db.watchPartyParticipant.create({
      data: {
        partyId,
        userId,
        role: 'viewer',
      },
    })

    // Update participant count
    await this.db.watchParty.update({
      where: { id: partyId },
      data: { currentParticipants: { increment: 1 } },
    })

    return participant
  }

  async getUpcomingParties(params: {
    limit: number
    cursor?: string
  }) {
    const parties = await this.db.watchParty.findMany({
      where: {
        isPublic: true,
        scheduledStart: { gte: new Date() },
        cancelledAt: null,
      },
      take: params.limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { scheduledStart: 'asc' },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
        video: true,
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    let nextCursor: string | undefined = undefined
    if (parties.length > params.limit) {
      const nextItem = parties.pop()
      nextCursor = nextItem!.id
    }

    return {
      items: parties,
      nextCursor,
    }
  }
}

```

# src/server/services/activity.service.ts
```ts
// src/server/services/activity.service.ts
import { PrismaClient } from '@prisma/client'

export class ActivityService {
  constructor(private db: PrismaClient) {}

  async trackActivity(params: {
    userId: string
    action: string
    entityType: string
    entityId: string
    entityData?: any
    metadata?: any
  }) {
    try {
      await this.db.activityStream.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          entityData: params.entityData,
          metadata: params.metadata,
        },
      })

      // Update daily activity stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await this.db.userActivity.upsert({
        where: {
          userId_date: {
            userId: params.userId,
            date: today,
          },
        },
        update: {
          pageViews: { increment: 1 },
        },
        create: {
          userId: params.userId,
          date: today,
          pageViews: 1,
        },
      })
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  async getRecentActivity(userId: string, limit: number = 20) {
    return this.db.activityStream.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getActivityFeed(userId: string, limit: number = 50) {
    // Get users that the current user follows
    const following = await this.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    
    const followingIds = following.map(f => f.followingId)
    followingIds.push(userId) // Include own activities

    return this.db.activityStream.findMany({
      where: {
        userId: { in: followingIds },
        visibility: 'PUBLIC',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

```

# src/server/services/gamification.service.ts
```ts
// src/server/services/gamification.service.ts
import { PrismaClient, Prisma, BadgeRarity, QuestType, QuestStatus } from '@prisma/client'
import { NotificationService } from './notification.service'
import { CacheService, CacheType } from './cache.service'
import { redisUtils } from '@/lib/redis'
import Decimal from 'decimal.js'

// Export XP configuration for use in other services
export const XP_REWARDS = {
  POST_CREATE: 10,
  COMMENT_CREATE: 5,
  QUALITY_POST_BONUS: 50,
  HELPFUL_COMMENT: 20,
  DAILY_LOGIN: 10,
  FIRST_POST_OF_DAY: 15,
  STREAK_BONUS: 5,
  ACHIEVEMENT_UNLOCK: 25,
  QUEST_COMPLETE: 30,
  LEVEL_UP: 100,
  REACTION_GIVEN: 1,
  REACTION_RECEIVED: 2,
  FOLLOW: 3,
  FOLLOWED: 5,
} as const

export class GamificationService {
  private notificationService: NotificationService
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
    this.cacheService = new CacheService()
  }

  async awardXP(
    userId: string,
    amount: number,
    source: keyof typeof XP_REWARDS | string,
    sourceId?: string,
    reason?: string
  ) {
    // Start transaction for atomic operations
    const result = await this.db.$transaction(async (tx) => {
      // Get current user XP
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { experience: true, level: true },
      })

      if (!user) throw new Error('User not found')

      const oldLevel = user.level
      const newXP = user.experience + amount
      const newLevel = this.calculateLevel(newXP)

      // Update user XP and level
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          experience: newXP,
          level: newLevel,
        },
      })

      // Log XP transaction
      await tx.xpLog.create({
        data: {
          userId,
          amount,
          source: source.toString(),
          sourceId,
          reason: reason || `Earned ${amount} XP from ${source}`,
          totalXp: newXP,
        },
      })

      // Update user stats
      await tx.userStats.update({
        where: { userId },
        data: {
          totalXpEarned: { increment: amount },
        },
      })

      // Check for level up
      if (newLevel > oldLevel) {
        await this.handleLevelUp(tx, userId, oldLevel, newLevel)
      }

      return updatedUser
    })

    // Update leaderboards
    await Promise.all([
      redisUtils.addToLeaderboard('xp:daily', userId, result.experience),
      redisUtils.addToLeaderboard('xp:weekly', userId, result.experience),
      redisUtils.addToLeaderboard('xp:monthly', userId, result.experience),
      redisUtils.addToLeaderboard('xp:alltime', userId, result.experience),
    ])

    // Invalidate user cache
    await this.cacheService.invalidate(`user:${userId}`)

    return result
  }

  calculateLevel(xp: number): number {
    // Progressive level calculation from README
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  calculateXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100
  }

  private async handleLevelUp(
    tx: Prisma.TransactionClient,
    userId: string,
    oldLevel: number,
    newLevel: number
  ) {
    // Get level configuration
    const levelConfig = await tx.levelConfig.findUnique({
      where: { level: newLevel },
    })

    if (levelConfig) {
      // Award level rewards (using Int for points as per README)
      if (levelConfig.sparkleReward > 0) {
        await this.awardSparklePoints(tx, userId, levelConfig.sparkleReward, 'level_up')
      }

      if (levelConfig.premiumReward > 0) {
        await this.awardPremiumPoints(tx, userId, levelConfig.premiumReward, 'level_up')
      }

      // Award bonus XP for leveling up
      await tx.xpLog.create({
        data: {
          userId,
          amount: XP_REWARDS.LEVEL_UP,
          source: 'level_up',
          reason: `Reached level ${newLevel}!`,
          totalXp: 0, // Will be recalculated
        },
      })
    }

    // Send notification
    await this.notificationService.createNotification({
      type: 'LEVEL_UP',
      userId,
      entityType: 'level',
      entityId: newLevel.toString(),
      title: 'Level Up!',
      message: `Congratulations! You've reached level ${newLevel}!`,
      data: {
        oldLevel,
        newLevel,
        rewards: levelConfig,
      },
    })

    // Check level-based achievements
    await this.checkLevelAchievements(tx, userId, newLevel)
  }

  async awardSparklePoints(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
    amount: number, // Int type as per README
    source: string,
    sourceId?: string
  ) {
    // Ensure amount is integer
    const intAmount = Math.floor(amount)

    // Update user balance (using Int fields)
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        sparklePoints: { increment: intAmount },
      },
      select: { sparklePoints: true },
    })

    // Update user balance tracking
    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        sparklePoints: intAmount,
        premiumPoints: 0,
        lifetimeEarned: intAmount,
        lifetimeSpent: 0,
      },
      update: {
        sparklePoints: { increment: intAmount },
        lifetimeEarned: { increment: intAmount },
      },
    })

    // Log transaction
    await tx.pointTransaction.create({
      data: {
        userId,
        amount: intAmount,
        type: 'EARN',
        currency: 'SPARKLE',
        source,
        sourceId,
        balanceAfter: updatedUser.sparklePoints,
      },
    })

    return updatedUser.sparklePoints
  }

  async awardPremiumPoints(
    tx: Prisma.TransactionClient | PrismaClient,
    userId: string,
    amount: number, // Int type
    source: string,
    sourceId?: string
  ) {
    const intAmount = Math.floor(amount)

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        premiumPoints: { increment: intAmount },
      },
      select: { premiumPoints: true },
    })

    await tx.userBalance.upsert({
      where: { userId },
      create: {
        userId,
        sparklePoints: 0,
        premiumPoints: intAmount,
        lifetimeEarned: intAmount,
        lifetimeSpent: 0,
      },
      update: {
        premiumPoints: { increment: intAmount },
      },
    })

    await tx.pointTransaction.create({
      data: {
        userId,
        amount: intAmount,
        type: 'EARN',
        currency: 'PREMIUM',
        source,
        sourceId,
        balanceAfter: updatedUser.premiumPoints,
      },
    })

    return updatedUser.premiumPoints
  }

  async spendSparklePoints(
    userId: string,
    amount: number, // Int type
    reason: string,
    targetId?: string
  ): Promise<boolean> {
    const intAmount = Math.floor(amount)

    return this.db.$transaction(async (tx) => {
      // Check balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { sparklePoints: true },
      })

      if (!user || user.sparklePoints < intAmount) {
        return false // Insufficient balance
      }

      // Deduct points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          sparklePoints: { decrement: intAmount },
        },
        select: { sparklePoints: true },
      })

      // Update balance tracking
      await tx.userBalance.update({
        where: { userId },
        data: {
          sparklePoints: { decrement: intAmount },
          lifetimeSpent: { increment: intAmount },
        },
      })

      // Log transaction
      await tx.pointTransaction.create({
        data: {
          userId,
          amount: -intAmount,
          type: 'SPEND',
          currency: 'SPARKLE',
          source: reason,
          sourceId: targetId,
          balanceAfter: updatedUser.sparklePoints,
        },
      })

      return true
    })
  }

  async checkAndUnlockAchievements(userId: string, context: string) {
    const achievements = await this.db.achievement.findMany({
      where: {
        isActive: true,
        context, // e.g., 'post', 'comment', 'follow'
      },
    })

    for (const achievement of achievements) {
      await this.checkAchievement(userId, achievement)
    }
  }

  private async checkAchievement(userId: string, achievement: any) {
    // Check if already unlocked
    const existing = await this.db.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })

    if (existing && existing.unlockedAt) return

    // Check requirements (stored in JSON)
    const meetsRequirements = await this.evaluateAchievementRequirements(
      userId,
      achievement.requirements
    )

    if (meetsRequirements) {
      await this.unlockAchievement(userId, achievement.id)
    } else if (achievement.progressSteps > 1) {
      // Update progress for multi-step achievements
      const progress = await this.calculateAchievementProgress(
        userId,
        achievement.requirements
      )

      await this.db.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
        create: {
          userId,
          achievementId: achievement.id,
          progress,
          progressData: { current: progress, target: achievement.progressSteps },
        },
        update: {
          progress,
          progressData: { current: progress, target: achievement.progressSteps },
        },
      })
    }
  }

  private async unlockAchievement(userId: string, achievementId: string) {
    const achievement = await this.db.achievement.findUnique({
      where: { id: achievementId },
    })

    if (!achievement) return

    await this.db.$transaction(async (tx) => {
      // Unlock achievement
      await tx.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
        create: {
          userId,
          achievementId,
          progress: 1,
          unlockedAt: new Date(),
        },
        update: {
          progress: 1,
          unlockedAt: new Date(),
        },
      })

      // Award rewards (using Int for points)
      if (achievement.xpReward > 0) {
        // Note: awardXP needs to be called outside transaction or refactored
        await tx.xpLog.create({
          data: {
            userId,
            amount: achievement.xpReward,
            source: 'achievement',
            sourceId: achievementId,
            reason: `Unlocked achievement: ${achievement.name}`,
            totalXp: 0, // Will be recalculated
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: achievement.xpReward },
          },
        })
      }

      if (achievement.sparklePointsReward > 0) {
        await this.awardSparklePoints(
          tx,
          userId,
          achievement.sparklePointsReward,
          'achievement',
          achievementId
        )
      }

      // Update user stats
      await tx.userStats.update({
        where: { userId },
        data: {
          totalAchievements: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'ACHIEVEMENT_UNLOCKED',
      userId,
      entityId: achievementId,
      entityType: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You've unlocked "${achievement.name}"!`,
      imageUrl: achievement.iconUrl,
      data: {
        rarity: achievement.rarity,
        rewards: {
          xp: achievement.xpReward,
          sparklePoints: achievement.sparklePointsReward,
        },
      },
    })
  }

  async getActiveQuests(userId: string) {
    const now = new Date()

    // Get daily, weekly, and monthly quests
    const quests = await this.db.quest.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        userProgress: {
          where: { userId },
        },
      },
    })

    return quests.map(quest => ({
      ...quest,
      userProgress: quest.userProgress[0] || null,
    }))
  }

  async updateQuestProgress(
    userId: string,
    questType: string,
    progressIncrement: number = 1
  ) {
    const activeQuests = await this.db.quest.findMany({
      where: {
        type: questType as QuestType,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    })

    for (const quest of activeQuests) {
      const progress = await this.db.userQuest.upsert({
        where: {
          userId_questId: {
            userId,
            questId: quest.id,
          },
        },
        create: {
          userId,
          questId: quest.id,
          progress: progressIncrement,
          status: QuestStatus.IN_PROGRESS,
        },
        update: {
          progress: { increment: progressIncrement },
        },
      })

      // Check if quest completed
      const requirements = quest.requirements as any
      if (progress.progress >= (requirements.target || 1)) {
        await this.completeQuest(userId, quest.id)
      }
    }
  }

  private async completeQuest(userId: string, questId: string) {
    const quest = await this.db.quest.findUnique({
      where: { id: questId },
    })

    if (!quest) return

    await this.db.$transaction(async (tx) => {
      // Mark quest as completed
      await tx.userQuest.update({
        where: {
          userId_questId: {
            userId,
            questId,
          },
        },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: new Date(),
        },
      })

      // Award XP
      if (quest.xpReward > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: quest.xpReward },
          },
        })

        await tx.xpLog.create({
          data: {
            userId,
            amount: quest.xpReward,
            source: 'quest',
            sourceId: questId,
            reason: `Completed quest: ${quest.title}`,
            totalXp: 0,
          },
        })
      }

      // Award points
      if (quest.pointsReward > 0) {
        await this.awardSparklePoints(tx, userId, quest.pointsReward, 'quest', questId)
      }

      // Update stats
      await tx.userStats.update({
        where: { userId },
        data: {
          questsCompleted: { increment: 1 },
        },
      })
    })

    // Send notification
    await this.notificationService.createNotification({
      type: 'QUEST_COMPLETE',
      userId,
      entityId: questId,
      entityType: 'quest',
      title: 'Quest Completed!',
      message: `You've completed "${quest.title}"!`,
      data: {
        rewards: {
          xp: quest.xpReward,
          sparklePoints: quest.pointsReward,
        },
      },
    })
  }

  async getLeaderboard(
    type: 'xp' | 'sparklePoints' | 'achievements',
    period: 'daily' | 'weekly' | 'monthly' | 'alltime',
    limit: number = 10
  ) {
    const key = `${type}:${period}`
    const cached = await redisUtils.getLeaderboard(key, limit)

    if (cached.length > 0) {
      // Enrich with user data
      const userIds = cached.map(entry => entry.member)
      const users = await this.db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
        },
      })

      const userMap = new Map(users.map(u => [u.id, u]))

      return cached.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.member),
        score: Math.floor(entry.score),
      }))
    }

    // If no cache, compute from database
    return this.computeLeaderboard(type, period, limit)
  }

  private async computeLeaderboard(
    type: string,
    period: string,
    limit: number
  ) {
    let dateFilter: Date | undefined
    const now = new Date()

    switch (period) {
      case 'daily':
        const today = new Date(now)
        today.setHours(0, 0, 0, 0)
        dateFilter = today
        break
      case 'weekly':
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = weekAgo
        break
      case 'monthly':
        const monthAgo = new Date(now)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = monthAgo
        break
    }

    let users: any[] = []

    if (type === 'xp') {
      users = await this.db.user.findMany({
        where: dateFilter ? {
          createdAt: { gte: dateFilter },
        } : undefined,
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          experience: true,
        },
        orderBy: { experience: 'desc' },
        take: limit,
      })
    } else if (type === 'sparklePoints') {
      users = await this.db.user.findMany({
        where: dateFilter ? {
          createdAt: { gte: dateFilter },
        } : undefined,
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
          sparklePoints: true,
        },
        orderBy: { sparklePoints: 'desc' },
        take: limit,
      })
    } else if (type === 'achievements') {
      // Get users with most achievements
      const userAchievements = await this.db.userAchievement.groupBy({
        by: ['userId'],
        where: dateFilter ? {
          unlockedAt: { gte: dateFilter },
        } : { unlockedAt: { not: null } },
        _count: {
          achievementId: true,
        },
        orderBy: {
          _count: {
            achievementId: 'desc',
          },
        },
        take: limit,
      })

      const userIds = userAchievements.map(ua => ua.userId)
      const userMap = await this.db.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          image: true,
          level: true,
        },
      })

      const userDict = new Map(userMap.map(u => [u.id, u]))
      
      users = userAchievements.map(ua => ({
        ...userDict.get(ua.userId),
        achievementCount: ua._count.achievementId,
      }))
    }

    // Cache the results
    const cacheKey = `${type}:${period}`
    for (const [index, user] of users.entries()) {
      let score = 0
      if (type === 'xp') score = user.experience
      else if (type === 'sparklePoints') score = user.sparklePoints
      else if (type === 'achievements') score = user.achievementCount
      
      await redisUtils.addToLeaderboard(cacheKey, user.id, score)
    }

    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user.id,
        username: user.username,
        image: user.image,
        level: user.level,
      },
      score: type === 'xp' ? user.experience : 
             type === 'sparklePoints' ? user.sparklePoints :
             user.achievementCount,
    }))
  }

  private async evaluateAchievementRequirements(
    userId: string,
    requirements: any
  ): Promise<boolean> {
    if (!requirements) return false

    // Post count requirement
    if (requirements.type === 'posts' && requirements.count) {
      const count = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
        },
      })
      return count >= requirements.count
    }

    // Comment count requirement
    if (requirements.type === 'comments' && requirements.count) {
      const count = await this.db.comment.count({
        where: { 
          authorId: userId,
          deleted: false,
        },
      })
      return count >= requirements.count
    }

    // Follower count requirement
    if (requirements.type === 'followers' && requirements.count) {
      const count = await this.db.follow.count({
        where: { followingId: userId },
      })
      return count >= requirements.count
    }

    // Level requirement
    if (requirements.type === 'level' && requirements.level) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { level: true },
      })
      return (user?.level || 0) >= requirements.level
    }

    // XP requirement
    if (requirements.type === 'xp' && requirements.amount) {
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { experience: true },
      })
      return (user?.experience || 0) >= requirements.amount
    }

    return false
  }

  private async calculateAchievementProgress(
    userId: string,
    requirements: any
  ): Promise<number> {
    if (!requirements) return 0

    if (requirements.type === 'posts' && requirements.count) {
      const count = await this.db.post.count({
        where: { 
          authorId: userId,
          published: true,
        },
      })
      return Math.min(count / requirements.count, 1)
    }

    if (requirements.type === 'comments' && requirements.count) {
      const count = await this.db.comment.count({
        where: { 
          authorId: userId,
          deleted: false,
        },
      })
      return Math.min(count / requirements.count, 1)
    }

    return 0
  }

  private async checkLevelAchievements(
    tx: Prisma.TransactionClient,
    userId: string,
    level: number
  ) {
    const levelAchievements = [
      { level: 10, code: 'LEVEL_10' },
      { level: 25, code: 'LEVEL_25' },
      { level: 50, code: 'LEVEL_50' },
      { level: 100, code: 'LEVEL_100' },
    ]

    for (const achievement of levelAchievements) {
      if (level >= achievement.level) {
        const dbAchievement = await tx.achievement.findUnique({
          where: { code: achievement.code },
        })

        if (dbAchievement) {
          // Check if not already unlocked
          const existing = await tx.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId,
                achievementId: dbAchievement.id,
              },
            },
          })

          if (!existing || !existing.unlockedAt) {
            await tx.userAchievement.upsert({
              where: {
                userId_achievementId: {
                  userId,
                  achievementId: dbAchievement.id,
                },
              },
              create: {
                userId,
                achievementId: dbAchievement.id,
                progress: 1,
                unlockedAt: new Date(),
              },
              update: {
                progress: 1,
                unlockedAt: new Date(),
              },
            })
          }
        }
      }
    }
  }
}

```

# src/server/services/youtube.service.ts
```ts
// src/server/services/youtube.service.ts
import { PrismaClient } from '@prisma/client'
import { google, youtube_v3 } from 'googleapis'
import { TRPCError } from '@trpc/server'
import { CacheService, CacheType } from './cache.service'
import { ActivityService } from './activity.service'

export class YouTubeService {
  private cacheService: CacheService
  private activityService: ActivityService
  private youtube: youtube_v3.Youtube
  private apiKey: string

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
    this.activityService = new ActivityService(db)
    this.apiKey = process.env.YOUTUBE_API_KEY!
    
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    })
  }

  async getVideoDetails(videoId: string) {
    // Check cache first
    const cacheKey = `youtube:video:${videoId}`
    const cached = await this.cacheService.get(cacheKey)
    if (cached) return cached

    try {
      // Check API quota
      await this.checkApiQuota()

      // Fetch from YouTube API
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId],
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Video not found',
        })
      }

      const video = response.data.items[0]
      const videoData = {
        id: video.id!,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || '',
        duration: this.parseDuration(video.contentDetails?.duration),
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        publishedAt: video.snippet?.publishedAt,
        tags: video.snippet?.tags || [],
      }

      // Store in database
      await this.db.youtubeVideo.upsert({
        where: { videoId },
        create: {
          videoId,
          channelId: videoData.channelId,
          title: videoData.title,
          description: videoData.description,
          thumbnailUrl: videoData.thumbnailUrl,
          duration: videoData.duration,
          viewCount: BigInt(videoData.viewCount),
          likeCount: videoData.likeCount,
          commentCount: videoData.commentCount,
          publishedAt: videoData.publishedAt ? new Date(videoData.publishedAt) : undefined,
          metadata: video as any,
        },
        update: {
          title: videoData.title,
          viewCount: BigInt(videoData.viewCount),
          likeCount: videoData.likeCount,
          commentCount: videoData.commentCount,
          lastSyncedAt: new Date(),
          metadata: video as any,
        },
      })

      // Update API quota usage
      await this.incrementApiQuota(1)

      // Cache for 1 hour
      await this.cacheService.set(cacheKey, videoData, 3600)

      return videoData
    } catch (error) {
      console.error('Failed to fetch YouTube video:', error)
      
      // Try to get from database if API fails
      const dbVideo = await this.db.youtubeVideo.findUnique({
        where: { videoId },
      })
      
      if (dbVideo) {
        return {
          id: dbVideo.videoId,
          title: dbVideo.title || '',
          description: dbVideo.description || '',
          channelId: dbVideo.channelId,
          channelTitle: dbVideo.channelTitle || '',
          thumbnailUrl: dbVideo.thumbnailUrl || '',
          duration: dbVideo.duration,
          viewCount: Number(dbVideo.viewCount),
          likeCount: dbVideo.likeCount,
          commentCount: dbVideo.commentCount,
          publishedAt: dbVideo.publishedAt?.toISOString(),
        }
      }
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch video details',
      })
    }
  }

  async syncChannel(channelId: string, userId: string) {
    try {
      // Check API quota
      await this.checkApiQuota()

      // Fetch channel data
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [channelId],
      })

      if (!response.data.items || response.data.items.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        })
      }

      const channel = response.data.items[0]
      
      // Store channel data
      const dbChannel = await this.db.youtubeChannel.upsert({
        where: { channelId },
        create: {
          channelId,
          userId,
          channelTitle: channel.snippet?.title || '',
          channelHandle: channel.snippet?.customUrl || null,
          channelDescription: channel.snippet?.description || null,
          thumbnailUrl: channel.snippet?.thumbnails?.high?.url || null,
          subscriberCount: BigInt(channel.statistics?.subscriberCount || '0'),
          viewCount: BigInt(channel.statistics?.viewCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          channelData: channel as any,
          lastSyncedAt: new Date(),
        },
        update: {
          channelTitle: channel.snippet?.title || '',
          subscriberCount: BigInt(channel.statistics?.subscriberCount || '0'),
          viewCount: BigInt(channel.statistics?.viewCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          channelData: channel as any,
          lastSyncedAt: new Date(),
        },
      })

      // Update user profile with channel
      await this.db.profile.update({
        where: { userId },
        data: {
          youtubeChannelId: channelId,
          youtubeChannelUrl: `https://youtube.com/channel/${channelId}`,
        },
      })

      // Update API quota
      await this.incrementApiQuota(1)

      // Track activity
      await this.activityService.trackActivity({
        userId,
        action: 'youtube.channel.synced',
        entityType: 'channel',
        entityId: channelId,
        entityData: {
          channelTitle: channel.snippet?.title,
          subscriberCount: channel.statistics?.subscriberCount,
        },
      })

      return dbChannel
    } catch (error) {
      console.error('Failed to sync YouTube channel:', error)
      throw error
    }
  }

  async createVideoClip(input: {
    youtubeVideoId: string
    title: string
    description?: string
    startTime: number
    endTime: number
    creatorId: string
    tags?: string[]
  }) {
    // Validate times
    if (input.endTime <= input.startTime) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End time must be after start time',
      })
    }

    const duration = input.endTime - input.startTime
    if (duration > 300) { // 5 minutes max
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Clips cannot be longer than 5 minutes',
      })
    }

    // Get video details
    const video = await this.getVideoDetails(input.youtubeVideoId)

    // Create clip
    const clip = await this.db.videoClip.create({
      data: {
        youtubeVideoId: input.youtubeVideoId,
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        duration,
        thumbnailUrl: video.thumbnailUrl,
        tags: input.tags || [],
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    })

    // Track activity
    await this.activityService.trackActivity({
      userId: input.creatorId,
      action: 'clip.created',
      entityType: 'clip',
      entityId: clip.id,
      entityData: {
        title: clip.title,
        videoId: input.youtubeVideoId,
      },
    })

    return clip
  }

  async getTrendingVideos(limit: number) {
    const cacheKey = `youtube:trending:${limit}`
    const cached = await this.cacheService.get(cacheKey, CacheType.TRENDING)
    if (cached) return cached

    // Get videos that have been shared/discussed recently
    const videos = await this.db.youtubeVideo.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
      include: {
        _count: {
          select: {
            watchParties: true,
            clips: true,
          },
        },
      },
    })

    // Transform BigInt to number for JSON serialization
    const transformed = videos.map(v => ({
      ...v,
      viewCount: Number(v.viewCount),
      subscriberCount: v.subscriberCount ? Number(v.subscriberCount) : 0,
    }))

    await this.cacheService.set(cacheKey, transformed, undefined, CacheType.TRENDING)
    return transformed
  }

  async getVideoAnalytics(videoId: string) {
    const analytics = await this.db.videoAnalytics.findUnique({
      where: { videoId },
      include: {
        video: true,
      },
    })

    if (!analytics) {
      // Create default analytics
      return this.db.videoAnalytics.create({
        data: { 
          videoId,
          totalWatchTime: 0,
          uniqueViewers: 0,
          engagementRate: 0,
          averageWatchPercent: 0,
        },
        include: { video: true },
      })
    }

    return analytics
  }

  private parseDuration(duration?: string | null): number {
    if (!duration) return 0

    // Parse ISO 8601 duration (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    return hours * 3600 + minutes * 60 + seconds
  }

  private async checkApiQuota() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const quota = await this.db.youTubeApiQuota.findUnique({
      where: { date: today },
    })

    const quotaLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000')

    if (quota && quota.unitsUsed >= quotaLimit) {
      throw new TRPCError({
        code: 'RESOURCE_EXHAUSTED',
        message: 'YouTube API quota exceeded for today',
      })
    }

    return quota
  }

  private async incrementApiQuota(units: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const quotaLimit = parseInt(process.env.YOUTUBE_QUOTA_LIMIT || '10000')

    await this.db.youTubeApiQuota.upsert({
      where: { date: today },
      create: {
        date: today,
        unitsUsed: units,
        quotaLimit,
        readRequests: 1,
        writeRequests: 0,
        resetAt: tomorrow,
      },
      update: {
        unitsUsed: { increment: units },
        readRequests: { increment: 1 },
      },
    })
  }
}

```

# src/server/services/achievement.service.ts
```ts
// src/server/services/achievement.service.ts
import { PrismaClient } from '@prisma/client'
import { NotificationService } from './notification.service'

export class AchievementService {
  private notificationService: NotificationService

  constructor(private db: PrismaClient) {
    this.notificationService = new NotificationService(db)
  }

  async checkPostAchievements(userId: string) {
    const stats = await this.db.userStats.findUnique({
      where: { userId },
    })

    if (!stats) return

    const achievements = [
      { count: 1, code: 'FIRST_POST' },
      { count: 10, code: 'POSTS_10' },
      { count: 50, code: 'POSTS_50' },
      { count: 100, code: 'POSTS_100' },
    ]

    for (const achievement of achievements) {
      if (stats.totalPosts >= achievement.count) {
        await this.unlockAchievement(userId, achievement.code)
      }
    }
  }

  async unlockAchievement(userId: string, achievementCode: string) {
    try {
      // Check if achievement exists
      const achievement = await this.db.achievement.findUnique({
        where: { code: achievementCode },
      })

      if (!achievement) return

      // Check if already unlocked
      const existing = await this.db.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id,
          },
        },
      })

      if (existing) return

      // Unlock achievement
      await this.db.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 1,
        },
      })

      // Grant rewards
      if (achievement.xpReward > 0 || achievement.sparklePointsReward > 0) {
        await this.db.$transaction([
          this.db.user.update({
            where: { id: userId },
            data: {
              experience: { increment: achievement.xpReward },
              sparklePoints: { increment: achievement.sparklePointsReward },
            },
          }),
          this.db.xpLog.create({
            data: {
              userId,
              amount: achievement.xpReward,
              source: 'achievement',
              sourceId: achievement.id,
              reason: `Unlocked achievement: ${achievement.name}`,
              totalXp: 0, // Will be calculated
            },
          }),
        ])
      }

      // Send notification
      await this.notificationService.createNotification({
        type: 'ACHIEVEMENT_UNLOCKED',
        userId,
        entityId: achievement.id,
        entityType: 'achievement',
        title: 'Achievement Unlocked!',
        message: `You've unlocked "${achievement.name}"`,
        data: {
          achievementCode: achievement.code,
          rewards: {
            xp: achievement.xpReward,
            sparklePoints: achievement.sparklePointsReward,
          },
        },
      })
    } catch (error) {
      console.error('Failed to unlock achievement:', error)
    }
  }
}

```

# src/server/services/cache.service.ts
```ts
// src/server/services/cache.service.ts
import { redis } from '@/lib/redis'
import superjson from 'superjson'

export enum CacheType {
  USER_PROFILE = 'user_profile',
  POST_CONTENT = 'post_content',
  FEED = 'feed',
  TRENDING = 'trending',
  LEADERBOARD = 'leaderboard',
  STATS = 'stats',
}

interface CacheTTL {
  [CacheType.USER_PROFILE]: number
  [CacheType.POST_CONTENT]: number
  [CacheType.FEED]: number
  [CacheType.TRENDING]: number
  [CacheType.LEADERBOARD]: number
  [CacheType.STATS]: number
}

const CACHE_TTL: CacheTTL = {
  [CacheType.USER_PROFILE]: 300,    // 5 minutes
  [CacheType.POST_CONTENT]: 600,    // 10 minutes
  [CacheType.FEED]: 60,             // 1 minute
  [CacheType.TRENDING]: 900,        // 15 minutes
  [CacheType.LEADERBOARD]: 300,     // 5 minutes
  [CacheType.STATS]: 1800,          // 30 minutes
}

export class CacheService {
  private prefix = 'cache:'
  private defaultTTL = 300 // 5 minutes default

  async get<T>(key: string, type?: CacheType): Promise<T | null> {
    try {
      const fullKey = this.getKey(key, type)
      const cached = await redis.get(fullKey)
      
      if (!cached) return null
      
      // Use superjson for proper Date/BigInt serialization
      return superjson.parse(cached) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number, type?: CacheType): Promise<void> {
    try {
      const fullKey = this.getKey(key, type)
      const serialized = superjson.stringify(value)
      const finalTTL = ttl || (type ? CACHE_TTL[type] : this.defaultTTL)
      
      await redis.setex(fullKey, finalTTL, serialized)
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  // Maintaining compatibility with original interface
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key)
      await redis.del(fullKey)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}${pattern}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error)
    }
  }

  async invalidateByType(type: CacheType): Promise<void> {
    const pattern = `${this.prefix}${type}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  async remember<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
    type?: CacheType
  ): Promise<T> {
    const cached = await this.get<T>(key, type)
    if (cached !== null) return cached

    const fresh = await fn()
    await this.set(key, fresh, ttl, type)
    return fresh
  }

  async flush(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache flush error:', error)
    }
  }

  private getKey(key: string, type?: CacheType): string {
    return type ? `${this.prefix}${type}:${key}` : `${this.prefix}${key}`
  }

  // Additional utility methods for common patterns
  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getKey(key)
    return redis.incrby(fullKey, amount)
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getKey(key)
    return redis.decrby(fullKey, amount)
  }

  async exists(key: string, type?: CacheType): Promise<boolean> {
    const fullKey = this.getKey(key, type)
    const result = await redis.exists(fullKey)
    return result === 1
  }

  async ttl(key: string, type?: CacheType): Promise<number> {
    const fullKey = this.getKey(key, type)
    return redis.ttl(fullKey)
  }

  async expire(key: string, ttl: number, type?: CacheType): Promise<boolean> {
    const fullKey = this.getKey(key, type)
    const result = await redis.expire(fullKey, ttl)
    return result === 1
  }
}

```

# src/server/services/search.service.ts
```ts
// src/server/services/search.service.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { CacheService, CacheType } from './cache.service'

export class SearchService {
  private cacheService: CacheService

  constructor(private db: PrismaClient) {
    this.cacheService = new CacheService()
  }

  async search(params: {
    query: string
    type: 'all' | 'posts' | 'users' | 'tags'
    limit: number
  }) {
    const { query, type, limit } = params
    const results: any = {}

    // Normalize query for PostgreSQL full-text search
    const searchQuery = query.trim().toLowerCase()
    const tsQuery = searchQuery.split(' ').join(' & ')

    if (type === 'all' || type === 'posts') {
      results.posts = await this.searchPosts(searchQuery, tsQuery, limit)
    }

    if (type === 'all' || type === 'users') {
      results.users = await this.searchUsers(searchQuery, limit)
    }

    if (type === 'all' || type === 'tags') {
      results.tags = await this.searchTags(searchQuery, limit)
    }

    // Track search query for trending
    await this.trackSearchQuery(query)

    return results
  }

  private async searchPosts(query: string, tsQuery: string, limit: number) {
    // Use PostgreSQL full-text search with GIN indexes
    const posts = await this.db.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.title,
        p.excerpt,
        p.slug,
        p."authorId",
        p."createdAt",
        ts_rank(
          to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')),
          to_tsquery('english', ${tsQuery})
        ) as rank
      FROM posts p
      WHERE 
        p.published = true
        AND p.deleted = false
        AND (
          to_tsvector('english', p.title || ' ' || COALESCE(p.excerpt, '')) 
          @@ to_tsquery('english', ${tsQuery})
          OR p.title ILIKE ${`%${query}%`}
        )
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${limit}
    `

    // Enrich with author data
    const authorIds = posts.map(p => p.authorId)
    const authors = await this.db.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        username: true,
        image: true,
      },
    })

    const authorMap = new Map(authors.map(a => [a.id, a]))

    return posts.map(post => ({
      ...post,
      author: authorMap.get(post.authorId),
    }))
  }

  private async searchUsers(query: string, limit: number) {
    // Use trigram similarity for user search (requires pg_trgm extension)
    const users = await this.db.$queryRaw<any[]>`
      SELECT 
        u.id,
        u.username,
        u.bio,
        u.image,
        similarity(u.username, ${query}) as username_similarity,
        similarity(COALESCE(u.bio, ''), ${query}) as bio_similarity
      FROM users u
      WHERE 
        u.status = 'ACTIVE'
        AND (
          u.username ILIKE ${`%${query}%`}
          OR u.bio ILIKE ${`%${query}%`}
          OR similarity(u.username, ${query}) > 0.3
        )
      ORDER BY 
        username_similarity DESC,
        bio_similarity DESC
      LIMIT ${limit}
    `

    return users
  }

  private async searchTags(query: string, limit: number) {
    return this.db.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    })
  }

  async getSuggestions(query: string, limit: number) {
    const cacheKey = `suggestions:${query}`
    const cached = await this.cacheService.get<string[]>(cacheKey)
    if (cached) return cached

    // Get search history and popular searches
    const suggestions = await this.db.$queryRaw<Array<{term: string}>>`
      SELECT DISTINCT term
      FROM search_queries
      WHERE term ILIKE ${`${query}%`}
      ORDER BY search_count DESC
      LIMIT ${limit}
    `

    const terms = suggestions.map(s => s.term)
    await this.cacheService.set(cacheKey, terms, 300) // Cache for 5 minutes

    return terms
  }

  async getTrendingSearches() {
    const cacheKey = 'trending:searches'
    const cached = await this.cacheService.get(cacheKey, CacheType.TRENDING)
    if (cached) return cached

    const trending = await this.db.$queryRaw<Array<{term: string, count: number}>>`
      SELECT term, search_count as count
      FROM search_queries
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY search_count DESC
      LIMIT 10
    `

    await this.cacheService.set(cacheKey, trending, 900, CacheType.TRENDING)
    return trending
  }

  async indexPost(post: any) {
    // Create/update search index entry
    const searchableText = `${post.title} ${post.excerpt || ''} ${post.content || ''}`
      .replace(/<[^>]*>/g, '') // Strip HTML
      .substring(0, 10000) // Limit length

    await this.db.searchIndex.upsert({
      where: {
        entityType_entityId: {
          entityType: 'post',
          entityId: post.id,
        },
      },
      create: {
        entityType: 'post',
        entityId: post.id,
        searchableText,
        metadata: {
          title: post.title,
          slug: post.slug,
          authorId: post.authorId,
        },
      },
      update: {
        searchableText,
        metadata: {
          title: post.title,
          slug: post.slug,
          authorId: post.authorId,
        },
      },
    })
  }

  async deletePost(postId: string) {
    await this.db.searchIndex.delete({
      where: {
        entityType_entityId: {
          entityType: 'post',
          entityId: postId,
        },
      },
    })
  }

  private async trackSearchQuery(query: string) {
    // Track search queries for analytics and suggestions
    await this.db.$executeRaw`
      INSERT INTO search_queries (term, search_count)
      VALUES (${query}, 1)
      ON CONFLICT (term)
      DO UPDATE SET 
        search_count = search_queries.search_count + 1,
        last_searched = NOW()
    `
  }
}

```

