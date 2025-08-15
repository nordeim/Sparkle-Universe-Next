// src/components/features/gamification/level-progress.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  TrendingUp, 
  Zap, 
  Star,
  Sparkles,
  Crown,
  Target,
  Award
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface LevelProgressProps {
  userId: string
  showDetails?: boolean
  compact?: boolean
  showAnimations?: boolean
  className?: string
}

interface LevelUpAnimation {
  show: boolean
  oldLevel: number
  newLevel: number
}

export function LevelProgress({ 
  userId, 
  showDetails = true,
  compact = false,
  showAnimations = true,
  className
}: LevelProgressProps) {
  const [levelUpAnimation, setLevelUpAnimation] = useState<LevelUpAnimation>({
    show: false,
    oldLevel: 0,
    newLevel: 0,
  })

  const { data: stats, isLoading, refetch } = api.gamification.getUserStats.useQuery(
    { userId },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Subscribe to real-time level up events
  useEffect(() => {
    if (!showAnimations) return

    const handleLevelUp = (data: any) => {
      if (data.userId === userId) {
        setLevelUpAnimation({
          show: true,
          oldLevel: data.oldLevel,
          newLevel: data.newLevel,
        })

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'],
        })

        // Refetch stats
        refetch()

        // Hide animation after 3 seconds
        setTimeout(() => {
          setLevelUpAnimation(prev => ({ ...prev, show: false }))
        }, 3000)
      }
    }

    // Subscribe to WebSocket events
    // socket.on('user:levelUp', handleLevelUp)

    return () => {
      // socket.off('user:levelUp', handleLevelUp)
    }
  }, [userId, showAnimations, refetch])

  if (isLoading || !stats) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-8 bg-muted rounded mb-2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </div>
      </Card>
    )
  }

  const getLevelIcon = (level: number) => {
    if (level >= 100) return <Crown className="w-5 h-5" />
    if (level >= 50) return <Trophy className="w-5 h-5" />
    if (level >= 25) return <Star className="w-5 h-5" />
    if (level >= 10) return <Zap className="w-5 h-5" />
    return <Sparkles className="w-5 h-5" />
  }

  const getLevelColor = (level: number) => {
    if (level >= 100) return 'from-yellow-400 to-orange-500'
    if (level >= 50) return 'from-purple-400 to-pink-500'
    if (level >= 25) return 'from-blue-400 to-indigo-500'
    if (level >= 10) return 'from-green-400 to-emerald-500'
    return 'from-gray-400 to-gray-600'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 #1', color: 'bg-yellow-500' }
    if (rank === 2) return { text: '🥈 #2', color: 'bg-gray-400' }
    if (rank === 3) return { text: '🥉 #3', color: 'bg-orange-600' }
    if (rank <= 10) return { text: `Top 10`, color: 'bg-purple-500' }
    if (rank <= 100) return { text: `Top 100`, color: 'bg-blue-500' }
    return null
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn(
          "relative w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shadow-lg",
          getLevelColor(stats.level)
        )}>
          {stats.level}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Level {stats.level}</span>
            {stats.ranks.global <= 100 && (
              <Badge variant="secondary" className="text-xs">
                Rank #{stats.ranks.global}
              </Badge>
            )}
          </div>
          <Progress 
            value={stats.progress.percentage} 
            className="h-1.5 mt-1"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatNumber(stats.experience)} XP
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-6 space-y-4">
          {/* Level and XP Display */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  "relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-xl",
                  getLevelColor(stats.level)
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
                <span className="relative text-2xl font-bold">{stats.level}</span>
                <div className="absolute -bottom-1 -right-1 text-yellow-400">
                  {getLevelIcon(stats.level)}
                </div>
              </motion.div>
              
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Level {stats.level}
                  {stats.level >= 50 && (
                    <Badge variant="outline" className="text-xs">
                      Elite
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Rank #{stats.ranks.global}</span>
                  {getRankBadge(stats.ranks.global) && (
                    <Badge 
                      className={cn(
                        "text-xs text-white",
                        getRankBadge(stats.ranks.global)!.color
                      )}
                    >
                      {getRankBadge(stats.ranks.global)!.text}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-sparkle-500 to-sparkle-700 bg-clip-text text-transparent">
                  {formatNumber(stats.experience)}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to Level {stats.level + 1}
              </span>
              <span className="font-medium">
                {formatNumber(stats.progress.current)} / {formatNumber(stats.progress.needed)} XP
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={stats.progress.percentage} 
                className="h-3"
              />
              {showAnimations && stats.progress.percentage > 0 && (
                <motion.div
                  className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progress.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              )}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {stats.progress.percentage.toFixed(1)}% Complete
            </p>
          </div>

          {/* Stats Grid */}
          {showDetails && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <motion.div 
                  className="text-center p-3 bg-muted/50 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Award className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold">{stats.achievements.unlocked}</p>
                  <p className="text-xs text-muted-foreground">Achievements</p>
                </motion.div>
                <motion.div 
                  className="text-center p-3 bg-muted/50 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Target className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold">{stats.streaks.current}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </motion.div>
              </div>

              {/* Recent XP Gains */}
              {stats.recentXP.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Activity
                  </h4>
                  <div className="space-y-1">
                    {stats.recentXP.slice(0, 3).map((xp, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground truncate flex-1">
                          {xp.reason}
                        </span>
                        <span className="font-medium text-green-500">
                          +{xp.amount} XP
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Milestone */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next Milestone</span>
                  <span className="font-medium">
                    Level {Math.ceil(stats.level / 10) * 10}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Level Up Animation */}
      <AnimatePresence>
        {levelUpAnimation.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              className="bg-background/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border-2 border-yellow-500"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(250, 204, 21, 0.4)",
                  "0 0 0 20px rgba(250, 204, 21, 0)",
                ],
              }}
              transition={{
                duration: 1,
                repeat: 3,
              }}
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                >
                  <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold">Level Up!</h2>
                  <p className="text-xl text-muted-foreground mt-2">
                    Level {levelUpAnimation.oldLevel} → {levelUpAnimation.newLevel}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
