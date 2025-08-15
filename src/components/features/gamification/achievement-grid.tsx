// src/components/features/gamification/achievement-grid.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Lock, 
  Trophy, 
  Star,
  Search,
  Filter,
  Award,
  Zap,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react'
import { api } from '@/lib/api'
import { achievements, getAchievementsByCategory, AchievementCategory } from '@/config/achievements'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'
import { AchievementDetailsModal } from './achievement-details-modal'

interface AchievementGridProps {
  userId: string
  showHidden?: boolean
  onAchievementClick?: (achievementId: string) => void
}

type SortOption = 'name' | 'rarity' | 'xp' | 'progress' | 'unlocked'
type FilterRarity = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export function AchievementGrid({ 
  userId, 
  showHidden = false,
  onAchievementClick 
}: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rarity')
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all')
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false)
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)
  
  const { data: userAchievements = [], isLoading } = api.gamification.getUserAchievements.useQuery({ 
    userId,
    includeProgress: true,
  })
  
  const { data: achievementProgress = {} } = api.gamification.getAchievementProgress.useQuery({ 
    userId 
  })
  
  const unlockedIds = new Set(userAchievements.map(a => a.achievementId))
  
  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements.filter(achievement => {
      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
        return false
      }
      
      // Hidden filter
      if (!showHidden && achievement.hidden) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          achievement.name.toLowerCase().includes(query) ||
          achievement.description.toLowerCase().includes(query)
        )
      }
      
      // Rarity filter
      if (filterRarity !== 'all' && achievement.rarity !== filterRarity) {
        return false
      }
      
      // Unlocked filter
      if (showOnlyUnlocked && !unlockedIds.has(achievement.id)) {
        return false
      }
      
      return true
    })

    // Sort achievements
    filtered.sort((a, b) => {
      const aUnlocked = unlockedIds.has(a.id)
      const bUnlocked = unlockedIds.has(b.id)
      const aProgress = achievementProgress[a.id] || { percentage: 0 }
      const bProgress = achievementProgress[b.id] || { percentage: 0 }

      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rarity':
          const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
        case 'xp':
          return b.xp - a.xp
        case 'progress':
          return bProgress.percentage - aProgress.percentage
        case 'unlocked':
          if (aUnlocked === bUnlocked) return 0
          return aUnlocked ? -1 : 1
        default:
          return 0
      }
    })

    return filtered
  }, [selectedCategory, showHidden, searchQuery, filterRarity, showOnlyUnlocked, sortBy, unlockedIds, achievementProgress])

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

  const categories: Array<{ value: AchievementCategory | 'all'; label: string; icon: any }> = [
    { value: 'all', label: 'All', icon: Trophy },
    { value: 'content', label: 'Content', icon: Award },
    { value: 'social', label: 'Social', icon: Star },
    { value: 'engagement', label: 'Engagement', icon: Zap },
    { value: 'special', label: 'Special', icon: Sparkles },
  ]

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredAchievements.length
    const unlocked = filteredAchievements.filter(a => unlockedIds.has(a.id)).length
    const totalXP = filteredAchievements.reduce((sum, a) => {
      return sum + (unlockedIds.has(a.id) ? a.xp : 0)
    }, 0)
    const totalPossibleXP = filteredAchievements.reduce((sum, a) => sum + a.xp, 0)

    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
      totalXP,
      totalPossibleXP,
    }
  }, [filteredAchievements, unlockedIds])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Achievements
            </h2>
            <p className="text-muted-foreground">
              Unlock achievements and earn rewards
            </p>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.unlocked}</p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(stats.totalXP)}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{stats.percentage.toFixed(1)}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="xp">XP Value</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="unlocked">Unlocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRarity} onValueChange={(value) => setFilterRarity(value as FilterRarity)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="legendary">Legendary</SelectItem>
              <SelectItem value="mythic">Mythic</SelectItem>
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showOnlyUnlocked ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
                >
                  {showOnlyUnlocked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showOnlyUnlocked ? 'Show all' : 'Show only unlocked'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Category tabs */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
          <TabsList className="grid grid-cols-5 w-full">
            {categories.map(category => (
              <TabsTrigger key={category.value} value={category.value} className="flex items-center gap-1">
                <category.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Achievement grid */}
      <AnimatePresence mode="popLayout">
        {filteredAchievements.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No achievements found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement, index) => {
              const isUnlocked = unlockedIds.has(achievement.id)
              const userAchievement = userAchievements.find(
                ua => ua.achievementId === achievement.id
              )
              const progress = achievementProgress[achievement.id] || {
                currentValue: 0,
                targetValue: 1,
                percentage: 0,
              }

              return (
                <motion.div
                  key={achievement.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setSelectedAchievement(achievement.id)
                    onAchievementClick?.(achievement.id)
                  }}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden cursor-pointer transition-all",
                      isUnlocked
                        ? 'bg-gradient-to-br from-background via-background to-background border-2'
                        : 'opacity-75 hover:opacity-100',
                      isUnlocked && `border-gradient-to-r ${getRarityColor(achievement.rarity)}`
                    )}
                  >
                    {/* Unlocked shimmer effect */}
                    {isUnlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    )}

                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Achievement icon */}
                        <motion.div
                          className={cn(
                            "relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0",
                            isUnlocked
                              ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} text-white shadow-lg`
                              : 'bg-muted'
                          )}
                          animate={isUnlocked ? { rotate: [0, 5, -5, 0] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
                        >
                          {isUnlocked ? (
                            <>
                              <span className="relative z-10">{achievement.icon}</span>
                              {achievement.rarity === 'mythic' && (
                                <div className="absolute inset-0 rounded-full animate-pulse bg-white/20" />
                              )}
                            </>
                          ) : (
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          )}
                          
                          {/* Unlocked checkmark */}
                          {isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.div>
                        
                        {/* Achievement details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {achievement.name}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                'text-xs text-white shrink-0',
                                getRarityBadgeColor(achievement.rarity)
                              )}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {achievement.description}
                          </p>

                          {/* Progress bar for locked achievements */}
                          {!isUnlocked && progress.percentage > 0 && (
                            <div className="space-y-1 mb-2">
                              <Progress value={progress.percentage} className="h-1.5" />
                              <p className="text-xs text-muted-foreground text-center">
                                {progress.currentValue} / {progress.targetValue}
                              </p>
                            </div>
                          )}
                          
                          {/* Rewards and unlock date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {achievement.xp} XP
                              </span>
                              {achievement.sparklePoints && (
                                <span className="text-xs font-medium flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-500" />
                                  {achievement.sparklePoints}
                                </span>
                              )}
                            </div>
                            
                            {isUnlocked && userAchievement && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Achievement details modal */}
      {selectedAchievement && (
        <AchievementDetailsModal
          achievementId={selectedAchievement}
          isUnlocked={unlockedIds.has(selectedAchievement)}
          progress={achievementProgress[selectedAchievement]}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  )
}
