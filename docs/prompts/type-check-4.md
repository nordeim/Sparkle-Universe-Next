awesome job! http://localhost:3000/register gives 404 error. please also improve the color scheme and contrast, add gradient and generally make the whole landing page appear lighter in tone and much more pleasing and apealing looking. please carefully and meticulously compare your newly generated version of complete replacement files against the original version to ensure that you did not omit any of the original features and functions. Please generate a complete updated replacement file for that merges your improvements and fixes. please put on your deep-thinking hat to deeply think and carefully and thoroughly explore for the best implementation option to re-image improvement and fixes. Please remember to carefully and meticulously create a detailed and comprehensive execution plan with integrated checklist before your proceed carefully. Please let me know if you need the content of any of the existing files to review. Do not make up the content of the existing files.

Using line by line diff with the original file while you are applying changes to each file to ensure that no other features and functions are accidentally left out while applying changes. we don't want to introduce regression failure while updating the code.

---
Awesome meticulous review and thorough and systematic in creating complete working replacement files! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant!

Please put on the same deep-thinking hat to deeply and thoroughly explore carefully and systematically to create the complete and working drop-in replacement for the files listed below. please use the same rigorous and meticulous approach to deeply and thoroughly explore for the best implementation option to create the complete updated version of the files listed that need modification to incorporate your recommended improvements and fixes or new files to be added. please carefully plan how to create the complete version of each of these files before proceeding cautiously. for each file generated or updated, make sure it is a complete drop-in replacement version without any placeholder comments.

please carefully and meticulously compare your newly generated version of complete replacement files against the original version to ensure that you did not omit any of the original features and functions. Please generate a complete updated replacement file for that merges your improvements and fixes. please put on your deep-thinking hat to deeply think and carefully and thoroughly explore for the best implementation option to re-image improvement and fixes. Please remember to carefully and meticulously create a detailed and comprehensive execution plan with integrated checklist before your proceed carefully. Please let me know if you need the content of any of the existing files to review. Do not make up the content of the existing files.

Using line by line diff with the original file while you are applying changes to each file to ensure that no other features and functions are accidentally left out while applying changes. we don't want to introduce regression failure while updating the code. thank you and good luck my very best coding assistant and expert in the world!

---
Awesome meticulous review and thorough and systematic in creating complete working replacement files! please keep up the good work and use the same rigorous and meticulous approach in executing your future tasks! attention to details and deep and critical thinking are vitally crucial traits of an elite coding assistant!

Please put on the same deep-thinking hat to deeply and thoroughly explore carefully and systematically to create the complete and working drop-in replacement for the files listed below. please use the same rigorous and meticulous approach to deeply and thoroughly explore for the best implementation option to create the complete updated version of the files listed that need modification to incorporate your recommended improvements and fixes or new files to be added. please carefully plan how to create the complete version of each of these files before proceeding cautiously. for each file generated or updated, make sure it is a complete drop-in replacement version without any placeholder comments. thank you and good luck my very best coding assistant and expert in the world!

# List of files to modify:
- src/app/(main)/create/page.tsx (update original version shared below)
- src/components/error-boundary.tsx (update original version shared below)

# List of missing ui component files to create:
- src/components/ui/use-toast.ts
- src/components/ui/popover.tsx

---
# original file: cat 'src/app/(main)/create/page.tsx'
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

# original file: src/components/error-boundary.tsx
```tsx
// src/components/error-boundary.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { trackError } from '@/lib/monitoring'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    trackError(error, {
      componentStack: errorInfo.componentStack,
      digest: errorInfo.digest,
    })
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Oops! Something went wrong</h2>
        <p className="mb-6 text-muted-foreground">
          We apologize for the inconvenience. An error occurred while loading this page.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-6 max-w-full overflow-auto rounded-lg bg-gray-100 p-4 text-left text-sm dark:bg-gray-800">
            <code>{error.message}</code>
          </pre>
        )}
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Async error boundary for Next.js app directory
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
```
