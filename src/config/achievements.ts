// src/config/achievements.ts
import { z } from 'zod'

// Achievement rarity enum
export const AchievementRarity = z.enum([
  'common',
  'uncommon', 
  'rare',
  'epic',
  'legendary',
  'mythic'
])

export type AchievementRarity = z.infer<typeof AchievementRarity>

// Achievement category enum
export const AchievementCategory = z.enum([
  'content',
  'social',
  'engagement',
  'special',
  'seasonal',
  'hidden'
])

export type AchievementCategory = z.infer<typeof AchievementCategory>

// Achievement interface
export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  icon: string
  animatedIcon?: string
  xp: number
  sparklePoints?: number
  rarity: AchievementRarity
  category: AchievementCategory
  trigger: string
  criteria: Record<string, any>
  hidden?: boolean
  seasonal?: boolean
  expiresAt?: Date
  prerequisiteIds?: string[]
}

// Achievement definitions
export const achievements: Achievement[] = [
  // ===== CONTENT CREATION ACHIEVEMENTS =====
  {
    id: 'ach_first_post',
    code: 'FIRST_POST',
    name: 'First Steps',
    description: 'Create your first post in Sparkle Universe',
    icon: '✍️',
    animatedIcon: '✨✍️✨',
    xp: 50,
    rarity: 'common',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 1 }
  },
  {
    id: 'ach_prolific_writer',
    code: 'PROLIFIC_WRITER',
    name: 'Prolific Writer',
    description: 'Create 10 posts',
    icon: '📚',
    xp: 200,
    rarity: 'uncommon',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 10 }
  },
  {
    id: 'ach_content_creator',
    code: 'CONTENT_CREATOR',
    name: 'Content Creator',
    description: 'Create 50 posts',
    icon: '🎨',
    xp: 500,
    rarity: 'rare',
    category: 'content',
    trigger: 'post_created',
    criteria: { postCount: 50 }
  },
  {
    id: 'ach_viral_sensation',
    code: 'VIRAL_SENSATION',
    name: 'Viral Sensation',
    description: 'Get 1000 reactions on a single post',
    icon: '🔥',
    xp: 1000,
    sparklePoints: 100,
    rarity: 'epic',
    category: 'content',
    trigger: 'post_liked',
    criteria: { reactions: 1000 }
  },
  {
    id: 'ach_trending_master',
    code: 'TRENDING_MASTER',
    name: 'Trending Master',
    description: 'Have 3 posts trending simultaneously',
    icon: '📈',
    xp: 750,
    rarity: 'rare',
    category: 'content',
    trigger: 'post_trending',
    criteria: { trendingPosts: 3 }
  },
  {
    id: 'ach_featured_creator',
    code: 'FEATURED_CREATOR',
    name: 'Featured Creator',
    description: 'Get your post featured by admins',
    icon: '⭐',
    xp: 300,
    rarity: 'uncommon',
    category: 'content',
    trigger: 'post_featured',
    criteria: { featured: true }
  },

  // ===== SOCIAL ACHIEVEMENTS =====
  {
    id: 'ach_first_follower',
    code: 'FIRST_FOLLOWER',
    name: 'Making Friends',
    description: 'Get your first follower',
    icon: '🤝',
    xp: 30,
    rarity: 'common',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 1 }
  },
  {
    id: 'ach_social_butterfly',
    code: 'SOCIAL_BUTTERFLY',
    name: 'Social Butterfly',
    description: 'Reach 50 followers',
    icon: '🦋',
    xp: 300,
    rarity: 'uncommon',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 50 }
  },
  {
    id: 'ach_community_leader',
    code: 'COMMUNITY_LEADER',
    name: 'Community Leader',
    description: 'Reach 500 followers',
    icon: '👑',
    xp: 750,
    sparklePoints: 50,
    rarity: 'rare',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 500 }
  },
  {
    id: 'ach_influencer',
    code: 'INFLUENCER',
    name: 'Influencer',
    description: 'Reach 1000 followers',
    icon: '💫',
    xp: 1500,
    sparklePoints: 200,
    rarity: 'epic',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 1000 }
  },
  {
    id: 'ach_sparkle_star',
    code: 'SPARKLE_STAR',
    name: 'Sparkle Star',
    description: 'Reach 10,000 followers',
    icon: '🌟',
    xp: 5000,
    sparklePoints: 1000,
    rarity: 'legendary',
    category: 'social',
    trigger: 'user_followed',
    criteria: { followers: 10000 }
  },
  {
    id: 'ach_networker',
    code: 'NETWORKER',
    name: 'Networker',
    description: 'Follow 100 users',
    icon: '🔗',
    xp: 150,
    rarity: 'common',
    category: 'social',
    trigger: 'user_follow',
    criteria: { following: 100 }
  },

  // ===== ENGAGEMENT ACHIEVEMENTS =====
  {
    id: 'ach_conversationalist',
    code: 'CONVERSATIONALIST',
    name: 'Conversationalist',
    description: 'Leave 100 comments',
    icon: '💬',
    xp: 150,
    rarity: 'common',
    category: 'engagement',
    trigger: 'comment_created',
    criteria: { comments: 100 }
  },
  {
    id: 'ach_discussion_leader',
    code: 'DISCUSSION_LEADER',
    name: 'Discussion Leader',
    description: 'Start 50 comment threads that get 10+ replies',
    icon: '🗣️',
    xp: 400,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'comment_thread',
    criteria: { popularThreads: 50 }
  },
  {
    id: 'ach_helpful_member',
    code: 'HELPFUL_MEMBER',
    name: 'Helpful Member',
    description: 'Receive 50 likes on your comments',
    icon: '🤲',
    xp: 200,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'comment_liked',
    criteria: { commentLikes: 50 }
  },
  {
    id: 'ach_reaction_giver',
    code: 'REACTION_GIVER',
    name: 'Reaction Enthusiast',
    description: 'Give 500 reactions',
    icon: '😊',
    xp: 100,
    rarity: 'common',
    category: 'engagement',
    trigger: 'reaction_given',
    criteria: { reactionsGiven: 500 }
  },
  {
    id: 'ach_sparkle_supporter',
    code: 'SPARKLE_SUPPORTER',
    name: 'Sparkle Supporter',
    description: 'Use the Sparkle reaction 100 times',
    icon: '✨',
    xp: 250,
    rarity: 'uncommon',
    category: 'engagement',
    trigger: 'sparkle_reaction',
    criteria: { sparkleReactions: 100 }
  },

  // ===== SPECIAL ACHIEVEMENTS =====
  {
    id: 'ach_early_adopter',
    code: 'EARLY_ADOPTER',
    name: 'Early Adopter',
    description: 'Join during the first month of launch',
    icon: '🌅',
    xp: 500,
    sparklePoints: 100,
    rarity: 'legendary',
    category: 'special',
    trigger: 'user_created',
    criteria: { joinDate: 'first_month' }
  },
  {
    id: 'ach_verified_creator',
    code: 'VERIFIED_CREATOR',
    name: 'Verified Creator',
    description: 'Get your account verified',
    icon: '✓',
    xp: 1000,
    rarity: 'epic',
    category: 'special',
    trigger: 'user_verified',
    criteria: { verified: true }
  },
  {
    id: 'ach_youtube_connected',
    code: 'YOUTUBE_CONNECTED',
    name: 'YouTube Connected',
    description: 'Connect your YouTube channel',
    icon: '📺',
    xp: 100,
    rarity: 'common',
    category: 'special',
    trigger: 'youtube_connected',
    criteria: { youtubeConnected: true }
  },
  {
    id: 'ach_watch_party_host',
    code: 'WATCH_PARTY_HOST',
    name: 'Party Host',
    description: 'Host 10 watch parties',
    icon: '🎉',
    xp: 400,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'watchparty_hosted',
    criteria: { watchPartiesHosted: 10 }
  },
  {
    id: 'ach_streak_master',
    code: 'STREAK_MASTER',
    name: 'Streak Master',
    description: 'Maintain a 30-day login streak',
    icon: '🔥',
    xp: 750,
    sparklePoints: 50,
    rarity: 'rare',
    category: 'special',
    trigger: 'streak',
    criteria: { streakDays: 30 }
  },
  {
    id: 'ach_dedication',
    code: 'DEDICATION',
    name: 'Dedication',
    description: 'Maintain a 100-day login streak',
    icon: '💎',
    xp: 2000,
    sparklePoints: 500,
    rarity: 'legendary',
    category: 'special',
    trigger: 'streak',
    criteria: { streakDays: 100 }
  },
  {
    id: 'ach_night_owl',
    code: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Create 10 posts between midnight and 5 AM',
    icon: '🦉',
    xp: 200,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'post_created',
    criteria: { nightPosts: 10 }
  },
  {
    id: 'ach_level_10',
    code: 'LEVEL_10',
    name: 'Rising Star',
    description: 'Reach level 10',
    icon: '🌟',
    xp: 100,
    rarity: 'common',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 10 }
  },
  {
    id: 'ach_level_25',
    code: 'LEVEL_25',
    name: 'Veteran',
    description: 'Reach level 25',
    icon: '🎖️',
    xp: 500,
    rarity: 'uncommon',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 25 }
  },
  {
    id: 'ach_level_50',
    code: 'LEVEL_50',
    name: 'Elite',
    description: 'Reach level 50',
    icon: '👑',
    xp: 1000,
    sparklePoints: 250,
    rarity: 'rare',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 50 }
  },
  {
    id: 'ach_level_100',
    code: 'LEVEL_100',
    name: 'Legendary',
    description: 'Reach level 100',
    icon: '🏆',
    xp: 5000,
    sparklePoints: 2000,
    rarity: 'mythic',
    category: 'special',
    trigger: 'level_up',
    criteria: { level: 100 }
  },

  // ===== SEASONAL ACHIEVEMENTS =====
  {
    id: 'ach_sparkle_anniversary',
    code: 'SPARKLE_ANNIVERSARY',
    name: 'Anniversary Celebration',
    description: 'Participate in Sparkle Universe anniversary event',
    icon: '🎂',
    xp: 1000,
    sparklePoints: 200,
    rarity: 'epic',
    category: 'seasonal',
    seasonal: true,
    trigger: 'event_participation',
    criteria: { event: 'anniversary' }
  },
  {
    id: 'ach_summer_sparkle',
    code: 'SUMMER_SPARKLE',
    name: 'Summer Sparkle',
    description: 'Complete all summer challenges',
    icon: '☀️',
    xp: 750,
    rarity: 'rare',
    category: 'seasonal',
    seasonal: true,
    trigger: 'seasonal_complete',
    criteria: { season: 'summer' }
  },

  // ===== HIDDEN ACHIEVEMENTS =====
  {
    id: 'ach_bug_hunter',
    code: 'BUG_HUNTER',
    name: 'Bug Hunter',
    description: 'Report a bug that gets fixed',
    icon: '🐛',
    xp: 500,
    rarity: 'rare',
    category: 'hidden',
    hidden: true,
    trigger: 'bug_reported',
    criteria: { bugFixed: true }
  },
  {
    id: 'ach_sparkle_superfan',
    code: 'SPARKLE_SUPERFAN',
    name: 'True Sparkle Fan',
    description: 'Complete all Sparkle-themed challenges and collect all Sparkle badges',
    icon: '✨',
    xp: 10000,
    sparklePoints: 5000,
    rarity: 'mythic',
    category: 'hidden',
    hidden: true,
    trigger: 'sparkle_completion',
    criteria: { 
      sparkleAchievements: 'all',
      sparkleChallenges: 'all'
    }
  },
  {
    id: 'ach_moderator_appreciation',
    code: 'MOD_APPRECIATION',
    name: 'Moderator\'s Choice',
    description: 'Receive special recognition from a moderator',
    icon: '🛡️',
    xp: 1000,
    rarity: 'epic',
    category: 'hidden',
    hidden: true,
    trigger: 'mod_recognition',
    criteria: { recognized: true }
  }
]

// Helper functions for achievement management
export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(a => a.id === id)
}

export function getAchievementByCode(code: string): Achievement | undefined {
  return achievements.find(a => a.code === code)
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return achievements.filter(a => a.category === category)
}

export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return achievements.filter(a => a.rarity === rarity)
}

export function getVisibleAchievements(): Achievement[] {
  return achievements.filter(a => !a.hidden)
}

export function getSeasonalAchievements(): Achievement[] {
  return achievements.filter(a => a.seasonal)
}

export function getAchievementPoints(achievement: Achievement): number {
  const rarityMultipliers: Record<AchievementRarity, number> = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5,
    mythic: 10,
  }
  
  return Math.floor(achievement.xp * rarityMultipliers[achievement.rarity])
}

// Achievement group definitions for UI
export const achievementGroups = {
  beginner: [
    'ach_first_post',
    'ach_first_follower',
    'ach_conversationalist',
    'ach_reaction_giver',
    'ach_level_10'
  ],
  content: [
    'ach_prolific_writer',
    'ach_content_creator',
    'ach_viral_sensation',
    'ach_trending_master',
    'ach_featured_creator'
  ],
  social: [
    'ach_social_butterfly',
    'ach_community_leader',
    'ach_influencer',
    'ach_sparkle_star',
    'ach_networker'
  ],
  dedication: [
    'ach_streak_master',
    'ach_dedication',
    'ach_level_50',
    'ach_level_100'
  ]
}
