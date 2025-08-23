// Prisma Model Types with Complete JSON Typing
// Generated on 2025-08-23T14:31:51.126Z
// Total Models: 112

import { Decimal } from 'decimal.js'
import { UserRole, UserStatus, NotificationType, ReactionType, ReportReason, ModerationStatus, ContentType, ContentStatus, BadgeRarity, QuestType, QuestStatus, TradeStatus, MessageStatus, EventType, EventStatus, GroupVisibility, GroupMemberRole, CacheType, AuditAction, PaymentStatus, SubscriptionTier, AuthProvider } from './enums'
import { YouTubeVideoData, ThemePreference, NotificationSettings, PrivacySettings, SocialLinks, PostContent, SponsorInfo, AchievementCriteria, StoreItemData, StoreItemRequirements, TradeItems, QuestRequirements, QuestRewards, QuestMetadata, QuestProgress, UserQuestMetadata, GroupGuidelines, GroupSettings, CustomEmojis, GroupMetadata, LocationCoordinates, EventRecurrence, EventAgenda, EventSpeakers, EventSponsors, EventMaterials, EventFeedback, ConversationSettings, MessageAttachments, MessageReactions, MessageMetadata, EditHistory, ChatAttachments, ChatReactions, PollResults, PollOptionMetadata, PollVoteMetadata, ArtDimensions, AiContentPreferences, WritingStyle, AiMessage, AiContext, AiModerationCategories, AiReasons, MediaDimensions, MediaMetadata, ExperimentVariants, ExperimentMetrics, TargetingRules, ExperimentResults, FeatureFlagConditions, FeatureFlagMetadata, ValidationRules, AuditMetadata, EventProperties, EventContext } from './json-types'

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
  youtubeChannelData?: YouTubeVideoData | null;  // Typed JSON field
  bannerImage?: string | null;
  themePreference?: ThemePreference | null;  // Typed JSON field
  notificationSettings: NotificationSettings;  // Typed JSON field
  privacySettings: PrivacySettings;  // Typed JSON field
  profileVisibility: string;
  contentVisibility: string;
  allowDirectMessages: boolean;
  featuredBadges: string[];
  showcasedPosts: string[];
  customCss?: string | null;
  customHtml?: string | null;
  socialLinks?: SocialLinks | null;  // Typed JSON field
  interests: string[];
  skills: string[];
  pronouns?: string | null;
  birthdate?: Date | null;
  joinedCommunityAt: Date;
  profileCompleted: boolean;
  profileCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
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
  metadata?: Record<string, any> | null;  // Typed JSON field
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
  content: PostContent;  // Typed JSON field
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
  sponsorInfo?: SponsorInfo | null;  // Typed JSON field
  isPinned: boolean;
  pinnedUntil?: Date | null;
  isDraft: boolean;
  version: number;
  parentVersionId?: string | null;
  collaborators: string[];
  youtubeVideoId?: string | null;
  youtubeVideoData?: YouTubeVideoData | null;  // Typed JSON field
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
  parameters: Record<string, any>;
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
  parameters: Record<string, any>;
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
  content: Record<string, any>;
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
  metadata?: Record<string, any> | null;
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
  editHistory: Record<string, any>[];
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
  metadata?: Record<string, any> | null;
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
  data?: Record<string, any> | null;
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
  payload: Record<string, any>;
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
  content: Record<string, any>;
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
  variables: Record<string, any>;
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
  criteria?: AchievementCriteria | null;  // Typed JSON field
  progressSteps: number;
  isSecret: boolean;
  prerequisiteIds: string[];
  displayOrder: number;
  seasonal: boolean;
  eventBased: boolean;
  limited: boolean;
  maxAchievers?: number | null;
  expiresAt?: Date | null;
  metadata?: Record<string, any> | null;  // Typed JSON field
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
  progressData?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  data?: StoreItemData | null;  // Typed JSON field
  requirements?: StoreItemRequirements | null;  // Typed JSON field
  limitedEdition: boolean;
  stockRemaining?: number | null;
  maxPerUser?: number | null;
  featured: boolean;
  new: boolean;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  metadata?: Record<string, any> | null;
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
  customData?: Record<string, any> | null;
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
  initiatorItems: TradeItems;  // Typed JSON field
  recipientItems: TradeItems;  // Typed JSON field
  initiatorPoints: number;
  recipientPoints: number;
  message?: string | null;
  responseMessage?: string | null;
  tradeValue: number;
  escrowId?: string | null;
  expiresAt: Date;
  respondedAt?: Date | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  initiator: User;
  recipient: User;
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
  requirements: QuestRequirements;  // Typed JSON field
  rewards: QuestRewards;  // Typed JSON field
  xpReward: number;
  pointsReward: number;
  prerequisiteIds: string[];
  levelRequired: number;
  cooldownHours?: number | null;
  maxCompletions: number;
  timeLimit?: number | null;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  metadata?: QuestMetadata | null;  // Typed JSON field
  createdAt: Date;
  updatedAt: Date;
  userQuests: UserQuest[];
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
  progress: QuestProgress;  // Typed JSON field
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date | null;
  claimedAt?: Date | null;
  expiresAt?: Date | null;
  attemptCount: number;
  bestTime?: number | null;
  metadata?: UserQuestMetadata | null;  // Typed JSON field
  user: User;
  quest: Quest;
}

export interface Leaderboard {
  id: string;
  type: string;
  scope: string;
  scopeId?: string | null;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  data: Record<string, any>;
  metadata?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
  createdAt: Date;
}

export interface YoutubeChannel {
  id: string;
  channelId: string;
  userId?: string | null;
  channelTitle?: string | null;
  channelHandle?: string | null;
  channelDescription?: string | null;
  channelData?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  customEmotes?: Record<string, any> | null;
  partyCode?: string | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  metadata?: Record<string, any> | null;
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
  reactions?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
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
  guidelines?: GroupGuidelines | null;  // Typed JSON field
  tags: string[];
  categories: string[];
  settings: GroupSettings;  // Typed JSON field
  features: string[];
  customEmojis?: CustomEmojis | null;  // Typed JSON field
  isOfficial: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  metadata?: GroupMetadata | null;  // Typed JSON field
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: User?;
  members: GroupMember[];
  events: Event[];
  posts: GroupPost[];
  channels: GroupChannel[];
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
  permissions?: Record<string, any> | null;
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
  locationCoords?: LocationCoordinates | null;  // Typed JSON field
  isVirtual: boolean;
  virtualPlatform?: string | null;
  virtualLink?: string | null;
  bannerImage?: string | null;
  thumbnailImage?: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  recurrence?: EventRecurrence | null;  // Typed JSON field
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: Date | null;
  maxAttendees?: number | null;
  currentAttendees: number;
  minAttendees?: number | null;
  isPublic: boolean;
  requiresApproval: boolean;
  requiresPayment: boolean;
  price?: Decimal | null;
  currency?: string | null;
  tags: string[];
  categories: string[];
  agenda?: EventAgenda | null;  // Typed JSON field
  speakers?: EventSpeakers | null;  // Typed JSON field
  sponsors?: EventSponsors | null;  // Typed JSON field
  streamUrl?: string | null;
  recordingUrl?: string | null;
  materials?: EventMaterials | null;  // Typed JSON field
  feedback?: EventFeedback | null;  // Typed JSON field
  remindersSent: string[];
  metadata?: Record<string, any> | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  host?: User?;
  group?: Group?;
  attendees: EventAttendee[];
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
  settings: ConversationSettings;  // Typed JSON field
  pinnedMessages: string[];
  isArchived: boolean;
  archivedAt?: Date | null;
  version: number;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  creator: User;
  participants: ConversationParticipant[];
  messages: Message[];
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
  customSettings?: Record<string, any> | null;
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
  attachments?: MessageAttachments | null;  // Typed JSON field
  mentions: string[];
  replyToId?: string | null;
  forwardedFrom?: string | null;
  reactions?: MessageReactions | null;  // Typed JSON field
  metadata?: MessageMetadata | null;  // Typed JSON field
  edited: boolean;
  editedAt?: Date | null;
  editHistory: EditHistory[][];  // Typed JSON field
  deleted: boolean;
  deletedAt?: Date | null;
  deletedFor: string[];
  status: MessageStatus;
  deliveredAt?: Date | null;
  errorMessage?: string | null;
  version: number;
  createdAt: Date;
  conversation: Conversation;
  sender: User;
  replyTo?: Message?;
  replies: Message[];
  reads: MessageRead[];
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
  customEmojis?: CustomEmojis | null;  // Typed JSON field
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
  attachments?: ChatAttachments | null;  // Typed JSON field
  replyToId?: string | null;
  systemMessage: boolean;
  highlighted: boolean;
  reactions?: ChatReactions | null;  // Typed JSON field
  edited: boolean;
  editedAt?: Date | null;
  deleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  flagged: boolean;
  flagReason?: string | null;
  createdAt: Date;
  room: ChatRoom;
  user: User;
  replyTo?: ChatMessage?;
  replies: ChatMessage[];
}

export interface CollaborativeSpace {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  ownerId: string;
  content?: Record<string, any> | null;
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
  metadata?: Record<string, any> | null;
}

export interface ActivityStream {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityData?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
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
  finalResults?: PollResults | null;  // Typed JSON field
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
  metadata?: PollOptionMetadata | null;  // Typed JSON field
  poll: Poll;
  voteChoices: PollVoteChoice[];
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  comment?: string | null;
  ipAddress?: string | null;
  metadata?: PollVoteMetadata | null;  // Typed JSON field
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
  prizes?: Record<string, any> | null;
  submissionDeadline?: Date | null;
  votingDeadline?: Date | null;
  votingEnabled: boolean;
  publicVoting: boolean;
  maxSubmissionsPerUser: number;
  requireApproval: boolean;
  allowNSFW: boolean;
  winnerCount: number;
  winnersAnnounced: boolean;
  metadata?: Record<string, any> | null;
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
  dimensions?: ArtDimensions | null;  // Typed JSON field
  medium?: string | null;
  tools: string[];
  timeSpent?: number | null;
  voteCount: number;
  avgRating: number;
  viewCount: number;
  featured: boolean;
  winner: boolean;
  winnerRank?: number | null;
  moderationStatus: ModerationStatus;
  moderationNotes?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  gallery: FanArtGallery;
  artist: User;
}

export interface AiRecommendation {
  id: string;
  userId: string;
  recommendationType: string;
  entityType: string;
  entityId: string;
  score: number;
  reason?: string | null;
  context?: Record<string, any> | null;
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
  context?: Record<string, any> | null;
  used: boolean;
  usedContent?: string | null;
  feedback?: number | null;
  createdAt: Date;
  user: User;
}

export interface UserAiPreference {
  id: string;
  userId: string;
  contentPreferences: AiContentPreferences;  // Typed JSON field
  writingStyle?: WritingStyle | null;  // Typed JSON field
  learningOptedOut: boolean;
  lastUpdated: Date;
  user: User;
}

export interface AiAssistantConversation {
  id: string;
  userId: string;
  sessionId: string;
  messages: AiMessage[][];  // Typed JSON field
  context?: AiContext | null;  // Typed JSON field
  model: string;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
  user: User;
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
  evidence?: Record<string, any> | null;
  status: ModerationStatus;
  priority: number;
  assignedTo?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  resolution?: string | null;
  resolutionNote?: string | null;
  appealable: boolean;
  entityType: string;
  metadata?: Record<string, any> | null;
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
  aiCategories?: AiModerationCategories | null;  // Typed JSON field
  aiReasons?: AiReasons | null;  // Typed JSON field
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
  evidence?: Record<string, any> | null;
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
  dimensions?: MediaDimensions | null;  // Typed JSON field
  metadata?: MediaMetadata | null;  // Typed JSON field
  processedAt?: Date | null;
  processingError?: string | null;
  isPublic: boolean;
  accessCount: number;
  lastAccessedAt?: Date | null;
  createdAt: Date;
  user: User;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string | null;
  hypothesis?: string | null;
  variants: ExperimentVariants;  // Typed JSON field
  control: string;
  metrics: ExperimentMetrics;  // Typed JSON field
  targetingRules?: TargetingRules | null;  // Typed JSON field
  trafficPercentage: number;
  status: string;
  results?: ExperimentResults | null;  // Typed JSON field
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
  conversionData?: Record<string, any> | null;
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
  conditions?: FeatureFlagConditions | null;  // Typed JSON field
  metadata?: FeatureFlagMetadata | null;  // Typed JSON field
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSetting {
  key: string;
  value: any;  // Typed JSON field
  type: string;
  category?: string | null;
  description?: string | null;
  isPublic: boolean;
  isEditable: boolean;
  validation?: ValidationRules | null;  // Typed JSON field
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
  entityData?: Record<string, any> | null;  // Typed JSON field
  changedData?: Record<string, any> | null;  // Typed JSON field
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  duration?: number | null;
  errorMessage?: string | null;
  metadata?: AuditMetadata | null;  // Typed JSON field
  createdAt: Date;
  user?: User?;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  eventType: string;
  userId?: string | null;
  sessionId?: string | null;
  properties?: EventProperties | null;  // Typed JSON field
  context?: EventContext | null;  // Typed JSON field
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
  metadata?: Record<string, any> | null;
}

export interface CacheEntry {
  key: string;
  value: Record<string, any>;
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
  metadata?: Record<string, any> | null;
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
