// src/components/features/gamification/achievement-details-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Trophy,
  Star,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  Award,
  Lock,
  CheckCircle2,
  Calendar,
  Target,
  Zap,
  Share2,
  Twitter,
  Facebook,
  Link2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { achievements, getAchievementById } from '@/config/achievements'
import { cn } from '@/lib/utils'
import { formatNumber, formatDate, formatRelativeTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import confetti from 'canvas-confetti'

interface AchievementDetailsModalProps {
  achievementId: string
  isUnlocked: boolean
  progress?: {
    currentValue: number
    targetValue: number
    percentage: number
  }
  onClose: () => void
}

interface LeaderboardEntry {
  rank: number
  user: {
    id: string
    username: string
    image?: string | null
    level: number
  }
  unlockedAt: Date
  timeToUnlock: number // in days
}

export function AchievementDetailsModal({
  achievementId,
  isUnlocked,
  progress,
  onClose,
}: AchievementDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  
  // Get achievement details from config
  const achievement = getAchievementById(achievementId)
  
  // Get database achievement details with additional stats
  const { data: dbAchievement, isLoading: loadingDb } = api.gamification.getAchievementDetails.useQuery({
    achievementId,
  })
  
  // Get users who unlocked this achievement
  const { data: unlockers, isLoading: loadingUnlockers } = api.gamification.getAchievementUnlockers.useQuery({
    achievementId,
    limit: 10,
  })
  
  // Get user's specific achievement data
  const { data: userAchievement } = api.gamification.getUserAchievement.useQuery({
    achievementId,
  })
  
  // Get related achievements
  const { data: relatedAchievements } = api.gamification.getRelatedAchievements.useQuery({
    achievementId,
    limit: 5,
  })
  
  // Share achievement mutation
  const shareAchievement = api.gamification.shareAchievement.useMutation({
    onSuccess: () => {
      toast({
        title: 'Achievement Shared!',
        description: 'Your achievement has been shared with your followers.',
      })
      
      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      })
    },
  })

  if (!achievement) {
    return null
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-500',
      mythic: 'from-pink-400 via-purple-400 to-indigo-400',
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBadgeColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500',
      mythic: 'bg-gradient-to-r from-pink-500 to-purple-500',
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getCompletionDifficulty = (percentage: number) => {
    if (percentage < 1) return { label: 'Mythic', color: 'text-pink-500' }
    if (percentage < 5) return { label: 'Legendary', color: 'text-yellow-500' }
    if (percentage < 10) return { label: 'Epic', color: 'text-purple-500' }
    if (percentage < 25) return { label: 'Rare', color: 'text-blue-500' }
    if (percentage < 50) return { label: 'Uncommon', color: 'text-green-500' }
    return { label: 'Common', color: 'text-gray-500' }
  }

  const handleShare = (platform: 'twitter' | 'facebook' | 'link') => {
    const shareText = `I just unlocked the "${achievement.name}" achievement on Sparkle Universe! 🏆`
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/achievements/${achievementId}`

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        )
        break
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        )
        break
      case 'link':
        navigator.clipboard.writeText(shareUrl)
        toast({
          title: 'Link Copied!',
          description: 'Achievement link has been copied to your clipboard.',
        })
        break
    }

    // Track share in database
    if (isUnlocked) {
      shareAchievement.mutate({ achievementId, platform })
    }
  }

  const completionPercentage = dbAchievement?.stats?.completionRate || 0
  const difficulty = getCompletionDifficulty(completionPercentage)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className={cn(
          "relative h-32 bg-gradient-to-br",
          getRarityColor(achievement.rarity)
        )}>
          {/* Achievement icon */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-5xl shadow-xl">
                {isUnlocked ? achievement.icon : <Lock className="w-10 h-10 text-gray-400" />}
              </div>
              {isUnlocked && (
                <motion.div
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Animated sparkles for mythic achievements */}
          {achievement.rarity === 'mythic' && isUnlocked && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                    opacity: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Share button */}
          {isUnlocked && (
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 backdrop-blur hover:bg-white/30"
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {shareMenuOpen && (
                <Card className="absolute right-0 mt-2 p-2 w-48 z-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('twitter')}
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('facebook')}
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleShare('link')}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and badges */}
          <div className="text-center mb-6">
            <DialogTitle className="text-2xl font-bold mb-2">
              {achievement.name}
            </DialogTitle>
            <DialogDescription className="text-base mb-3">
              {achievement.description}
            </DialogDescription>
            
            <div className="flex items-center justify-center gap-2">
              <Badge 
                className={cn(
                  'text-white',
                  getRarityBadgeColor(achievement.rarity)
                )}
              >
                {achievement.rarity}
              </Badge>
              
              {dbAchievement?.stats && (
                <>
                  <Badge variant="outline">
                    {formatNumber(dbAchievement.stats.totalUnlocked)} players
                  </Badge>
                  <Badge variant="outline" className={difficulty.color}>
                    {difficulty.label} ({completionPercentage.toFixed(1)}%)
                  </Badge>
                </>
              )}
              
              {achievement.seasonal && (
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Seasonal
                </Badge>
              )}
              
              {achievement.hidden && (
                <Badge variant="outline" className="border-purple-500 text-purple-500">
                  Hidden
                </Badge>
              )}
            </div>
          </div>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && progress && progress.percentage > 0 && (
            <Card className="mb-6 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progress</span>
                  <span className="text-muted-foreground">
                    {progress.currentValue} / {progress.targetValue}
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress.percentage.toFixed(1)}% Complete
                </p>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px] mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Rewards */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Rewards
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">
                          {formatNumber(achievement.xp)}
                        </div>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                      {achievement.sparklePoints && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-500">
                            {formatNumber(achievement.sparklePoints)}
                          </div>
                          <p className="text-xs text-muted-foreground">Sparkle Points</p>
                        </div>
                      )}
                      {dbAchievement?.badgeId && (
                        <div className="text-center">
                          <div className="text-2xl">🎖️</div>
                          <p className="text-xs text-muted-foreground">Special Badge</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                {dbAchievement?.stats && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Statistics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">First Unlocked</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.firstUnlockedBy?.username || 'No one yet'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Average Time to Unlock</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.avgTimeToUnlock 
                              ? `${Math.round(dbAchievement.stats.avgTimeToUnlock)} days`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Unlock Rate</span>
                          <span className="text-sm font-medium">
                            {dbAchievement.stats.unlockRate?.toFixed(2) || '0'}% per day
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* User's unlock details */}
                {isUnlocked && userAchievement && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Your Achievement
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Unlocked</span>
                          <span className="text-sm font-medium">
                            {formatDate(userAchievement.unlockedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Time Taken</span>
                          <span className="text-sm font-medium">
                            {formatRelativeTime(userAchievement.timeToUnlock)}
                          </span>
                        </div>
                        {userAchievement.showcased && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Showcased</span>
                            <Badge variant="secondary" className="text-xs">
                              On Profile
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      How to Unlock
                    </h3>
                    
                    {/* Prerequisites */}
                    {achievement.prerequisiteIds && achievement.prerequisiteIds.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Prerequisites:</p>
                        <div className="space-y-1">
                          {achievement.prerequisiteIds.map(preId => {
                            const preAchievement = getAchievementById(preId)
                            return preAchievement ? (
                              <div key={preId} className="flex items-center gap-2 text-sm">
                                <span>{preAchievement.icon}</span>
                                <span>{preAchievement.name}</span>
                              </div>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {/* Criteria */}
                    <div className="space-y-2">
                      {achievement.criteria && Object.entries(achievement.criteria).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === 'number' ? formatNumber(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {dbAchievement?.tips && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">💡 Tips</p>
                        <p className="text-sm text-muted-foreground">
                          {dbAchievement.tips}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      First to Unlock
                    </h3>
                    
                    {loadingUnlockers ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                        ))}
                      </div>
                    ) : unlockers && unlockers.length > 0 ? (
                      <div className="space-y-2">
                        {unlockers.map((entry: LeaderboardEntry, index) => (
                          <motion.div
                            key={entry.user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                index === 0 ? "bg-yellow-500 text-white" :
                                index === 1 ? "bg-gray-400 text-white" :
                                index === 2 ? "bg-orange-600 text-white" :
                                "bg-muted"
                              )}>
                                {index + 1}
                              </div>
                              <div className="flex items-center gap-2">
                                {entry.user.image && (
                                  <img
                                    src={entry.user.image}
                                    alt={entry.user.username}
                                    className="w-6 h-6 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{entry.user.username}</p>
                                  <p className="text-xs text-muted-foreground">Level {entry.user.level}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(entry.unlockedAt)}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        Be the first to unlock this achievement!
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Related Tab */}
              <TabsContent value="related" className="space-y-4">
                {relatedAchievements && relatedAchievements.length > 0 ? (
                  relatedAchievements.map((related: any) => (
                    <Card key={related.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                            related.unlocked 
                              ? `bg-gradient-to-br ${getRarityColor(related.rarity)} text-white`
                              : 'bg-muted'
                          )}>
                            {related.unlocked ? related.icon : <Lock className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{related.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {related.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {related.rarity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {related.xp} XP
                              </span>
                              {related.unlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Unlocked
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No related achievements found</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
