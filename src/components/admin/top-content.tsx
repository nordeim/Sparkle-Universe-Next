// src/components/admin/top-content.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Star,
  Award,
  Crown,
  Trophy,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react'
import { formatNumber, formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'

interface ContentItem {
  id: string
  title: string
  author: {
    id: string
    name: string
    avatar?: string
    verified?: boolean
  }
  type: 'post' | 'video' | 'comment'
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    engagement: number
  }
  createdAt: Date
  tags?: string[]
  trending?: boolean
  featured?: boolean
}

interface Creator {
  id: string
  name: string
  avatar?: string
  verified?: boolean
  followers: number
  posts: number
  engagement: number
  growth: number
  rank?: number
}

export function TopContent() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week')
  const [contentType, setContentType] = useState<'posts' | 'videos' | 'creators'>('posts')
  const [topContent, setTopContent] = useState<ContentItem[]>([])
  const [topCreators, setTopCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopContent()
  }, [timeRange, contentType])

  const fetchTopContent = async () => {
    setLoading(true)
    try {
      // Simulate API call
      if (contentType === 'creators') {
        setTopCreators(generateMockCreators())
      } else {
        setTopContent(generateMockContent(contentType))
      }
    } catch (error) {
      console.error('Failed to fetch top content:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockContent = (type: string): ContentItem[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `content-${i}`,
      title: `${type === 'videos' ? 'Video:' : 'Post:'} Amazing ${['Sparkle', 'Universe', 'Community', 'Tutorial', 'Review'][i % 5]} Content ${i + 1}`,
      author: {
        id: `author-${i}`,
        name: `Creator ${i + 1}`,
        avatar: `https://avatar.vercel.sh/creator${i}`,
        verified: i < 3
      },
      type: type === 'videos' ? 'video' : 'post',
      metrics: {
        views: Math.floor(Math.random() * 100000) + 1000,
        likes: Math.floor(Math.random() * 10000) + 100,
        comments: Math.floor(Math.random() * 1000) + 10,
        shares: Math.floor(Math.random() * 500) + 5,
        engagement: Math.random() * 20 + 5
      },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      tags: ['sparkle', 'trending', 'featured'].slice(0, Math.floor(Math.random() * 3) + 1),
      trending: i < 3,
      featured: i === 0
    })).sort((a, b) => b.metrics.views - a.metrics.views)
  }

  const generateMockCreators = (): Creator[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `creator-${i}`,
      name: `Top Creator ${i + 1}`,
      avatar: `https://avatar.vercel.sh/topcreator${i}`,
      verified: i < 5,
      followers: Math.floor(Math.random() * 100000) + 1000,
      posts: Math.floor(Math.random() * 500) + 50,
      engagement: Math.random() * 30 + 10,
      growth: Math.random() * 100 - 20,
      rank: i + 1
    }))
  }

  const getRankIcon = (rank?: number) => {
    if (!rank) return null
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Content</CardTitle>
            <CardDescription>Trending and high-performing content</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('day')}
            >
              Today
            </Button>
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              All Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={contentType} onValueChange={(v: any) => setContentType(v)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Top Posts</TabsTrigger>
            <TabsTrigger value="videos">Top Videos</TabsTrigger>
            <TabsTrigger value="creators">Top Creators</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {topContent.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/post/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.author.avatar} />
                          <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{item.author.name}</span>
                        {item.author.verified && <Star className="h-3 w-3 text-primary" />}
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    {item.trending && <Badge variant="destructive">Trending</Badge>}
                    {item.featured && <Badge>Featured</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatNumber(item.metrics.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {formatNumber(item.metrics.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {formatNumber(item.metrics.comments)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      {formatNumber(item.metrics.shares)}
                    </span>
                    <span className="flex items-center gap-1 ml-auto text-primary">
                      <TrendingUp className="h-4 w-4" />
                      {item.metrics.engagement.toFixed(1)}% engagement
                    </span>
                  </div>
                  
                  {item.tags && (
                    <div className="flex items-center gap-1">
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/post/${item.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="videos" className="mt-4 space-y-4">
            {topContent.map((item, index) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/video/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.author.avatar} />
                          <AvatarFallback>{item.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{item.author.name}</span>
                        {item.author.verified && <Star className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                    {item.trending && <Badge variant="destructive">Trending</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatNumber(item.metrics.views)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {formatNumber(item.metrics.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {formatNumber(item.metrics.comments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="creators" className="mt-4 space-y-4">
            {topCreators.map(creator => (
              <div key={creator.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(creator.rank)}
                </div>
                
                <Avatar className="h-12 w-12">
                  <AvatarImage src={creator.avatar} />
                  <AvatarFallback>{creator.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/user/${creator.id}`} className="font-medium hover:underline">
                      {creator.name}
                    </Link>
                    {creator.verified && <Star className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatNumber(creator.followers)} followers</span>
                    <span>{formatNumber(creator.posts)} posts</span>
                    <span className={cn(
                      'flex items-center gap-1',
                      creator.growth > 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      {Math.abs(creator.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">{creator.engagement.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default TopContent
