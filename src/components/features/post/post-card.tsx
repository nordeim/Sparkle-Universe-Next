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
