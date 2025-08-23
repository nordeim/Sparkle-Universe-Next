awesome job! please use the same rigorous and meticulous approach to deeply think and thoroughly explore the following generated types files. please put on your deep-thinking hat to carefully and meticulous review and analyze the generated types files and compare them against the project documents shared earlier.

# generated file: src/types/generated/enums.ts
```ts
// Prisma Enum Types
// Generated on 2025-08-23T09:12:06.746Z

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  CREATOR = 'CREATOR',
  VERIFIED_CREATOR = 'VERIFIED_CREATOR',
  SYSTEM = 'SYSTEM',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
  DELETED = 'DELETED',
}

export enum NotificationType {
  POST_LIKED = 'POST_LIKED',
  POST_COMMENTED = 'POST_COMMENTED',
  COMMENT_LIKED = 'COMMENT_LIKED',
  USER_FOLLOWED = 'USER_FOLLOWED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  LEVEL_UP = 'LEVEL_UP',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
  GROUP_INVITE = 'GROUP_INVITE',
  GROUP_POST = 'GROUP_POST',
  EVENT_REMINDER = 'EVENT_REMINDER',
  WATCH_PARTY_INVITE = 'WATCH_PARTY_INVITE',
  DIRECT_MESSAGE = 'DIRECT_MESSAGE',
  YOUTUBE_PREMIERE = 'YOUTUBE_PREMIERE',
  QUEST_COMPLETE = 'QUEST_COMPLETE',
  TRADE_REQUEST = 'TRADE_REQUEST',
  CONTENT_FEATURED = 'CONTENT_FEATURED',
  MILESTONE_REACHED = 'MILESTONE_REACHED',
}

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  FIRE = 'FIRE',
  SPARKLE = 'SPARKLE',
  MIND_BLOWN = 'MIND_BLOWN',
  LAUGH = 'LAUGH',
  CRY = 'CRY',
  ANGRY = 'ANGRY',
  CUSTOM = 'CUSTOM',
}

export enum ReportReason {
  SPAM = 'SPAM',
  INAPPROPRIATE = 'INAPPROPRIATE',
  HARASSMENT = 'HARASSMENT',
  MISINFORMATION = 'MISINFORMATION',
  COPYRIGHT = 'COPYRIGHT',
  NSFW = 'NSFW',
  HATE_SPEECH = 'HATE_SPEECH',
  SELF_HARM = 'SELF_HARM',
  OTHER = 'OTHER',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
  AUTO_APPROVED = 'AUTO_APPROVED',
  SHADOW_BANNED = 'SHADOW_BANNED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export enum ContentType {
  BLOG = 'BLOG',
  LIVE_BLOG = 'LIVE_BLOG',
  POLL = 'POLL',
  VIDEO_REVIEW = 'VIDEO_REVIEW',
  FAN_ART = 'FAN_ART',
  THEORY_THREAD = 'THEORY_THREAD',
  SERIES = 'SERIES',
  TUTORIAL = 'TUTORIAL',
  NEWS = 'NEWS',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  LIMITED_EDITION = 'LIMITED_EDITION',
  SEASONAL = 'SEASONAL',
}

export enum QuestType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SPECIAL = 'SPECIAL',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SEASONAL = 'SEASONAL',
  COMMUNITY = 'COMMUNITY',
  CREATOR = 'CREATOR',
}

export enum QuestStatus {
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  LOCKED = 'LOCKED',
}

export enum TradeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  DELETED = 'DELETED',
}

export enum EventType {
  WATCH_PARTY = 'WATCH_PARTY',
  COMMUNITY_MEETUP = 'COMMUNITY_MEETUP',
  CONTEST = 'CONTEST',
  PREMIERE = 'PREMIERE',
  AMA = 'AMA',
  SPECIAL = 'SPECIAL',
  TOURNAMENT = 'TOURNAMENT',
  WORKSHOP = 'WORKSHOP',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export enum GroupVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
  HIDDEN = 'HIDDEN',
}

export enum GroupMemberRole {
  MEMBER = 'MEMBER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export enum CacheType {
  USER_PROFILE = 'USER_PROFILE',
  POST_CONTENT = 'POST_CONTENT',
  FEED = 'FEED',
  TRENDING = 'TRENDING',
  LEADERBOARD = 'LEADERBOARD',
  STATS = 'STATS',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  MODERATION_ACTION = 'MODERATION_ACTION',
  SYSTEM_ACTION = 'SYSTEM_ACTION',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  SPARKLE_FAN = 'SPARKLE_FAN',
  SPARKLE_CREATOR = 'SPARKLE_CREATOR',
  SPARKLE_LEGEND = 'SPARKLE_LEGEND',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
  TWITTER = 'TWITTER',
  DISCORD = 'DISCORD',
}
```

# generated file: src/types/generated/models.ts
```ts
// Prisma Model Types
// Generated on 2025-08-23T09:12:06.753Z

import { Decimal } from 'decimal.js'

export interface User {
  id: string;
  email: string;
  username: string;
  hashedPassword: string;
  authProvider: AuthProvider;
  emailVerified?: Date | null;
  phoneNumber?: string | null;
  phoneNumberHash?: string | null;
  phoneVerified?: Date | null;
  image?: string | null;
  bio?: string | null;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  verifiedAt?: Date | null;
  banned: boolean;
  banReason?: string | null;
  banExpiresAt?: Date | null;
  experience: number;
  level: number;
  sparklePoints: number;
  premiumPoints: number;
  reputationScore: number;
  lastSeenAt?: Date | null;
  onlineStatus: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  twoFactorBackupCodes: string[];
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  accountLockoutAttempts: number;
  accountLockedUntil?: Date | null;
  lastPasswordChangedAt?: Date | null;
  lastFailedLoginAt?: Date | null;
  failedLoginAttempts: number;
  preferredLanguage: string;
  timezone: string;
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorRevenueShare: Decimal;
  totalRevenueEarned: bigint;
  lastPayoutDate?: Date | null;
  accounts: Account[];
  sessions: Session[];
  profile?: Profile?;
  stats?: UserStats?;
  balance?: UserBalance?;
  subscription?: UserSubscription?;
  posts: Post[];
  comments: Comment[];
  reactions: Reaction[];
  following: Follow[];
  followers: Follow[];
  blockedUsers: Block[];
  blockedBy: Block[];
  achievements: UserAchievement[];
  notifications: Notification[];
  notificationsSent: Notification[];
  notificationPrefs?: NotificationPreference?;
  xpLogs: XpLog[];
  currencyTransactions: CurrencyTransaction[];
  inventory: UserInventory[];
  tradesInitiated: Trade[];
  tradesReceived: Trade[];
  questProgress: UserQuest[];
  youtubeChannels: YoutubeChannel[];
  hostedWatchParties: WatchParty[];
  watchPartyParticipants: WatchPartyParticipant[];
  videoClips: VideoClip[];
  playlists: Playlist[];
  playlistItems: PlaylistItem[];
  groupsOwned: Group[];
  groupMemberships: GroupMember[];
  eventsHosted: Event[];
  eventAttendances: EventAttendee[];
  conversationsCreated: Conversation[];
  conversationParticipants: ConversationParticipant[];
  messages: Message[];
  messageReads: MessageRead[];
  websocketSessions: WebsocketSession[];
  chatRoomsCreated: ChatRoom[];
  chatMessages: ChatMessage[];
  collaborativeSpacesOwned: CollaborativeSpace[];
  spaceCollaborations: SpaceCollaborator[];
  activityStreams: ActivityStream[];
  fanArtSubmissions: FanArtSubmission[];
  mediaFiles: MediaFile[];
  experimentAssignments: ExperimentAssignment[];
  moderationReviews: AiModerationQueue[];
  reports: Report[];
  reportedReports: Report[];
  reportResolutions: Report[];
  siteSettingUpdates: SiteSetting[];
  postSeries: PostSeries[];
  auditLogs: AuditLog[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  contentRevisions: PostRevision[];
  searchHistory: SearchHistory[];
  viewHistory: ViewHistory[];
  loginHistory: LoginHistory[];
  securityAlerts: SecurityAlert[];
  referralCodeUsed?: Referral?;
  referralsMade: Referral[];
  pollVotes: PollVote[];
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  watchPartyChatMessages: WatchPartyChat[];
  groupPosts: GroupPost[];
  analyticsEvents: AnalyticsEvent[];
  mentionsMade: Mention[];
  mentionsReceived: Mention[];
  aiRecommendations: AiRecommendation[];
  aiContentSuggestions: AiContentSuggestion[];
  aiPreference?: UserAiPreference?;
  aiAssistantConversations: AiAssistantConversation[];
  payouts: CreatorPayout[];
  sentFanFunding: FanFunding[];
  receivedFanFunding: FanFunding[];
  revenueShares: RevenueShare[];
  sentTips: TipTransaction[];
  receivedTips: TipTransaction[];
  createdEmailCampaigns: EmailCampaign[];
  newsletterSubscription?: NewsletterSubscription?;
  createdEmailTemplates: EmailTemplate[];
  recurringSchedules: RecurringSchedule[];
}

export interface UserStats {
  id: string;
  userId: string;
  totalPosts: number;
  totalComments: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  totalViews: number;
  totalFollowers: number;
  totalFollowing: number;
  totalWatchTime: bigint;
  streakDays: number;
  longestStreak: number;
  lastActivityAt?: Date | null;
  profileViews: number;
  engagementRate: number;
  contentQualityScore: number;
  updatedAt: Date;
  user: User;
}

export interface UserBalance {
  id: string;
  userId: string;
  sparklePoints: number;
  premiumPoints: number;
  frozenPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  version: number;
  lastTransactionAt?: Date | null;
  updatedAt: Date;
  user: User;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: PaymentStatus;
  startDate: Date;
  endDate?: Date | null;
  cancelledAt?: Date | null;
  paymentMethod?: string | null;
  stripeCustomerId?: string | null;
  stripeSubId?: string | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Profile {
  id: string;
  userId: string;
  displayName?: string | null;
  location?: string | null;
  website?: string | null;
  twitterUsername?: string | null;
  instagramUsername?: string | null;
  tiktokUsername?: string | null;
  discordUsername?: string | null;
  youtubeChannelId?: string | null;
  youtubeChannelUrl?: string | null;
  youtubeChannelData?: any | null;
  bannerImage?: string | null;
  themePreference?: any | null;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken?: string | null;
  accessToken?: string | null;
  expiresAt?: bigint | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
  sessionState?: string | null;
  oauthTokenSecret?: string | null;
  oauthToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string | null;
  success: boolean;
  reason?: string | null;
  createdAt: Date;
  user: User;
}

export interface SecurityAlert {
  id: string;
  userId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  resolved: boolean;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  revokedAt?: Date | null;
  user: User;
}

export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  failureCount: number;
  lastTriggered?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  blocker: User;
  blocked: User;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailDigestFrequency: string;
  pushEnabled: boolean;
  postLikes: boolean;
  postComments: boolean;
  newFollowers: boolean;
  mentions: boolean;
  directMessages: boolean;
  groupInvites: boolean;
  eventReminders: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string | null;
  referralCode: string;
  referredEmail?: string | null;
  status: string;
  rewardClaimed: boolean;
  rewardAmount: number;
  expiresAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  referrer: User;
  referredUser?: User?;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null;
  postCount: number;
  displayOrder: number;
  isActive: boolean;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category?;
  children: Category[];
  posts: Post[];
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: any;
  contentType: ContentType;
  contentStatus: ContentStatus;
  excerpt?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  categoryId?: string | null;
  seriesId?: string | null;
  seriesOrder?: number | null;
  published: boolean;
  featured: boolean;
  editorsPick: boolean;
  sponsoredContent: boolean;
  sponsorInfo?: any | null;
  isPinned: boolean;
  pinnedUntil?: Date | null;
  isDraft: boolean;
  version: number;
  parentVersionId?: string | null;
  collaborators: string[];
  youtubeVideoId?: string | null;
  youtubeVideoData?: any | null;
  views: number;
  uniqueViews: number;
  readingTime?: number | null;
  wordCount?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords: string[];
  ogImage?: string | null;
  canonicalUrl?: string | null;
  customSlug: boolean;
  allowComments: boolean;
  moderationStatus: ModerationStatus;
  moderationNotes?: string | null;
  scheduledPublishAt?: Date | null;
  publishedAt?: Date | null;
  lastEditedAt?: Date | null;
  archivedAt?: Date | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  aiGenerated: boolean;
  aiModel?: string | null;
  aiPrompt?: string | null;
  aiRevisionCount: number;
  author?: User?;
  category?: Category?;
  series?: PostSeries?;
  parentVersion?: Post?;
  childVersions: Post[];
  tags: PostTag[];
  comments: Comment[];
  reactions: Reaction[];
  poll?: Poll?;
  fanArtGallery?: FanArtGallery?;
  stats?: PostStats?;
  revisions: PostRevision[];
  viewHistory: ViewHistory[];
  relatedPosts: PostRelation[];
  relatedTo: PostRelation[];
  mentions: Mention[];
  bookmarks: Bookmark[];
  reports: Report[];
  aiModerationEntries: AiModerationQueue[];
  publishQueueEntry?: PublishQueue?;
}

export interface ScheduledAction {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  scheduledFor: Date;
  status: string;
  parameters: any;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: Date | null;
  nextRetry?: Date | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringSchedule {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  recurrenceRule: string;
  startDate: Date;
  endDate?: Date | null;
  lastRun?: Date | null;
  nextRun: Date;
  parameters: any;
  isActive: boolean;
  createdAt: Date;
  user: User;
}

export interface PublishQueue {
  id: string;
  postId: string;
  scheduledFor: Date;
  status: string;
  attempts: number;
  error?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
  post: Post;
}

export interface PostStats {
  id: string;
  postId: string;
  viewCount: number;
  uniqueViewCount: number;
  likeCount: number;
  loveCount: number;
  fireCount: number;
  totalReactionCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount: number;
  avgReadTime: number;
  bounceRate: number;
  engagementRate: number;
  lastCalculatedAt: Date;
  updatedAt: Date;
  post: Post;
}

export interface PostRevision {
  id: string;
  postId: string;
  editorId: string;
  title: string;
  content: any;
  changeNote?: string | null;
  version: number;
  isPublished: boolean;
  createdAt: Date;
  post: Post;
  editor: User;
}

export interface PostRelation {
  id: string;
  postId: string;
  relatedPostId: string;
  relationType: string;
  sortOrder: number;
  createdAt: Date;
  post: Post;
  relatedPost: Post;
}

export interface PostSeries {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  coverImage?: string | null;
  bannerImage?: string | null;
  totalParts: number;
  completed: boolean;
  featured: boolean;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: User?;
  posts: Post[];
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  postCount: number;
  featured: boolean;
  category?: string | null;
  synonyms: string[];
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  posts: PostTag[];
}

export interface PostTag {
  postId: string;
  tagId: string;
  addedBy?: string | null;
  createdAt: Date;
  post: Post;
  tag: Tag;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId?: string | null;
  authorName?: string | null;
  parentId?: string | null;
  youtubeTimestamp?: number | null;
  quotedTimestamp?: string | null;
  edited: boolean;
  editedAt?: Date | null;
  editHistory: any[];
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  pinned: boolean;
  featured: boolean;
  moderationStatus: ModerationStatus;
  moderationNotes?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  post: Post;
  author?: User?;
  parent?: Comment?;
  replies: Comment[];
  reactions: Reaction[];
  mentions: Mention[];
  reports: Report[];
}

export interface Reaction {
  id: string;
  type: ReactionType;
  postId?: string | null;
  commentId?: string | null;
  userId: string;
  customEmoji?: string | null;
  metadata?: any | null;
  createdAt: Date;
  post?: Post?;
  comment?: Comment?;
  user: User;
}

export interface Mention {
  id: string;
  mentionerId: string;
  mentionedId: string;
  postId?: string | null;
  commentId?: string | null;
  context?: string | null;
  acknowledged: boolean;
  createdAt: Date;
  mentioner: User;
  mentioned: User;
  post?: Post?;
  comment?: Comment?;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  folderId?: string | null;
  notes?: string | null;
  tags: string[];
  createdAt: Date;
  user: User;
  post: Post;
  folder?: BookmarkFolder?;
}

export interface BookmarkFolder {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isPublic: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  bookmarks: Bookmark[];
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  notifyNewPosts: boolean;
  notifyActivity: boolean;
  createdAt: Date;
  updatedAt: Date;
  follower: User;
  following: User;
}

export interface ViewHistory {
  id: string;
  userId: string;
  postId: string;
  viewDuration: number;
  scrollDepth: number;
  referrer?: string | null;
  deviceType?: string | null;
  createdAt: Date;
  user: User;
  post: Post;
}

export interface SearchHistory {
  id: string;
  userId?: string | null;
  query: string;
  resultCount: number;
  clickedResults: string[];
  searchType?: string | null;
  deviceType?: string | null;
  createdAt: Date;
  user?: User?;
}

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  actorId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  title: string;
  message: string;
  data?: any | null;
  imageUrl?: string | null;
  actionUrl?: string | null;
  priority: number;
  read: boolean;
  readAt?: Date | null;
  clicked: boolean;
  clickedAt?: Date | null;
  emailSent: boolean;
  pushSent: boolean;
  smsSent: boolean;
  dismissed: boolean;
  dismissedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  actor?: User?;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  type: string;
  channel: string;
  payload: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  processedAt?: Date | null;
  failedAt?: Date | null;
  error?: string | null;
  createdAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  segment: string;
  status: string;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  totalRecipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  content: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
  template: EmailTemplate;
  sendQueue: EmailSendQueue[];
}

export interface NewsletterSubscription {
  id: string;
  userId: string;
  subscribed: boolean;
  frequency: string;
  topics: string[];
  lastSent?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string | null;
  variables: string[];
  category: string;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
  campaigns: EmailCampaign[];
  sendQueue: EmailSendQueue[];
}

export interface EmailSendQueue {
  id: string;
  campaignId?: string | null;
  recipient: string;
  templateId: string;
  variables: any;
  status: string;
  attempts: number;
  sentAt?: Date | null;
  failedAt?: Date | null;
  error?: string | null;
  createdAt: Date;
  campaign?: EmailCampaign?;
  template: EmailTemplate;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  icon?: string | null;
  animatedIcon?: string | null;
  bannerImage?: string | null;
  xpReward: number;
  sparklePointsReward: number;
  premiumPointsReward: number;
  rarity: BadgeRarity;
  category?: string | null;
  subcategory?: string | null;
  criteria?: any | null;
  progressSteps: number;
  isSecret: boolean;
  prerequisiteIds: string[];
  displayOrder: number;
  seasonal: boolean;
  eventBased: boolean;
  limited: boolean;
  maxAchievers?: number | null;
  expiresAt?: Date | null;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userAchievements: UserAchievement[];
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  progressData?: any | null;
  unlockedAt: Date;
  showcased: boolean;
  showcaseOrder: number;
  notified: boolean;
  claimedRewards: boolean;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  user: User;
  achievement: Achievement;
}

export interface XpLog {
  id: string;
  userId: string;
  amount: number;
  source: string;
  sourceId?: string | null;
  reason?: string | null;
  multiplier: number;
  bonusXp: number;
  totalXp: number;
  metadata?: any | null;
  createdAt: Date;
  user: User;
}

export interface LevelConfig {
  level: number;
  requiredXp: number;
  title: string;
  perks: string[];
  sparkleReward: number;
  premiumReward: number;
  unlockFeatures: string[];
  badgeId?: string | null;
  createdAt: Date;
}

export interface CurrencyTransaction {
  id: string;
  userId: string;
  amount: number;
  currencyType: string;
  transactionType: string;
  source: string;
  sourceId?: string | null;
  description?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: any | null;
  createdAt: Date;
  user: User;
}

export interface CreatorPayout {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: Decimal;
  platformFee: Decimal;
  creatorShare: Decimal;
  taxWithheld: Decimal;
  finalAmount: Decimal;
  payoutMethod: string;
  payoutStatus: string;
  transactionId?: string | null;
  failureReason?: string | null;
  scheduledDate: Date;
  processedDate?: Date | null;
  createdAt: Date;
  user: User;
}

export interface FanFunding {
  id: string;
  senderId: string;
  recipientId: string;
  amount: Decimal;
  currency: string;
  message?: string | null;
  isAnonymous: boolean;
  platformFee: Decimal;
  creatorAmount: Decimal;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string | null;
  failureReason?: string | null;
  createdAt: Date;
  sender: User;
  recipient: User;
}

export interface RevenueShare {
  id: string;
  contentType: string;
  contentId: string;
  creatorId: string;
  totalRevenue: Decimal;
  platformShare: Decimal;
  creatorShare: Decimal;
  affiliateShare: Decimal;
  calculatedAt: Date;
  paidAt?: Date | null;
  creator: User;
}

export interface TipTransaction {
  id: string;
  senderId: string;
  recipientId: string;
  amount: Decimal;
  currency: string;
  message?: string | null;
  contentType?: string | null;
  contentId?: string | null;
  isAnonymous: boolean;
  createdAt: Date;
  sender: User;
  recipient: User;
}

export interface StoreItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  category: string;
  subcategory?: string | null;
  itemType: string;
  rarity: BadgeRarity;
  priceSparkle?: Decimal | null;
  pricePremium?: Decimal | null;
  originalPriceSparkle?: Decimal | null;
  originalPricePremium?: Decimal | null;
  discountPercentage: number;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  images: string[];
  data?: any | null;
  requirements?: any | null;
  limitedEdition: boolean;
  stockRemaining?: number | null;
  maxPerUser?: number | null;
  featured: boolean;
  new: boolean;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
  inventory: UserInventory[];
  bundles: StoreBundle[];
}

export interface StoreBundle {
  id: string;
  name: string;
  description?: string | null;
  priceSparkle?: Decimal | null;
  pricePremium?: Decimal | null;
  discountPercentage: number;
  items: StoreItem[];
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  maxPurchases?: number | null;
  createdAt: Date;
}

export interface UserInventory {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  equippedAt?: Date | null;
  customData?: any | null;
  acquiredFrom: string;
  acquiredAt: Date;
  expiresAt?: Date | null;
  tradeable: boolean;
  giftedBy?: string | null;
  user: User;
  item: StoreItem;
}

export interface Trade {
  id: string;
  initiatorId: string;
  recipientId: string;
  status: TradeStatus;
}

export interface Quest {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  icon?: string | null;
  bannerImage?: string | null;
  type: QuestType;
  category?: string | null;
  difficulty?: string | null;
  requirements: any;
  rewards: any;
  xpReward: number;
  pointsReward: number;
  prerequisiteIds: string[];
  levelRequired: number;
  cooldownHours?: number | null;
  maxCompletions: number;
  timeLimit?: number | null;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
  userQuests: UserQuest[];
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
}

export interface Leaderboard {
  id: string;
  type: string;
  scope: string;
  scopeId?: string | null;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  data: any;
  metadata?: any | null;
  processed: boolean;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  type: string;
  period: string;
  rank: number;
  score: bigint;
  movement: number;
  metadata?: any | null;
  createdAt: Date;
}

export interface YoutubeChannel {
  id: string;
  channelId: string;
  userId?: string | null;
  channelTitle?: string | null;
  channelHandle?: string | null;
  channelDescription?: string | null;
  channelData?: any | null;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  subscriberCount: bigint;
  viewCount: bigint;
  videoCount: number;
  lastVideoId?: string | null;
  lastVideoTitle?: string | null;
  lastVideoPublishedAt?: Date | null;
  lastSyncedAt?: Date | null;
  syncEnabled: boolean;
  featured: boolean;
  verified: boolean;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User?;
  videos: YoutubeVideo[];
}

export interface YoutubeVideo {
  id: string;
  videoId: string;
  channelId: string;
  youtubeChannelId?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlHd?: string | null;
  duration?: number | null;
  durationFormatted?: string | null;
  viewCount: bigint;
  likeCount: number;
  commentCount: number;
  tags: string[];
  categoryId?: string | null;
  liveBroadcast: boolean;
  premiereDate?: Date | null;
  publishedAt?: Date | null;
  metadata?: any | null;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  channel?: YoutubeChannel?;
  watchParties: WatchParty[];
  clips: VideoClip[];
  analytics?: VideoAnalytics?;
}

export interface VideoAnalytics {
  id: string;
  videoId: string;
  watchTime: bigint;
  avgWatchTime: number;
  completionRate: number;
  engagementRate: number;
  clipCount: number;
  shareCount: number;
  discussionCount: number;
  sentimentScore?: number | null;
  topDiscussionTopics: string[];
  peakViewers: number;
  updatedAt: Date;
  video: YoutubeVideo;
}

export interface WatchParty {
  id: string;
  hostId: string;
  title: string;
  description?: string | null;
  youtubeVideoId?: string | null;
  youtubeVideoUrl?: string | null;
  scheduledStart: Date;
  actualStart?: Date | null;
  endedAt?: Date | null;
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  requiresApproval: boolean;
  chatEnabled: boolean;
  syncPlayback: boolean;
  allowGuestChat: boolean;
  recordChat: boolean;
  tags: string[];
  customEmotes?: any | null;
  partyCode?: string | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  host: User;
  video?: YoutubeVideo?;
  participants: WatchPartyParticipant[];
  chat: WatchPartyChat[];
}

export interface WatchPartyParticipant {
  id: string;
  partyId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  leftAt?: Date | null;
  isActive: boolean;
  playbackPosition: number;
  isMuted: boolean;
  isBanned: boolean;
  bannedAt?: Date | null;
  banReason?: string | null;
  messageCount: number;
  reactionCount: number;
  party: WatchParty;
  user: User;
}

export interface WatchPartyChat {
  id: string;
  partyId: string;
  userId: string;
  message: string;
  timestamp: number;
  replyToId?: string | null;
  reactions?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  party: WatchParty;
  user: User;
  replyTo?: WatchPartyChat?;
  replies: WatchPartyChat[];
}

export interface VideoClip {
  id: string;
  youtubeVideoId?: string | null;
  creatorId: string;
  title: string;
  description?: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  thumbnailUrl?: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  featured: boolean;
  metadata?: any | null;
  createdAt: Date;
  video?: YoutubeVideo?;
  creator: User;
}

export interface Playlist {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  ownerId: string;
  isCollaborative: boolean;
  collaboratorIds: string[];
  isPublic: boolean;
  coverImage?: string | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  followerCount: number;
  itemCount: number;
  totalDuration: number;
  featured: boolean;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
  owner: User;
  items: PlaylistItem[];
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  youtubeVideoId: string;
  addedBy: string;
  position: number;
  note?: string | null;
  customTitle?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  addedAt: Date;
  playlist: Playlist;
  user: User;
}

export interface YouTubeApiQuota {
  id: string;
  date: Date;
  unitsUsed: number;
  quotaLimit: number;
  readRequests: number;
  writeRequests: number;
  searchRequests: number;
  resetAt: Date;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  bannerImage?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  visibility: GroupVisibility;
  joinApproval: boolean;
  autoApproveMembers: boolean;
  allowGuestViewing: boolean;
  requirePostApproval: boolean;
  memberCount: number;
  postCount: number;
  onlineCount: number;
  rules?: string | null;
  guidelines?: any | null;
  tags: string[];
  categories: string[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  permissions: string[];
  joinedAt: Date;
  invitedBy?: string | null;
  approvedBy?: string | null;
  mutedUntil?: Date | null;
  bannedUntil?: Date | null;
  banReason?: string | null;
  contribution: number;
  lastActiveAt: Date;
  notifications: boolean;
  group: Group;
  user: User;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  title?: string | null;
  content: string;
  isPinned: boolean;
  isAnnouncement: boolean;
  allowComments: boolean;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  moderationStatus: ModerationStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  group: Group;
  author: User;
}

export interface GroupChannel {
  id: string;
  groupId: string;
  name: string;
  description?: string | null;
  type: string;
  position: number;
  permissions?: any | null;
  createdAt: Date;
  group: Group;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  type: EventType;
  status: EventStatus;
  hostId?: string | null;
  hostName?: string | null;
  cohostIds: string[];
  groupId?: string | null;
  locationName?: string | null;
  locationUrl?: string | null;
  locationAddress?: string | null;
}

export interface EventAttendee {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  role: string;
  approved: boolean;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  checkInTime?: Date | null;
  checkInMethod?: string | null;
  attended: boolean;
  rating?: number | null;
  feedback?: string | null;
  certificateId?: string | null;
  notes?: string | null;
  remindersSent: boolean;
  createdAt: Date;
  event: Event;
  user: User;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  encryptedKey?: string | null;
  lastMessageId?: string | null;
  lastMessageAt?: Date | null;
  messageCount: number;
  createdBy: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  nickname?: string | null;
  role: string;
  joinedAt: Date;
  leftAt?: Date | null;
  isActive: boolean;
  lastReadAt?: Date | null;
  lastReadMessageId?: string | null;
  unreadCount: number;
  notificationsMuted: boolean;
  mutedUntil?: Date | null;
  isPinned: boolean;
  customSettings?: any | null;
  conversation: Conversation;
  user: User;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  encryptedContent?: string | null;
  messageType: string;
  attachments?: any | null;
  mentions: string[];
  replyToId?: string | null;
  forwardedFrom?: string | null;
}

export interface MessageRead {
  messageId: string;
  userId: string;
  readAt: Date;
  message: Message;
  user: User;
}

export interface WebsocketSession {
  id: string;
  userId: string;
  socketId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceType?: string | null;
  location?: string | null;
  connectedAt: Date;
  lastPingAt: Date;
  disconnectReason?: string | null;
  user: User;
}

export interface ChatRoom {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  topic?: string | null;
  tags: string[];
  isPublic: boolean;
  isModerated: boolean;
  isPersistent: boolean;
  maxUsers: number;
  activeUsers: number;
  totalMessages: number;
  slowMode: number;
  customEmojis?: any | null;
  rules?: string | null;
  welcomeMessage?: string | null;
  pinnedMessage?: string | null;
  blockedWords: string[];
  createdBy: string;
  moderatorIds: string[];
  expiresAt?: Date | null;
  lastActiveAt: Date;
  version: number;
  createdAt: Date;
  creator: User;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  mentions: string[];
  attachments?: any | null;
  replyToId?: string | null;
  systemMessage: boolean;
  highlighted: boolean;
}

export interface CollaborativeSpace {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  ownerId: string;
  content?: any | null;
  version: number;
  isPublic: boolean;
  isTemplate: boolean;
  allowAnonymous: boolean;
  maxCollaborators: number;
  activeUsers: number;
  editPermission: string;
  viewPermission: string;
  forkable: boolean;
  forkCount: number;
  parentId?: string | null;
  tags: string[];
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  owner: User;
  collaborators: SpaceCollaborator[];
}

export interface SpaceCollaborator {
  id: string;
  spaceId: string;
  userId: string;
  role: string;
  canEdit: boolean;
  canComment: boolean;
  canInvite: boolean;
  lastActiveAt: Date;
  joinedAt: Date;
  invitedBy?: string | null;
  space: CollaborativeSpace;
  user: User;
}

export interface PresenceTracking {
  id: string;
  userId: string;
  location: string;
  locationType: string;
  deviceId?: string | null;
  status: string;
  lastActiveAt: Date;
  metadata?: any | null;
}

export interface ActivityStream {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityData?: any | null;
  metadata?: any | null;
  visibility: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  user: User;
}

export interface UserActivity {
  id: string;
  userId: string;
  date: Date;
  loginCount: number;
  pageViews: number;
  postsCreated: number;
  postsViewed: number;
  commentsCreated: number;
  reactionsGiven: number;
  messagesSent: number;
  minutesActive: number;
  xpEarned: number;
  pointsEarned: number;
  achievementsUnlocked: number;
}

export interface ContentPerformance {
  id: string;
  contentType: string;
  contentId: string;
  date: Date;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  engagements: number;
  shares: number;
  avgTimeSpent: number;
  bounceRate: number;
  viralityScore: number;
}

export interface Poll {
  id: string;
  postId: string;
  question: string;
  multipleChoice: boolean;
  anonymousVoting: boolean;
  showResults: string;
  requireComment: boolean;
  minChoices: number;
  maxChoices: number;
  closeAt?: Date | null;
  finalResults?: any | null;
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  post: Post;
  options: PollOption[];
  votes: PollVote[];
}

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  voteCount: number;
  percentage: number;
  metadata?: any | null;
  poll: Poll;
  voteChoices: PollVoteChoice[];
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  comment?: string | null;
  ipAddress?: string | null;
  metadata?: any | null;
  createdAt: Date;
  poll: Poll;
  user: User;
  choices: PollVoteChoice[];
}

export interface PollVoteChoice {
  id: string;
  pollVoteId: string;
  pollOptionId: string;
  pollVote: PollVote;
  pollOption: PollOption;
}

export interface FanArtGallery {
  id: string;
  postId: string;
  theme?: string | null;
  rules?: string | null;
  prizes?: any | null;
  submissionDeadline?: Date | null;
  votingDeadline?: Date | null;
  votingEnabled: boolean;
  publicVoting: boolean;
  maxSubmissionsPerUser: number;
  requireApproval: boolean;
  allowNSFW: boolean;
  winnerCount: number;
  winnersAnnounced: boolean;
  metadata?: any | null;
  createdAt: Date;
  post: Post;
  submissions: FanArtSubmission[];
}

export interface FanArtSubmission {
  id: string;
  galleryId: string;
  artistId: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  thumbnailUrl?: string | null;
  highResUrl?: string | null;
  fileSize?: number | null;
}

export interface AiRecommendation {
  id: string;
  userId: string;
  recommendationType: string;
  entityType: string;
  entityId: string;
  score: number;
  reason?: string | null;
  context?: any | null;
  clicked: boolean;
  clickedAt?: Date | null;
  dismissed: boolean;
  expiresAt: Date;
  createdAt: Date;
  user: User;
}

export interface AiContentSuggestion {
  id: string;
  userId: string;
  suggestionType: string;
  content: string;
  context?: any | null;
  used: boolean;
  usedContent?: string | null;
  feedback?: number | null;
  createdAt: Date;
  user: User;
}

export interface UserAiPreference {
  id: string;
  userId: string;
  contentPreferences: any;
  writingStyle?: any | null;
  learningOptedOut: boolean;
  lastUpdated: Date;
  user: User;
}

export interface AiAssistantConversation {
  id: string;
  userId: string;
  sessionId: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string | null;
  reportedPostId?: string | null;
  reportedCommentId?: string | null;
  reason: ReportReason;
  subreason?: string | null;
  description?: string | null;
  evidence?: any | null;
  status: ModerationStatus;
  priority: number;
  assignedTo?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  resolution?: string | null;
  resolutionNote?: string | null;
  appealable: boolean;
  entityType: string;
  metadata?: any | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: User;
  reportedUser?: User?;
  resolver?: User?;
  post?: Post?;
  comment?: Comment?;
}

export interface AiModerationQueue {
  id: string;
  entityType: string;
  entityId: string;
  content?: string | null;
  contentHash?: string | null;
  aiProvider: string;
  aiScore?: number | null;
  aiCategories?: any | null;
  aiReasons?: any | null;
  confidence?: number | null;
  humanReviewRequired: boolean;
  autoActionTaken?: string | null;
  reviewPriority: number;
  reviewedBy?: string | null;
  reviewDecision?: string | null;
  reviewNotes?: string | null;
  falsePositive?: boolean | null;
  processingTime?: number | null;
  createdAt: Date;
  reviewedAt?: Date | null;
  reviewer?: User?;
  post?: Post?;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetUserId?: string | null;
  targetContentId?: string | null;
  targetType: string;
  action: string;
  duration?: number | null;
  reason: string;
  details?: string | null;
  evidence?: any | null;
  automated: boolean;
  reversedBy?: string | null;
  reversedAt?: Date | null;
  reverseReason?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface ContentFilter {
  id: string;
  filterType: string;
  pattern: string;
  action: string;
  severity: number;
  category?: string | null;
  isActive: boolean;
  hitCount: number;
  lastHitAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaFile {
  id: string;
  userId: string;
  fileType: string;
  fileSize: bigint;
  mimeType?: string | null;
  originalName?: string | null;
  storagePath: string;
  cdnUrl?: string | null;
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  duration?: number | null;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  hypothesis?: string | null;
  variants: any;
  control: string;
  metrics: any;
  targetingRules?: any | null;
  trafficPercentage: number;
  status: string;
  results?: any | null;
  winner?: string | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignments: ExperimentAssignment[];
}

export interface ExperimentAssignment {
  id: string;
  experimentId: string;
  userId: string;
  variant: string;
  converted: boolean;
  conversionData?: any | null;
  assignedAt: Date;
  convertedAt?: Date | null;
  experiment: Experiment;
  user: User;
}

export interface FeatureFlag {
  id: string;
  flag: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  enabledForUsers: string[];
  enabledForRoles: string[];
  conditions?: any | null;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSetting {
  key: string;
  value: any;
  type: string;
  category?: string | null;
  description?: string | null;
  isPublic: boolean;
  isEditable: boolean;
  validation?: any | null;
  updatedBy?: string | null;
  updatedAt: Date;
  updater?: User?;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityData?: any | null;
  changedData?: any | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  duration?: number | null;
  errorMessage?: string | null;
  metadata?: any | null;
  createdAt: Date;
  user?: User?;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  eventType: string;
  userId?: string | null;
  sessionId?: string | null;
  properties?: any | null;
  context?: any | null;
  timestamp: Date;
  user?: User?;
}

export interface SearchIndex {
  id: string;
  entityType: string;
  entityId: string;
  searchableText: string;
  title?: string | null;
  description?: string | null;
  tags: string[];
  boost: number;
  locale: string;
  isPublic: boolean;
  lastIndexedAt: Date;
  metadata?: any | null;
}

export interface CacheEntry {
  key: string;
  value: any;
  type: CacheType;
  tags: string[];
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
}

export interface SystemHealth {
  id: string;
  service: string;
  status: string;
  responseTime?: number | null;
  errorRate?: number | null;
  throughput?: number | null;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  diskUsage?: number | null;
  activeUsers?: number | null;
  queueDepth?: number | null;
  metadata?: any | null;
  checkedAt: Date;
}

export interface RateLimitTracker {
  id: string;
  identifier: string;
  endpoint: string;
  windowStart: Date;
  requests: number;
  blocked: boolean;
}

export interface EncryptionKey {
  id: string;
  keyName: string;
  keyVersion: number;
  algorithm: string;
  createdAt: Date;
  rotatedAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
}

export interface DataRetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  anonymizeDays?: number | null;
  hardDeleteDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

# generated file: src/types/generated/utils.ts
```ts
// Utility Types
// Generated on 2025-08-23T09:12:06.759Z

// Make all properties optional recursively
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

// Make all properties required recursively
export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T

// Make all properties readonly recursively
export type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T

// Make all properties mutable recursively
export type DeepMutable<T> = T extends object
  ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
  : T

// Pick properties that are of a certain type
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P]
}

// Omit properties that are of a certain type
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P]
}

// Make specified properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Make specified properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

// Union to intersection
export type UnionToIntersection<U> = (
  U extends any ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

// Get the type of a promise
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never

// Get the type of an array element
export type ArrayElement<T extends readonly any[]> = T extends readonly (infer U)[] ? U : never

// Get function arguments as tuple
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never

// Get function return type
export type ReturnType<F extends Function> = F extends (...args: any[]) => infer R ? R : never

// Merge two types, with the second overwriting the first
export type Merge<T, U> = Omit<T, keyof U> & U

// Extract keys that are strings
export type StringKeys<T> = Extract<keyof T, string>

// Extract keys that are numbers
export type NumberKeys<T> = Extract<keyof T, number>

// Make specified properties nullable
export type NullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null
}

// Make all properties nullable
export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

// XOR type - either A or B but not both
export type XOR<T, U> = (T | U) extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never }

// Exact type - no extra properties allowed
export type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never

// Value of object
export type ValueOf<T> = T[keyof T]

// Entries of object
export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

// From entries to object
export type FromEntries<T extends readonly [PropertyKey, any][]> = {
  [K in T[number][0]]: Extract<T[number], [K, any]>[1]
}

// Paths of an object
export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | (Paths<T[K], Prev[D]> extends infer P
            ? P extends string | number
              ? `${K}.${P}`
              : never
            : never)
        : never
    }[keyof T]
  : ''

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]]

// Path value of an object
export type PathValue<T, P extends Paths<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Paths<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never
```
