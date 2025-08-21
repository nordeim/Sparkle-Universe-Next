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

// Define the schema with proper types - make fields match form expectations
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  categoryId: z.string().optional(),
  seriesId: z.string().optional(),
  seriesOrder: z.number().int().positive().optional(),
  youtubeVideoId: z.string().optional(),
  isDraft: z.boolean(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed'),
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

  // Fix form type to match schema exactly
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

  const onSubmit = handleSubmit(async (data) => {
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
  })

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

      <form onSubmit={onSubmit}>
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
