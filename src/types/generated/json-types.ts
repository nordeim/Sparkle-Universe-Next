// JSON Field Type Definitions
// Generated on 2025-08-23T14:31:51.128Z
// Complete type definitions for all JSON fields in the schema

// ============================================
// Profile Related Types
// ============================================

export interface ThemePreference {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  customColors?: Record<string, string>;
  fontFamily?: string;
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
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
    timezone?: string;
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
    marketing: boolean;
    security: boolean;
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
  allowTagging: boolean;
  allowMentions: 'everyone' | 'followers' | 'none';
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
  facebook?: string;
  reddit?: string;
  custom?: Array<{
    label: string;
    url: string;
    icon?: string;
    verified?: boolean;
  }>;
}

// ============================================
// Post & Content Types
// ============================================

export interface PostContent {
  type: 'richtext' | 'markdown' | 'html' | 'tiptap';
  blocks: ContentBlock[];
  version: string;
  metadata?: {
    wordCount: number;
    readingTime: number;
    lastEditedAt: string;
    editHistory?: EditEntry[];
    language?: string;
    sentiment?: number;
  };
}

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'code' | 'image' | 'video' | 'embed' | 'table' | 'divider';
  content?: string;
  data?: Record<string, any>;
  children?: ContentBlock[];
  attributes?: Record<string, any>;
}

export interface EditEntry {
  timestamp: string;
  editorId: string;
  editorName: string;
  changeNote?: string;
  changes?: number;
}

export interface PostMetadata {
  seoScore?: number;
  readabilityScore?: number;
  keywords?: string[];
  internalLinks?: number;
  externalLinks?: number;
  images?: number;
  videos?: number;
}

export interface SponsorInfo {
  sponsorName: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  disclosureText: string;
  campaignId?: string;
  contractId?: string;
  compensation?: {
    type: 'paid' | 'product' | 'affiliate';
    amount?: number;
    currency?: string;
  };
}

// ============================================
// YouTube & Video Types
// ============================================

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    standard?: string;
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
    dislikeCount?: string;
    commentCount: string;
    favoriteCount?: string;
  };
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent?: boolean;
    projection?: string;
  };
  status?: {
    uploadStatus: string;
    privacyStatus: string;
    license: string;
    embeddable: boolean;
    publicStatsViewable: boolean;
  };
}

// ============================================
// Group & Community Types
// ============================================

export interface GroupSettings {
  autoApproveMembers: boolean;
  requirePostApproval: boolean;
  allowGuestViewing: boolean;
  memberCanInvite: boolean;
  customRoles?: Array<{
    id: string;
    name: string;
    permissions: string[];
    color?: string;
    icon?: string;
  }>;
  welcomeMessage?: string;
  rules?: string;
  guidelines?: string;
  features: {
    events: boolean;
    polls: boolean;
    marketplace: boolean;
    achievements: boolean;
    chat: boolean;
    wiki: boolean;
  };
  moderation: {
    autoModEnabled: boolean;
    spamFilter: boolean;
    profanityFilter: boolean;
    linkApproval: boolean;
  };
}

export interface GroupGuidelines {
  version: string;
  sections: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  lastUpdated: string;
  acceptanceRequired: boolean;
}

export interface GroupMetadata {
  stats?: {
    postsToday: number;
    postsThisWeek: number;
    postsThisMonth: number;
    activeMembers: number;
  };
  featured?: boolean;
  verified?: boolean;
  badges?: string[];
}

export interface CustomEmojis {
  emojis: Array<{
    id: string;
    name: string;
    url: string;
    category?: string;
    animated?: boolean;
    createdBy?: string;
    createdAt?: string;
  }>;
  categories?: string[];
}

// ============================================
// Event Types
// ============================================

export interface EventAgenda {
  sessions: Array<{
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    speakers?: string[];
    location?: string;
    type: 'keynote' | 'workshop' | 'networking' | 'break' | 'panel' | 'qa' | 'social' | 'other';
    materials?: Array<{
      name: string;
      url: string;
      type: string;
    }>;
    recording?: string;
  }>;
  tracks?: Array<{
    id: string;
    name: string;
    color: string;
    description?: string;
  }>;
}

export interface EventSpeakers {
  speakers: Array<{
    id: string;
    name: string;
    title?: string;
    company?: string;
    bio?: string;
    photo?: string;
    socialLinks?: Record<string, string>;
    sessions?: string[];
  }>;
}

export interface EventSponsors {
  tiers: Array<{
    name: string;
    level: number;
    sponsors: Array<{
      name: string;
      logo: string;
      url?: string;
      description?: string;
    }>;
  }>;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  placeId?: string;
}

export interface EventRecurrence {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  count?: number;
  until?: string;
  exceptions?: string[];
}

export interface EventMaterials {
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  videos?: Array<{
    title: string;
    url: string;
    duration?: number;
  }>;
  links?: Array<{
    label: string;
    url: string;
  }>;
}

export interface EventFeedback {
  overall?: number;
  aspects?: Record<string, number>;
  comments?: Array<{
    userId: string;
    comment: string;
    rating: number;
    timestamp: string;
  }>;
}

// ============================================
// Trading & Economy Types
// ============================================

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

export interface StoreItemData {
  attributes?: Record<string, any>;
  stats?: Record<string, number>;
  effects?: Array<{
    type: string;
    value: number;
    duration?: number;
  }>;
  visuals?: {
    model?: string;
    texture?: string;
    animation?: string;
  };
}

export interface StoreItemRequirements {
  level?: number;
  achievements?: string[];
  items?: string[];
  reputation?: number;
  subscription?: string;
}

// ============================================
// Quest & Achievement Types
// ============================================

export interface QuestRequirements {
  type: 'simple' | 'sequential' | 'parallel' | 'choice' | 'conditional';
  tasks: Array<{
    id: string;
    type: string;
    description: string;
    target: number;
    current?: number;
    completed?: boolean;
    data?: Record<string, any>;
  }>;
  prerequisites?: string[];
  timeLimit?: number; // in minutes
  conditions?: Array<{
    type: string;
    value: any;
  }>;
}

export interface QuestRewards {
  xp: number;
  sparklePoints?: number;
  premiumPoints?: number;
  items?: string[];
  achievements?: string[];
  badges?: string[];
  titles?: string[];
  unlocks?: string[];
}

export interface QuestProgress {
  tasksCompleted: number;
  totalTasks: number;
  percentComplete: number;
  taskProgress: Record<string, {
    current: number;
    target: number;
    completed: boolean;
  }>;
  startTime: string;
  lastUpdateTime: string;
}

export interface QuestMetadata {
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'legendary';
  estimatedTime?: number;
  repeatableAfter?: number;
  storyline?: string;
  lore?: string;
}

export interface UserQuestMetadata {
  attempts?: number;
  bestTime?: number;
  lastAttempt?: string;
  favorited?: boolean;
}

export interface AchievementCriteria {
  type: string;
  target: number;
  counter?: string;
  conditions?: Record<string, any>;
}

// ============================================
// Message & Chat Types
// ============================================

export interface MessageAttachments {
  files?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  images?: Array<{
    url: string;
    thumbnail?: string;
    width?: number;
    height?: number;
  }>;
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
  }>;
}

export interface MessageReactions {
  reactions: Record<string, {
    count: number;
    users: string[];
  }>;
  totalCount: number;
}

export interface EditHistory {
  timestamp: string;
  content: string;
  editedBy?: string;
}

export interface MessageMetadata {
  forwarded?: boolean;
  forwardCount?: number;
  important?: boolean;
  pinned?: boolean;
  expiresAt?: string;
}

export interface ConversationSettings {
  theme?: string;
  emoji?: string;
  nickname?: Record<string, string>;
  muteUntil?: Record<string, string>;
  slowMode?: number;
  autoDelete?: number;
}

export interface ChatReactions {
  [emoji: string]: string[]; // emoji -> user IDs
}

export interface ChatAttachments {
  type: 'image' | 'video' | 'file' | 'audio' | 'location' | 'contact';
  url?: string;
  data?: any;
}

// ============================================
// AI & Intelligence Types
// ============================================

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
  model?: string;
}

export interface AiContext {
  sessionId: string;
  userId: string;
  preferences?: Record<string, any>;
  history?: string[];
  metadata?: Record<string, any>;
}

export interface AiContentPreferences {
  topics: string[];
  contentTypes: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
}

export interface WritingStyle {
  tone: string;
  formality: number; // 0-1
  complexity: number; // 0-1
  creativity: number; // 0-1
  examples?: string[];
}

export interface AiModerationCategories {
  toxic: number;
  severeToxic: number;
  obscene: number;
  threat: number;
  insult: number;
  identityHate: number;
  spam: number;
  nsfw?: number;
  violence?: number;
  custom?: Record<string, number>;
}

export interface AiReasons {
  primary: string;
  secondary?: string[];
  confidence: number;
  explanation?: string;
}

// ============================================
// Media Types
// ============================================

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
}

export interface MediaMetadata {
  exif?: Record<string, any>;
  duration?: number;
  bitrate?: number;
  codec?: string;
  framerate?: number;
  channels?: number;
  sampleRate?: number;
}

export interface ArtDimensions {
  width: number;
  height: number;
  dpi?: number;
  colorSpace?: string;
}

// ============================================
// Analytics & Monitoring Types
// ============================================

export interface EventProperties {
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  custom?: Record<string, any>;
}

export interface EventContext {
  page?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  device?: {
    type: string;
    brand?: string;
    model?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface AuditMetadata {
  reason?: string;
  automated?: boolean;
  triggeredBy?: string;
  relatedEntities?: Array<{
    type: string;
    id: string;
  }>;
}

// ============================================
// Poll & Voting Types
// ============================================

export interface PollResults {
  totalVotes: number;
  options: Array<{
    id: string;
    votes: number;
    percentage: number;
    voters?: string[];
  }>;
  demographics?: Record<string, any>;
  timestamp: string;
}

export interface PollOptionMetadata {
  color?: string;
  icon?: string;
  order?: number;
}

export interface PollVoteMetadata {
  source?: string;
  device?: string;
  location?: string;
}

// ============================================
// Experiment & Feature Flag Types
// ============================================

export interface ExperimentVariants {
  control: any;
  variants: Array<{
    name: string;
    config: any;
    percentage: number;
  }>;
}

export interface ExperimentMetrics {
  primary: string;
  secondary?: string[];
  goals?: Record<string, any>;
}

export interface TargetingRules {
  include?: Array<{
    type: string;
    values: any[];
  }>;
  exclude?: Array<{
    type: string;
    values: any[];
  }>;
}

export interface ExperimentResults {
  winner?: string;
  confidence?: number;
  metrics?: Record<string, any>;
  analysis?: string;
}

export interface FeatureFlagConditions {
  rules: Array<{
    type: string;
    operator: string;
    value: any;
  }>;
  logic?: 'AND' | 'OR';
}

export interface FeatureFlagMetadata {
  owner?: string;
  jiraTicket?: string;
  description?: string;
  risks?: string[];
}

// ============================================
// Validation & System Types
// ============================================

export interface ValidationRules {
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

// ============================================
// Type Mapping Export
// ============================================

export const JSON_FIELD_TYPES = {
  "Profile.themePreference": "ThemePreference",
  "Profile.notificationSettings": "NotificationSettings",
  "Profile.privacySettings": "PrivacySettings",
  "Profile.socialLinks": "SocialLinks",
  "Profile.youtubeChannelData": "YouTubeVideoData",
  "Post.content": "PostContent",
  "Post.youtubeVideoData": "YouTubeVideoData",
  "Post.sponsorInfo": "SponsorInfo",
  "Post.metadata": "PostMetadata",
  "Group.settings": "GroupSettings",
  "Group.guidelines": "GroupGuidelines",
  "Group.customEmojis": "CustomEmojis",
  "Group.metadata": "GroupMetadata",
  "Event.agenda": "EventAgenda",
  "Event.speakers": "EventSpeakers",
  "Event.sponsors": "EventSponsors",
  "Event.locationCoords": "LocationCoordinates",
  "Event.recurrence": "EventRecurrence",
  "Event.materials": "EventMaterials",
  "Event.feedback": "EventFeedback",
  "Trade.initiatorItems": "TradeItems",
  "Trade.recipientItems": "TradeItems",
  "Quest.requirements": "QuestRequirements",
  "Quest.rewards": "QuestRewards",
  "Quest.metadata": "QuestMetadata",
  "UserQuest.progress": "QuestProgress",
  "UserQuest.metadata": "UserQuestMetadata",
  "Message.attachments": "MessageAttachments",
  "Message.reactions": "MessageReactions",
  "Message.editHistory": "EditHistory[]",
  "Message.metadata": "MessageMetadata",
  "Conversation.settings": "ConversationSettings",
  "AiAssistantConversation.messages": "AiMessage[]",
  "AiAssistantConversation.context": "AiContext",
  "UserAiPreference.contentPreferences": "AiContentPreferences",
  "UserAiPreference.writingStyle": "WritingStyle",
  "AiModerationQueue.aiCategories": "AiModerationCategories",
  "AiModerationQueue.aiReasons": "AiReasons",
  "MediaFile.dimensions": "MediaDimensions",
  "MediaFile.metadata": "MediaMetadata",
  "FanArtSubmission.dimensions": "ArtDimensions",
  "AnalyticsEvent.properties": "EventProperties",
  "AnalyticsEvent.context": "EventContext",
  "ChatMessage.reactions": "ChatReactions",
  "ChatMessage.attachments": "ChatAttachments",
  "ChatRoom.customEmojis": "CustomEmojis",
  "Poll.finalResults": "PollResults",
  "PollOption.metadata": "PollOptionMetadata",
  "PollVote.metadata": "PollVoteMetadata",
  "Experiment.variants": "ExperimentVariants",
  "Experiment.metrics": "ExperimentMetrics",
  "Experiment.targetingRules": "TargetingRules",
  "Experiment.results": "ExperimentResults",
  "FeatureFlag.conditions": "FeatureFlagConditions",
  "FeatureFlag.metadata": "FeatureFlagMetadata",
  "SiteSetting.value": "any",
  "SiteSetting.validation": "ValidationRules",
  "AuditLog.entityData": "Record<string, any>",
  "AuditLog.changedData": "Record<string, any>",
  "AuditLog.metadata": "AuditMetadata",
  "Category.metadata": "Record<string, any>",
  "Achievement.criteria": "AchievementCriteria",
  "Achievement.metadata": "Record<string, any>",
  "StoreItem.data": "StoreItemData",
  "StoreItem.requirements": "StoreItemRequirements"
} as const;

// Type guard helpers for runtime checking
export function isThemePreference(obj: any): obj is ThemePreference {
  return obj && typeof obj === 'object' && 'mode' in obj && 'primaryColor' in obj;
}

export function isPostContent(obj: any): obj is PostContent {
  return obj && typeof obj === 'object' && 'type' in obj && 'blocks' in obj && Array.isArray(obj.blocks);
}

export function isQuestRequirements(obj: any): obj is QuestRequirements {
  return obj && typeof obj === 'object' && 'type' in obj && 'tasks' in obj && Array.isArray(obj.tasks);
}
