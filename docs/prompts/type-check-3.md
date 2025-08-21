Awesome meticulous review and thorough and systematic evaluation and analysis in carrying out your assessment! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant!

Please put on the same deep-thinking hat to deeply and thoroughly explore carefully and systematically to create the complete and working version of the files in the list below that need updating to incorporate your recommended improvements and fixes. please use the same rigorous and meticulous approach to deeply and thoroughly explore for the best implementation option to create the complete updated version of the files listed that need modification or new files to be added. please carefully plan how to create the complete version of each of these files before proceeding cautiously. 

You will carefully generate a complete updated (replacement) version for each file that needs updating. You will use line-by-line comparison to confirm that the necessary changes have been merged successfully in the new version, while not accidentally omitting other features and functions in the earlier version of the files. Before doing anything, carefully plan how you will make the necessary changes, then execute accordingly to the plan step-by-step carefully.

Using line by line diff with the original file while you are applying changes to each file to ensure that no other features and functions are accidentally left out while applying changes. we don't want to introduce regression failure while updating the code. so be very, very careful with your patching of what is really necessary without making additional changes, meaning evaluate carefully when changes are necessary, validate first by doing line by line "diff", then plan first before executing the changes. Do testing and simulation if possible. enclose your complete and updated version of the updated files within the ```python (or ```js or ```sql or ```json) opening and ``` closing tags. After generating each new and complete version of a file, do a thorough review with the original version. Complete the review and validation before giving your summary and conclusion of task completion. thank you and good luck my very best coding assistant and expert in the world!

# List of existing files to modify if needed to fix the reported type-check errors:
- src/app/(main)/create/page.tsx (update original version shared below)
- src/app/admin/dashboard/page.tsx (update original version shared below)
- src/app/admin/layout.tsx (update original version shared below)
- src/app/globals.css (update original version shared below)

# List of missing files to create:
- src/components/ui/radio-group.tsx
- src/server/api/routers/social.ts
- src/server/api/routers/message.ts
- src/server/api/routers/group.ts

$ npm install --save-dev @types/next-themes
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@types%2fnext-themes - Not found
npm error 404
npm error 404  The requested resource '@types/next-themes@*' could not be found or you do not have permission to access it.
npm error 404
npm error 404 Note that you can also install from a
npm error 404 tarball, folder, http url, or git url.

$ npm ls @types/next
sparkle-universe@0.1.0 /Home1/test2
└─┬ @types/next@8.0.7
  └─┬ @types/next-server@8.1.2
    └── @types/next@8.0.7 deduped

---
# original file: src/app/(main)/create/page.tsx
```tsx
// src/app/(main)/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { toast } from 'sonner'
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
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Define the schema with proper types
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional().or(z.literal('')),
  categoryId: z.string().optional(),
  seriesId: z.string().optional(),
  seriesOrder: z.number().int().positive().optional(),
  youtubeVideoId: z.string().optional(),
  isDraft: z.boolean().default(false),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').default([]),
})

type CreatePostInput = z.infer<typeof createPostSchema>

// YouTube URL extraction helper
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Handle direct video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url
  }
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  
  return null
}

export default function CreatePostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [youtubeInput, setYoutubeInput] = useState('')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      tags: [],
      isDraft: false,
      categoryId: undefined,
      youtubeVideoId: undefined,
      seriesId: undefined,
      seriesOrder: undefined,
    },
  })

  const { watch, setValue, handleSubmit, formState: { errors, isDirty } } = form

  // Watch form values
  const watchedTitle = watch('title')
  const watchedContent = watch('content')
  const watchedExcerpt = watch('excerpt')
  const watchedYoutubeId = watch('youtubeVideoId')
  const watchedTags = watch('tags')
  const watchedIsDraft = watch('isDraft')

  // Auto-save draft
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || isSubmitting || isSavingDraft) return

    const timer = setTimeout(() => {
      if (watchedTitle || watchedContent) {
        handleSaveDraft()
      }
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [watchedTitle, watchedContent, isDirty, autoSaveEnabled])

  // Fetch categories (with error handling)
  const { data: categories = [] } = api.post.getCategories?.useQuery() ?? { data: [] }

  // Create post mutation
  const createPostMutation = api.post.create.useMutation({
    onSuccess: (post) => {
      if (post.isDraft) {
        toast.success('Draft saved!', {
          description: 'Your draft has been saved successfully.',
        })
        setLastSaved(new Date())
        setIsSavingDraft(false)
      } else {
        toast.success('Post published!', {
          description: 'Your post has been published successfully.',
        })
        router.push(`/post/${post.id}`)
      }
    },
    onError: (error) => {
      toast.error('Error', {
        description: error.message || 'Something went wrong. Please try again.',
      })
      setIsSubmitting(false)
      setIsSavingDraft(false)
    },
  })

  const handleSaveDraft = async () => {
    if (isSavingDraft || isSubmitting) return
    
    setIsSavingDraft(true)
    const values = form.getValues()
    
    createPostMutation.mutate({
      ...values,
      isDraft: true,
      excerpt: values.excerpt || undefined,
      youtubeVideoId: values.youtubeVideoId || undefined,
    })
  }

  const onSubmit = async (data: CreatePostInput) => {
    if (isSubmitting || isSavingDraft) return
    
    setIsSubmitting(true)
    
    // Clean up data
    const submitData = {
      ...data,
      isDraft: false,
      excerpt: data.excerpt || undefined,
      youtubeVideoId: data.youtubeVideoId || undefined,
      categoryId: data.categoryId || undefined,
      seriesId: data.seriesId || undefined,
      seriesOrder: data.seriesOrder || undefined,
    }
    
    createPostMutation.mutate(submitData)
  }

  const handleAddTag = () => {
    const currentTags = watch('tags') || []
    
    if (tagInput && currentTags.length < 5) {
      const formattedTag = tagInput
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      
      if (formattedTag && !currentTags.includes(formattedTag)) {
        setValue('tags', [...currentTags, formattedTag], { shouldDirty: true })
        setTagInput('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || []
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove), { shouldDirty: true })
  }

  const handleYouTubeUrlChange = (value: string) => {
    setYoutubeInput(value)
    const videoId = extractYouTubeVideoId(value)
    if (videoId) {
      setValue('youtubeVideoId', videoId, { shouldDirty: true })
    } else if (!value) {
      setValue('youtubeVideoId', undefined, { shouldDirty: true })
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmed) return
    }
    router.back()
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share your thoughts with the Sparkle community
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
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

              <TabsContent value="write" className="space-y-6 mt-6">
                <div>
                  <Label htmlFor="title" className="text-base">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter an engaging title for your post"
                    {...form.register('title')}
                    className={cn("mt-2 text-lg", errors.title && "border-destructive")}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.title.message}
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
                    className={cn("mt-2 min-h-[80px]", errors.excerpt && "border-destructive")}
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      This will be shown in post previews
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {watchedExcerpt?.length || 0}/500
                    </p>
                  </div>
                  {errors.excerpt && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.excerpt.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-base">
                    Content <span className="text-destructive">*</span>
                  </Label>
                  <div className="mt-2">
                    <RichTextEditor
                      content={watchedContent}
                      onChange={(content) => setValue('content', content, { shouldDirty: true })}
                      placeholder="Write your post content..."
                      className={cn("border rounded-lg", errors.content && "border-destructive")}
                    />
                  </div>
                  {errors.content && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.content.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <article className="prose prose-sm dark:prose-invert max-w-none">
                      <h1>{watchedTitle || 'Untitled Post'}</h1>
                      {watchedExcerpt && (
                        <p className="lead text-muted-foreground">{watchedExcerpt}</p>
                      )}
                      {watchedYoutubeId && (
                        <div className="my-6">
                          <YouTubeEmbed videoId={watchedYoutubeId} />
                        </div>
                      )}
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: watchedContent || '<p class="text-muted-foreground">No content yet...</p>' 
                        }} 
                      />
                      {watchedTags && watchedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                          {watchedTags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
                    checked={watchedIsDraft}
                    onCheckedChange={(checked) => setValue('isDraft', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autosave">Auto-save</Label>
                  <Switch
                    id="autosave"
                    checked={autoSaveEnabled}
                    onCheckedChange={setAutoSaveEnabled}
                  />
                </div>

                {lastSaved && (
                  <p className="text-xs text-muted-foreground">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                )}

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
                    type="submit"
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
            {categories && categories.length > 0 && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={watch('categoryId') || ''}
                    onValueChange={(value) => setValue('categoryId', value || undefined)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label htmlFor="tags">
                  Tags
                  <span className="text-sm text-muted-foreground ml-2">
                    ({watchedTags?.length || 0}/5)
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
                    disabled={(watchedTags?.length || 0) >= 5}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={handleAddTag}
                    disabled={(watchedTags?.length || 0) >= 5 || !tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {errors.tags && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tags.message}
                  </p>
                )}

                {watchedTags && watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
                  value={youtubeInput}
                  onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                />
                {watchedYoutubeId && (
                  <div className="mt-4">
                    <YouTubeEmbed 
                      videoId={watchedYoutubeId} 
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
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

```

# original file: src/app/admin/dashboard/page.tsx
```tsx
// src/app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Activity,
  Eye,
  UserPlus,
  Heart,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  Database,
  Globe,
  Shield,
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react'
import { api } from '@/lib/api'
import { AnalyticsChart } from '@/components/admin/analytics-chart'
import { RealtimeMetrics } from '@/components/admin/realtime-metrics'
import { RecentActivity } from '@/components/admin/recent-activity'
import { TopContent } from '@/components/admin/top-content'
import { SystemHealth } from '@/components/admin/system-health'
import { ModeratorQueue } from '@/components/admin/moderator-queue'
import { UserGrowthChart } from '@/components/admin/charts/user-growth-chart'
import { EngagementHeatmap } from '@/components/admin/charts/engagement-heatmap'
import { ContentPerformance } from '@/components/admin/charts/content-performance'
import { formatNumber, formatPercentage, formatDuration } from '@/lib/utils'
import { useSocket } from '@/hooks/use-socket'
import { cn } from '@/lib/utils'

type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year'

export default function AdminDashboard() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  
  const socket = useSocket()

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = 
    api.admin.getDashboardStats.useQuery({ period: timePeriod })
  
  const { data: analytics, refetch: refetchAnalytics } = 
    api.admin.getAnalytics.useQuery({ period: timePeriod })
  
  const { data: systemHealth } = 
    api.admin.getSystemHealth.useQuery(undefined, {
      refetchInterval: 30000, // Refresh every 30 seconds
    })
  
  const { data: alerts } = 
    api.admin.getAlerts.useQuery()

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refetchStats()
      refetchAnalytics()
      setLastRefresh(new Date())
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [autoRefresh, refetchStats, refetchAnalytics])

  // Real-time updates
  useEffect(() => {
    if (!socket.isConnected) return

    const unsubscribeNewUser = socket.on('admin:newUser', () => {
      refetchStats()
    })

    const unsubscribeNewPost = socket.on('admin:newPost', () => {
      refetchStats()
    })

    const unsubscribeAlert = socket.on('admin:alert', (alert: any) => {
      // Handle real-time alerts
    })

    return () => {
      unsubscribeNewUser()
      unsubscribeNewPost()
      unsubscribeAlert()
    }
  }, [socket, refetchStats])

  const exportDashboardData = async () => {
    const response = await fetch('/api/admin/export/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: timePeriod }),
    })
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${timePeriod}-${new Date().toISOString()}.csv`
    a.click()
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      change: stats?.users.growth || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats?.users.active || 0,
      change: stats?.users.activeGrowth || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      subtitle: 'Last 7 days',
    },
    {
      title: 'Total Posts',
      value: stats?.content.posts || 0,
      change: stats?.content.postsGrowth || 0,
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/admin/content',
    },
    {
      title: 'Engagement Rate',
      value: formatPercentage(stats?.engagement.rate || 0),
      change: stats?.engagement.rateChange || 0,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      isPercentage: true,
    },
  ]

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your Sparkle Universe community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="icon"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon" onClick={exportDashboardData}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any) => (
            <Alert key={alert.id} variant={alert.severity === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <Badge variant={alert.severity === 'error' ? 'destructive' : 'secondary'}>
                  {alert.type}
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="group cursor-pointer hover:shadow-lg transition-all"
            onClick={() => stat.href && window.location.href.replace(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isPercentage ? stat.value : formatNumber(stat.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className={cn(
                  "inline-flex items-center",
                  stat.change >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  <TrendingUp className={cn(
                    "w-3 h-3 mr-1",
                    stat.change < 0 && "rotate-180"
                  )} />
                  {stat.change >= 0 ? '+' : ''}{formatPercentage(stat.change)}
                </span>
                {' '}from last {timePeriod}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>
              Real-time system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemHealth data={systemHealth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <Badge variant={systemHealth?.responseTime < 100 ? "default" : "destructive"}>
                  {systemHealth?.responseTime || 0}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-medium">{systemHealth?.uptime || '99.9%'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Sessions</span>
                <span className="font-medium">{formatNumber(stats?.users.online || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Queue Size</span>
                <span className="font-medium">{stats?.moderation.pending || 0}</span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Last refresh: {formatDuration(Date.now() - lastRefresh.getTime())} ago
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  New users and active users over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserGrowthChart
                  data={analytics?.userGrowth || []}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Creation</CardTitle>
                <CardDescription>
                  Posts, comments, and reactions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.contentCreation || []}
                  type="bar"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Real-time activity feed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity limit={15} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Content</CardTitle>
                <CardDescription>
                  Most popular posts this {timePeriod}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopContent limit={10} period={timePeriod} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                Detailed user metrics and behavior analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{stats?.users.newToday || 0}</p>
                  <p className="text-sm text-muted-foreground">New Today</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{stats?.users.dau || 0}</p>
                  <p className="text-sm text-muted-foreground">Daily Active</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{formatDuration(stats?.users.avgSessionDuration || 0)}</p>
                  <p className="text-sm text-muted-foreground">Avg. Session</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{formatPercentage(stats?.users.retentionRate || 0)}</p>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                </div>
              </div>

              <div className="space-y-4">
                <AnalyticsChart
                  data={analytics?.userActivity || []}
                  type="area"
                  height={400}
                  showLegend
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        data={analytics?.userSegments || []}
                        type="donut"
                        height={300}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Geographic Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsChart
                        data={analytics?.geoDistribution || []}
                        type="map"
                        height={300}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>
                Analysis of content creation and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContentPerformance
                data={analytics?.contentPerformance || {}}
                period={timePeriod}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.contentTypes || []}
                  type="bar"
                  height={300}
                  horizontal
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart
                  data={analytics?.topTags || []}
                  type="treemap"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                User interaction and engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.reactions || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Reactions</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.comments || 0)}</p>
                  <p className="text-sm text-muted-foreground">Comments</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{formatNumber(stats?.engagement.shares || 0)}</p>
                  <p className="text-sm text-muted-foreground">Shares</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{formatPercentage(stats?.engagement.viralityScore || 0)}</p>
                  <p className="text-sm text-muted-foreground">Virality Score</p>
                </div>
              </div>

              <EngagementHeatmap
                data={analytics?.engagementHeatmap || {}}
                height={400}
              />

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-4">Engagement Trends</h4>
                <AnalyticsChart
                  data={analytics?.engagementTrends || []}
                  type="line"
                  height={300}
                  showLegend
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats?.moderation.pending || 0}</div>
                <p className="text-xs text-muted-foreground">Awaiting moderation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats?.moderation.approvedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Content approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{stats?.moderation.rejectedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Content rejected</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(stats?.moderation.aiAccuracy || 0)}</div>
                <p className="text-xs text-muted-foreground">Auto-moderation accuracy</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Queue</CardTitle>
              <CardDescription>
                Recent items requiring moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModeratorQueue limit={10} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={analytics?.moderationStats || []}
                type="stacked-bar"
                height={300}
                showLegend
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Metrics
          </CardTitle>
          <CardDescription>
            Live activity monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RealtimeMetrics />
        </CardContent>
      </Card>
    </div>
  )
}

```

# original file: src/app/admin/layout.tsx
```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getServerAuth } from '@/lib/auth/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminProvider } from '@/components/providers/admin-provider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { AdminNotifications } from '@/components/admin/admin-notifications'
import { AdminActivityMonitor } from '@/components/admin/admin-activity-monitor'

export const metadata = {
  title: 'Admin Dashboard - Sparkle Universe',
  description: 'Admin panel for Sparkle Universe',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuth()
  
  // Check if user is admin or moderator
  if (!session?.user || !['ADMIN', 'MODERATOR'].includes(session.user.role)) {
    redirect('/')
  }

  // Additional security check for admin features
  const isAdmin = session.user.role === 'ADMIN'
  const isModerator = session.user.role === 'MODERATOR'

  return (
    <AdminProvider 
      user={session.user}
      permissions={{
        canAccessDashboard: true,
        canManageUsers: isAdmin,
        canModerateContent: true,
        canViewAnalytics: true,
        canManageSettings: isAdmin,
        canViewLogs: isAdmin,
        canManageRoles: isAdmin,
        canExportData: isAdmin,
      }}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar 
          userRole={session.user.role}
          className="hidden lg:flex"
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <AdminHeader 
            user={session.user}
            showMobileMenu
          />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary
              fallback={(error, reset) => (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-destructive">
                      Admin Panel Error
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                      {error.message || 'An unexpected error occurred in the admin panel.'}
                    </p>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            >
              <div className="container mx-auto p-6 max-w-7xl">
                {children}
              </div>
            </ErrorBoundary>
          </main>
          
          {/* Real-time activity monitor */}
          {isAdmin && <AdminActivityMonitor />}
        </div>
        
        {/* Notifications */}
        <AdminNotifications />
        
        {/* Toaster for admin-specific notifications */}
        <Toaster />
      </div>
    </AdminProvider>
  )
}

```

# original file: src/app/globals.css
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 271 91% 65%;  /* Sparkle Purple */
    --primary-foreground: 0 0% 98%;
    --secondary: 327 73% 58%;  /* Sparkle Pink */
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 158 64% 42%;  /* Sparkle Green */
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 271 91% 65%;
    --radius: 0.625rem;
    
    /* Sparkle theme specific */
    --sparkle-purple: 271 91% 65%;
    --sparkle-pink: 327 73% 58%;
    --sparkle-blue: 217 91% 60%;
    --sparkle-green: 158 64% 42%;
    --sparkle-gold: 38 92% 50%;
    
    /* Font variables */
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 6%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 6%;
    --popover-foreground: 0 0% 98%;
    --primary: 271 91% 65%;
    --primary-foreground: 240 10% 3.9%;
    --secondary: 327 73% 58%;
    --secondary-foreground: 240 10% 3.9%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 158 64% 42%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 20%;
    --ring: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Better focus styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Text rendering improvements */
  h1, h2, h3, h4, h5, h6 {
    text-wrap: balance;
  }
  
  p {
    text-wrap: pretty;
  }
}

@layer components {
  /* Glassmorphism card */
  .glass-card {
    @apply bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10;
  }
  
  /* Sparkle button */
  .btn-sparkle {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #8B5CF6, #EC4899, #10B981);
    transition: all 0.3s ease;
  }
  
  .btn-sparkle:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
  }
  
  .btn-sparkle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.5s;
  }
  
  .btn-sparkle:hover::before {
    left: 100%;
  }
  
  /* Badge rarity styles */
  .badge-common {
    @apply bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30;
  }
  
  .badge-uncommon {
    @apply bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30;
  }
  
  .badge-rare {
    @apply bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30;
  }
  
  .badge-epic {
    @apply bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30;
  }
  
  .badge-legendary {
    @apply bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30;
    animation: glow 2s ease-in-out infinite;
  }
  
  .badge-mythic {
    @apply bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30;
    background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.2));
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .badge-limited {
    @apply bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30;
    position: relative;
    overflow: hidden;
  }
  
  .badge-seasonal {
    @apply bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30;
  }
  
  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    @apply bg-muted rounded-full;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    @apply bg-primary/30 rounded-full hover:bg-primary/50;
    background: linear-gradient(#8B5CF6, #EC4899);
  }
  
  /* Loading skeleton with sparkle effect */
  .skeleton-sparkle {
    @apply relative overflow-hidden bg-muted;
    background: linear-gradient(90deg, 
      rgba(139,92,246,0.1) 0%, 
      rgba(236,72,153,0.2) 50%, 
      rgba(139,92,246,0.1) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  /* Reaction animations */
  .reaction-bounce {
    animation: bounce 0.5s ease-out;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  /* Notification bell */
  .notification-bell {
    @apply relative;
  }
  
  .notification-bell.has-unread::after {
    content: '';
    @apply absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full;
    animation: pulse 2s infinite;
  }
}

@layer utilities {
  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Text gradient */
  .text-gradient {
    @apply bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent;
  }
  
  /* Sparkle particle effect */
  .sparkle-effect {
    position: relative;
  }
  
  .sparkle-effect::after {
    content: '✨';
    position: absolute;
    top: -10px;
    right: -10px;
    animation: sparkle 2s ease-in-out infinite;
  }
  
  /* Prevent text selection */
  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
}

/* Animations */
@keyframes glow {
  0%, 100% { 
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 
                0 0 40px rgba(236, 72, 153, 0.3);
  }
  50% { 
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7), 
                0 0 60px rgba(236, 72, 153, 0.5);
  }
}

@keyframes sparkle {
  0%, 100% { 
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% { 
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}

/* Micro-interactions */
.hover-lift {
  transition: transform 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
}

/* Loading states */
.loading-dots::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

```

