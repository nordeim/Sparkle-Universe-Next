// src/components/features/youtube/youtube-embed.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Play, 
  ExternalLink, 
  Clock, 
  Eye, 
  ThumbsUp,
  Calendar,
  Tv,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react'
import { formatNumber, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface YouTubeEmbedProps {
  videoId: string
  className?: string
  showDetails?: boolean
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  loop?: boolean
  startTime?: number
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
  onEnd?: () => void
  aspectRatio?: '16:9' | '4:3' | '1:1'
}

export function YouTubeEmbed({ 
  videoId, 
  className,
  showDetails = true,
  autoplay = false,
  muted = false,
  controls = true,
  loop = false,
  startTime = 0,
  onReady,
  onPlay,
  onPause,
  onEnd,
  aspectRatio = '16:9',
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showPlayer, setShowPlayer] = useState(autoplay)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch video details
  const { data: video, isLoading, error: fetchError } = api.youtube.getVideo.useQuery(
    { videoId },
    { 
      enabled: showDetails,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Calculate aspect ratio padding
  const paddingBottom = aspectRatio === '16:9' ? '56.25%' 
    : aspectRatio === '4:3' ? '75%' 
    : '100%'

  // YouTube Player API
  useEffect(() => {
    if (!showPlayer || !window.YT) return

    const player = new window.YT.Player(iframeRef.current, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: controls ? 1 : 0,
        loop: loop ? 1 : 0,
        mute: muted ? 1 : 0,
        start: startTime,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event: any) => {
          setIsLoaded(true)
          onReady?.()
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true)
            onPlay?.()
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false)
            onPause?.()
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false)
            onEnd?.()
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event.data)
          setError('Failed to load video')
        },
      },
    })

    return () => {
      player.destroy()
    }
  }, [showPlayer, videoId, autoplay, controls, loop, muted, startTime, onReady, onPlay, onPause, onEnd])

  // Handle play button click
  const handlePlay = useCallback(() => {
    setShowPlayer(true)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (iframeRef.current && window.YT) {
      const player = window.YT.get(iframeRef.current)
      if (isMuted) {
        player.unMute()
      } else {
        player.mute()
      }
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  if (fetchError || error) {
    return (
      <div className={cn('relative bg-muted rounded-lg p-8 text-center', className)}>
        <p className="text-muted-foreground">
          {error || 'Failed to load video'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative group', className)} ref={containerRef}>
      <div 
        className="relative overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom }}
      >
        {showPlayer ? (
          <>
            {/* YouTube iframe */}
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
                autoplay: autoplay ? '1' : '0',
                controls: controls ? '1' : '0',
                loop: loop ? '1' : '0',
                mute: muted ? '1' : '0',
                start: startTime.toString(),
                rel: '0',
                modestbranding: '1',
                playsinline: '1',
                enablejsapi: '1',
                origin: window.location.origin,
              })}`}
              title={video?.title || 'YouTube video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              onLoad={() => setIsLoaded(true)}
            />
            
            {/* Loading overlay */}
            <AnimatePresence>
              {!isLoaded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black"
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                    <p className="text-white text-sm">Loading video...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom controls overlay */}
            {controls && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Thumbnail */}
            {video?.thumbnail || !showDetails ? (
              <Image
                src={video?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={video?.title || 'Video thumbnail'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  // Fallback to standard quality if maxres fails
                  e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                }}
              />
            ) : (
              <Skeleton className="absolute inset-0" />
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlay}
                className="bg-red-600 hover:bg-red-700 rounded-full p-5 shadow-2xl transform transition-all duration-200"
                aria-label="Play video"
              >
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </motion.button>
            </div>

            {/* Duration badge */}
            {video?.duration && (
              <Badge 
                className="absolute bottom-2 right-2 bg-black/80 text-white border-0"
              >
                {video.durationFormatted}
              </Badge>
            )}

            {/* Live badge */}
            {video?.liveBroadcast && (
              <Badge 
                variant="destructive"
                className="absolute top-2 right-2 gap-1"
              >
                <Tv className="h-3 w-3" />
                LIVE
              </Badge>
            )}

            {/* Premiere badge */}
            {video?.premiereDate && new Date(video.premiereDate) > new Date() && (
              <Badge 
                className="absolute top-2 left-2 bg-blue-600 text-white border-0 gap-1"
              >
                <Calendar className="h-3 w-3" />
                Premiere
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Video details */}
      {showDetails && video && (
        <div className="mt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              <a 
                href={`https://youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {video.title}
              </a>
            </h3>
            
            {/* Channel info */}
            <div className="flex items-center justify-between mt-2">
              <a
                href={`https://youtube.com/channel/${video.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {video.channelTitle}
              </a>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(video.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {formatNumber(video.likeCount)}
                </span>
                <a
                  href={`https://youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {video.tags.length > 5 && (
                <Badge variant="ghost" className="text-xs">
                  +{video.tags.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Description preview */}
          {video.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {video.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Ensure YouTube IFrame API is loaded
if (typeof window !== 'undefined' && !window.YT) {
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
}
