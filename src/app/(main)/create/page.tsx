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
import { useToast } from '@/components/ui/use-toast'
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

// Define the schema inline to ensure type consistency
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  seriesId: z.string().optional(),
  seriesOrder: z.number().optional(),
  youtubeVideoId: z.string().optional(),
  isDraft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

type CreatePostInput = z.infer<typeof createPostSchema>

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null
  
  // Handle direct video ID
  if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
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
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

export default function CreatePostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

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
    },
  })

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty && !isSubmitting && !isSavingDraft) {
        handleSaveDraft()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [form.formState.isDirty, isSubmitting, isSavingDraft])

  // Get categories - check if category router exists, otherwise use empty array
  const categoriesQuery = api.post?.getCategories?.useQuery?.() || { data: [] }
  const categories = categoriesQuery.data || []

  // Create post mutation
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
        // Use post ID for navigation since slug might not be returned
        router.push(`/post/${post.id}`)
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
      setIsSubmitting(false)
      setIsSavingDraft(false)
    },
  })

  const handleSaveDraft = async () => {
    if (isSavingDraft || isSubmitting) return
    
    setIsSavingDraft(true)
    const data = form.getValues()
    
    // Validate minimum requirements for draft
    if (!data.title && !data.content) {
      toast({
        title: 'Cannot save empty draft',
        description: 'Please add a title or content before saving.',
        variant: 'destructive',
      })
      setIsSavingDraft(false)
      return
    }
    
    createPost.mutate({
      ...data,
      tags,
      isDraft: true,
    })
  }

  const onSubmit = async (data: CreatePostInput) => {
    if (isSubmitting || isSavingDraft) return
    
    setIsSubmitting(true)
    createPost.mutate({
      ...data,
      tags,
      isDraft: false,
    })
  }

  const handleAddTag = () => {
    if (tagInput && tags.length < 5) {
      const formattedTag = tagInput
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      
      if (formattedTag && !tags.includes(formattedTag)) {
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
      form.setValue('youtubeVideoId', videoId, { shouldDirty: true })
    } else if (e.target.value === '') {
      form.setValue('youtubeVideoId', undefined, { shouldDirty: true })
    }
  }

  const handleFormSubmit = form.handleSubmit(onSubmit)

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
          <form onSubmit={handleFormSubmit} className="space-y-6">
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
                      onChange={(content) => form.setValue('content', content, { shouldDirty: true })}
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
                        <p className="lead text-muted-foreground">{form.watch('excerpt')}</p>
                      )}
                      {form.watch('youtubeVideoId') && (
                        <div className="my-6">
                          <YouTubeEmbed videoId={form.watch('youtubeVideoId')} />
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
                  onClick={handleFormSubmit}
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
          {categories.length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.watch('categoryId') || ''}
                  onValueChange={(value) => form.setValue('categoryId', value || undefined)}
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
                  disabled={tags.length >= 5 || !tagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
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
                onChange={handleYouTubeUrlChange}
              />
              {form.watch('youtubeVideoId') && (
                <div className="mt-4">
                  <YouTubeEmbed 
                    videoId={form.watch('youtubeVideoId')} 
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
                onClick={() => {
                  if (form.formState.isDirty) {
                    const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
                    if (confirmed) {
                      router.back()
                    }
                  } else {
                    router.back()
                  }
                }}
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
