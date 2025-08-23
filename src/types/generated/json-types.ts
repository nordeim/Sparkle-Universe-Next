// JSON Field Type Definitions
// Generated on 2025-08-23T12:43:09.510Z

// Profile JSON types
export interface ThemePreference {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  customColors?: Record<string, string>;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  digest: 'never' | 'daily' | 'weekly' | 'monthly';
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  categories: {
    posts: boolean;
    comments: boolean;
    mentions: boolean;
    follows: boolean;
    messages: boolean;
    groups: boolean;
    events: boolean;
    achievements: boolean;
    system: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  contentVisibility: 'public' | 'followers' | 'private';
  showActivity: boolean;
  showOnlineStatus: boolean;
  allowMessages: 'everyone' | 'followers' | 'none';
  allowFollows: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBirthdate: boolean;
  showLocation: boolean;
  searchable: boolean;
  showInSuggestions: boolean;
}

export interface SocialLinks {
  website?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
  tiktok?: string;
  custom?: Array<{
    label: string;
    url: string;
    icon?: string;
  }>;
}

// Post content types
export interface PostContent {
  type: 'richtext' | 'markdown' | 'html';
  blocks: ContentBlock[];
  version: string;
  metadata?: {
    wordCount: number;
    readingTime: number;
    lastEditedAt: string;
    editHistory?: EditEntry[];
  };
}

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code' | 'image' | 'video' | 'embed';
  content?: string;
  data?: Record<string, any>;
  children?: ContentBlock[];
}

export interface EditEntry {
  timestamp: string;
  editorId: string;
  editorName: string;
  changeNote?: string;
}

// YouTube data types
export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
  duration: string; // ISO 8601 duration
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags: string[];
  categoryId: string;
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
}

// Group settings
export interface GroupSettings {
  autoApproveMembers: boolean;
  requirePostApproval: boolean;
  allowGuestViewing: boolean;
  memberCanInvite: boolean;
  customRoles?: Array<{
    name: string;
    permissions: string[];
    color?: string;
  }>;
  welcomeMessage?: string;
  rules?: string;
  guidelines?: string;
  features: {
    events: boolean;
    polls: boolean;
    marketplace: boolean;
    achievements: boolean;
  };
}

// Quest and achievement data
export interface QuestRequirements {
  type: 'simple' | 'sequential' | 'parallel' | 'choice';
  tasks: Array<{
    id: string;
    description: string;
    target: number;
    current?: number;
    completed?: boolean;
    data?: Record<string, any>;
  }>;
  prerequisites?: string[];
  timeLimit?: number; // in minutes
}

export interface QuestRewards {
  xp: number;
  sparklePoints?: number;
  premiumPoints?: number;
  items?: string[];
  achievements?: string[];
  badges?: string[];
  titles?: string[];
}

// Event agenda
export interface EventAgenda {
  sessions: Array<{
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    speakers?: string[];
    location?: string;
    type: 'keynote' | 'workshop' | 'networking' | 'break' | 'panel' | 'other';
    materials?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  }>;
  tracks?: Array<{
    id: string;
    name: string;
    color: string;
    description?: string;
  }>;
}

// Trade items
export interface TradeItems {
  offered: Array<{
    itemId: string;
    quantity: number;
    metadata?: Record<string, any>;
  }>;
  requested: Array<{
    itemId: string;
    quantity: number;
    metadata?: Record<string, any>;
  }>;
  notes?: string;
}

// AI-related types
export interface AiContentContext {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  previousContext?: string[];
  userPreferences?: Record<string, any>;
}

export interface AiModerationCategories {
  toxic: number;
  severeToxic: number;
  obscene: number;
  threat: number;
  insult: number;
  identityHate: number;
  spam: number;
  custom?: Record<string, number>;
}

// Export type mapping for JSON fields
export const JSON_FIELD_TYPES = {
  'Profile.themePreference': 'ThemePreference',
  'Profile.notificationSettings': 'NotificationSettings',
  'Profile.privacySettings': 'PrivacySettings',
  'Profile.socialLinks': 'SocialLinks',
  'Profile.youtubeChannelData': 'YouTubeVideoData',
  'Post.content': 'PostContent',
  'Post.youtubeVideoData': 'YouTubeVideoData',
  'Group.settings': 'GroupSettings',
  'Event.agenda': 'EventAgenda',
  'Quest.requirements': 'QuestRequirements',
  'Quest.rewards': 'QuestRewards',
  'Trade.initiatorItems': 'TradeItems',
  'Trade.recipientItems': 'TradeItems',
  'AiModerationQueue.aiCategories': 'AiModerationCategories',
} as const
