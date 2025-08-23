// src/types/global.d.ts

/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

import { UserRole, UserStatus, AuthProvider } from '@prisma/client'

// Extended User type for admin layout with all required fields
export interface ExtendedUser {
  id: string
  username: string
  email: string
  name?: string // Added for admin layout compatibility
  role: UserRole
  image: string | null
  avatar?: string // Alias for image
  level?: number
  sparklePoints?: number
  premiumPoints?: number
  status?: UserStatus
  createdAt?: Date
  updatedAt?: Date
  version?: number // Added required version field
  hashedPassword?: string
  authProvider?: AuthProvider
  deleted?: boolean
  deletedAt?: Date | null
  deletedBy?: string | null
  bio?: string
  verified?: boolean
  verifiedAt?: Date | null
  experience?: number
  reputationScore?: number
  lastSeenAt?: Date | null
  loginStreak?: number
  lastLoginAt?: Date | null
  emailVerified?: Date | null
  emailVerificationToken?: string | null
  emailVerificationExpires?: Date | null
  resetPasswordToken?: string | null
  resetPasswordExpires?: Date | null
  phoneNumber?: string | null
  phoneNumberHash?: string | null
  phoneVerified?: Date | null
  twoFactorEnabled?: boolean
  twoFactorSecret?: string | null
  twoFactorBackupCodes?: string[]
  accountLockoutAttempts?: number
  accountLockedUntil?: Date | null
  lastPasswordChangedAt?: Date | null
  lastFailedLoginAt?: Date | null
  failedLoginAttempts?: number
  onlineStatus?: string
  creatorRevenueShare?: any
  totalRevenueEarned?: any
  lastPayoutDate?: Date | null
  banned?: boolean
  banReason?: string | null
  banExpiresAt?: Date | null
  preferredLanguage?: string
  timezone?: string
}

// Fixed TimePeriod type - removed 'today' to match API expectations
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

// Chart component props with complete definitions
export interface UserGrowthChartProps {
  data: UserGrowthData[]
  period?: TimePeriod
  height?: number
  type?: 'line' | 'area' | 'bar'
  showLegend?: boolean
  showGrid?: boolean
  showBrush?: boolean
  loading?: boolean
  error?: string
  className?: string
  title?: string
  description?: string
  showTrend?: boolean
  showStats?: boolean
  animate?: boolean
  colors?: string[]
}

export interface UserGrowthData {
  date: string
  users: number
  cumulative?: number
  activeUsers?: number
  newUsers?: number
}

export interface ContentPerformanceProps {
  data: any
  period?: TimePeriod
  overTimeData?: any[]
  typeDistribution?: any[]
  topPerformers?: any[]
  loading?: boolean
  error?: string
  className?: string
  title?: string
  description?: string
  onPeriodChange?: (period: TimePeriod) => void
  onExport?: () => void
  type?: string
  height?: number
  showLegend?: boolean
  horizontal?: boolean
}

export interface ContentPerformanceData {
  id: string
  title: string
  views: number
  comments: number
  reactions: number
  shares: number
  engagement: number
  author: string
  createdAt: Date
}

export interface EngagementHeatmapProps {
  data: any
  height?: number
  loading?: boolean
  error?: string
  className?: string
  title?: string
  description?: string
}

export interface TopCreator {
  id: string
  username: string
  avatar: string | null
  postsCount: number
  followersCount: number
  engagementRate: number
  revenue: number
}

// Analytics Chart Props
export interface AnalyticsChartProps {
  data?: any
  type?: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'radar' | 'scatter' | 'heatmap' | 'treemap' | 'map' | 'stacked-bar'
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  animate?: boolean
  className?: string
  title?: string
  colors?: string[]
  horizontal?: boolean
}

// Real-time metrics types
export interface RealtimeMetric {
  label: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  percentage?: number
  threshold?: { warning: number; critical: number }
  icon?: React.ComponentType<any>
  color?: string
}

// Admin Dashboard Types
export interface DashboardStats {
  users: {
    total: number
    active: number
    new: number
    online: number
    growth: number
    activeGrowth?: number
    newToday?: number
    dau?: number
    mau?: number
    avgSessionDuration?: number
    retentionRate?: number
  }
  content: {
    posts: number
    comments: number
    postsGrowth: number
    postsToday?: number
  }
  engagement: {
    reactions: number
    comments: number
    shares?: number
    rate?: number
    rateChange?: number
    viralityScore?: number
  }
  moderation: {
    pending: number
    approvedToday: number
    rejectedToday: number
    aiAccuracy?: number
  }
}

// EdgeRuntime type
declare const EdgeRuntime: string | undefined

// Prisma JsonValue re-export fix
declare module '@prisma/client' {
  export type JsonValue = 
    | string
    | number
    | boolean
    | null
    | JsonArray
    | JsonObject

  export interface JsonArray extends Array<JsonValue> {}
  export interface JsonObject extends Record<string, JsonValue> {}
}

// YouTube API Global Types
declare global {
  interface Window {
    YT: {
      Player: typeof YT.Player
      PlayerState: typeof YT.PlayerState
      PlayerError: typeof YT.PlayerError
      loaded: number
      ready: (callback: () => void) => void
    }
    onYouTubeIframeAPIReady?: () => void
    dataLayer: any[]
    gtag?: (...args: any[]) => void
  }
}

declare namespace YT {
  class Player {
    constructor(elementId: string | HTMLElement, config: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    getCurrentTime(): number
    getDuration(): number
    getPlayerState(): PlayerState
    getVolume(): number
    setVolume(volume: number): void
    mute(): void
    unMute(): void
    isMuted(): boolean
    setPlaybackRate(rate: number): void
    getPlaybackRate(): number
    getAvailablePlaybackRates(): number[]
    getVideoUrl(): string
    getVideoEmbedCode(): string
    getPlaylist(): string[]
    getPlaylistIndex(): number
    nextVideo(): void
    previousVideo(): void
    playVideoAt(index: number): void
    loadVideoById(videoId: string, startSeconds?: number): void
    loadVideoByUrl(mediaContentUrl: string, startSeconds?: number): void
    cueVideoById(videoId: string, startSeconds?: number): void
    cueVideoByUrl(mediaContentUrl: string, startSeconds?: number): void
    destroy(): void
    addEventListener(event: string, listener: Function): void
    removeEventListener(event: string, listener: Function): void
    get(iframeRef: HTMLIFrameElement): Player
  }
  
  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    host?: string
    playerVars?: PlayerVars
    events?: Events
  }
  
  interface PlayerVars {
    autoplay?: 0 | 1
    cc_lang_pref?: string
    cc_load_policy?: 0 | 1
    color?: 'red' | 'white'
    controls?: 0 | 1
    disablekb?: 0 | 1
    enablejsapi?: 0 | 1
    end?: number
    fs?: 0 | 1
    hl?: string
    iv_load_policy?: 1 | 3
    list?: string
    listType?: 'playlist' | 'search' | 'user_uploads'
    loop?: 0 | 1
    modestbranding?: 0 | 1
    origin?: string
    playerapiid?: string
    playlist?: string
    playsinline?: 0 | 1
    rel?: 0 | 1
    showinfo?: 0 | 1
    start?: number
    widget_referrer?: string
    mute?: 0 | 1
  }
  
  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void
    onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
    onApiChange?: (event: PlayerEvent) => void
  }
  
  interface PlayerEvent {
    target: Player
    data?: any
  }
  
  interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState
  }
  
  interface OnPlaybackQualityChangeEvent extends PlayerEvent {
    data: string
  }
  
  interface OnPlaybackRateChangeEvent extends PlayerEvent {
    data: number
  }
  
  interface OnErrorEvent extends PlayerEvent {
    data: number
  }
  
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
  
  enum PlayerError {
    INVALID_PARAM = 2,
    HTML5_ERROR = 5,
    VIDEO_NOT_FOUND = 100,
    EMBED_NOT_ALLOWED = 101,
    EMBED_NOT_ALLOWED_2 = 150,
  }
}

// Algolia Search Types
declare module 'algoliasearch' {
  export default function algoliasearch(
    appId: string,
    apiKey: string,
    options?: any
  ): SearchClient

  export interface SearchClient {
    initIndex(indexName: string): SearchIndex
    search<T = any>(requests: MultipleQueriesQuery[]): Promise<MultipleQueriesResponse<T>>
    searchForFacetValues(queries: SearchForFacetValuesQuery[]): Promise<SearchForFacetValuesResponse[]>
    clearCache(): void
  }
  
  export interface SearchIndex {
    search<T = any>(query: string, options?: SearchOptions): Promise<SearchResponse<T>>
    searchForFacetValues(facetName: string, facetQuery: string, options?: SearchForFacetValuesOptions): Promise<SearchForFacetValuesResponse>
    saveObjects(objects: any[], options?: SaveObjectsOptions): Promise<SaveObjectsResponse>
    deleteObjects(objectIDs: string[]): Promise<DeleteObjectsResponse>
    clearObjects(): Promise<ClearObjectsResponse>
    partialUpdateObject(object: any, options?: PartialUpdateObjectOptions): Promise<UpdateObjectResponse>
    partialUpdateObjects(objects: any[], options?: PartialUpdateObjectsOptions): Promise<UpdateObjectsResponse>
  }

  export interface SearchOptions {
    query?: string
    similarQuery?: string
    facetFilters?: string | string[] | string[][]
    optionalFacetFilters?: string | string[] | string[][]
    numericFilters?: string | string[]
    filters?: string
    page?: number
    hitsPerPage?: number
    offset?: number
    length?: number
    [key: string]: any
  }

  export interface SearchResponse<T = any> {
    hits: Array<T & { objectID: string; _highlightResult?: any }>
    nbHits: number
    page: number
    nbPages: number
    hitsPerPage: number
    processingTimeMS: number
    query: string
    params: string
  }

  export interface MultipleQueriesQuery {
    indexName: string
    query?: string
    params?: SearchOptions
  }

  export interface MultipleQueriesResponse<T = any> {
    results: SearchResponse<T>[]
  }

  export interface SearchForFacetValuesQuery {
    indexName: string
    facetName: string
    facetQuery: string
    params?: SearchForFacetValuesOptions
  }

  export interface SearchForFacetValuesOptions {
    facetQuery?: string
    maxFacetHits?: number
  }

  export interface SearchForFacetValuesResponse {
    facetHits: FacetHit[]
    exhaustiveFacetsCount: boolean
    processingTimeMS: number
  }

  export interface FacetHit {
    value: string
    highlighted: string
    count: number
  }

  export interface SaveObjectsOptions {
    autoGenerateObjectIDIfNotExist?: boolean
  }

  export interface SaveObjectsResponse {
    objectIDs: string[]
    taskID: number
  }

  export interface DeleteObjectsResponse {
    objectIDs: string[]
    taskID: number
  }

  export interface ClearObjectsResponse {
    updatedAt: string
    taskID: number
  }

  export interface UpdateObjectResponse {
    objectID: string
    taskID: number
  }

  export interface UpdateObjectsResponse {
    objectIDs: string[]
    taskID: number
  }

  export interface PartialUpdateObjectOptions {
    createIfNotExists?: boolean
  }

  export interface PartialUpdateObjectsOptions {
    createIfNotExists?: boolean
  }
}

// Recharts Custom Types
declare module 'recharts' {
  export interface CustomTooltipProps<TValue = any, TName = any> {
    active?: boolean
    payload?: Array<{
      value: TValue
      name: TName
      color?: string
      dataKey?: string
      payload?: any
      unit?: string
    }>
    label?: string
    labelFormatter?: (value: any) => string
    formatter?: (value: any, name: any) => [string, string] | string
  }

  export interface CustomLegendProps {
    payload?: Array<{
      value: string
      type?: string
      id?: string
      color?: string
    }>
    iconSize?: number
    layout?: 'horizontal' | 'vertical'
    align?: 'left' | 'center' | 'right'
    verticalAlign?: 'top' | 'middle' | 'bottom'
  }
}

// Next Themes Types Extension
declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode
    attribute?: string | string[]
    defaultTheme?: string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    storageKey?: string
    themes?: string[]
    forcedTheme?: string
    enableColorScheme?: boolean
    scriptProps?: React.HTMLAttributes<HTMLScriptElement>
    nonce?: string
    value?: { [themeName: string]: string }
  }
  
  export interface UseThemeProps {
    theme?: string
    setTheme: (theme: string) => void
    systemTheme?: string
    themes: string[]
    forcedTheme?: string
    resolvedTheme?: string
  }

  export function ThemeProvider(props: ThemeProviderProps): JSX.Element
  export function useTheme(): UseThemeProps
}

// Custom Event Types for Sparkle Universe
interface SparkleCustomEvents {
  'sparkle:notification': CustomEvent<{
    type: string
    message: string
    userId?: string
  }>
  'sparkle:achievement': CustomEvent<{
    achievementId: string
    userId: string
    rarity: string
  }>
  'sparkle:level-up': CustomEvent<{
    userId: string
    oldLevel: number
    newLevel: number
  }>
  'sparkle:points-earned': CustomEvent<{
    userId: string
    points: number
    type: 'sparkle' | 'premium'
  }>
  'sparkle:post-created': CustomEvent<{
    postId: string
    userId: string
    title: string
  }>
  'sparkle:comment-added': CustomEvent<{
    commentId: string
    postId: string
    userId: string
  }>
  'sparkle:reaction-added': CustomEvent<{
    reactionType: string
    entityId: string
    entityType: 'post' | 'comment'
    userId: string
  }>
}

// Extend global Window EventMap
declare global {
  interface WindowEventMap extends SparkleCustomEvents {}
  
  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      DIRECT_URL?: string
      NEXTAUTH_URL: string
      NEXTAUTH_SECRET: string
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      GITHUB_CLIENT_ID?: string
      GITHUB_CLIENT_SECRET?: string
      DISCORD_CLIENT_ID?: string
      DISCORD_CLIENT_SECRET?: string
      TWITTER_CLIENT_ID?: string
      TWITTER_CLIENT_SECRET?: string
      YOUTUBE_API_KEY?: string
      REDIS_URL?: string
      REDIS_PASSWORD?: string
      UPLOADTHING_SECRET?: string
      UPLOADTHING_APP_ID?: string
      OPENAI_API_KEY?: string
      STRIPE_SECRET_KEY?: string
      STRIPE_WEBHOOK_SECRET?: string
      STRIPE_PUBLISHABLE_KEY?: string
      PAYPAL_CLIENT_ID?: string
      PAYPAL_CLIENT_SECRET?: string
      TWILIO_ACCOUNT_SID?: string
      TWILIO_AUTH_TOKEN?: string
      TWILIO_PHONE_NUMBER?: string
      EMAIL_SERVER_HOST?: string
      EMAIL_SERVER_PORT?: string
      EMAIL_SERVER_USER?: string
      EMAIL_SERVER_PASSWORD?: string
      EMAIL_FROM?: string
      NEXT_PUBLIC_APP_URL?: string
      NEXT_PUBLIC_WS_URL?: string
      NEXT_PUBLIC_ENABLE_YOUTUBE?: string
      NEXT_PUBLIC_ENABLE_WEBSOCKET?: string
      NEXT_PUBLIC_ENABLE_PWA?: string
      NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION?: string
      NEXT_PUBLIC_ENABLE_2FA?: string
      ENCRYPTION_KEY?: string
      JWT_SECRET?: string
      HASH_SALT?: string
      AI_MODEL?: string
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
  
  // Utility types
  type Nullable<T> = T | null
  type Optional<T> = T | undefined
  type Maybe<T> = T | null | undefined
  
  // JSON compatible types
  type JsonPrimitive = string | number | boolean | null
  type JsonObject = { [key: string]: JsonValue }
  type JsonArray = JsonValue[]
  type JsonValue = JsonPrimitive | JsonObject | JsonArray
  
  // Common patterns
  type AsyncFunction<T = void> = () => Promise<T>
  type AsyncFunctionWithArgs<Args, Return = void> = (args: Args) => Promise<Return>
  type VoidFunction = () => void
  type Callback<T = void> = (error: Error | null, result?: T) => void
  
  // React patterns
  type PropsWithClassName<P = {}> = P & { className?: string }
  type PropsWithChildren<P = {}> = P & { children?: React.ReactNode }
  
  // API Response types
  interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
    status: number
    success: boolean
  }
  
  interface PaginatedResponse<T = any> {
    data: T[]
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
  
  // Form types
  interface FormState<T = any> {
    values: T
    errors: Partial<Record<keyof T, string>>
    touched: Partial<Record<keyof T, boolean>>
    isSubmitting: boolean
    isValid: boolean
  }
  
  // Table types
  interface TableColumn<T = any> {
    key: keyof T | string
    label: string
    sortable?: boolean
    width?: string | number
    align?: 'left' | 'center' | 'right'
    render?: (value: any, row: T, index: number) => React.ReactNode
  }
  
  interface TableState<T = any> {
    data: T[]
    columns: TableColumn<T>[]
    page: number
    pageSize: number
    sortBy?: keyof T | string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
    selectedRows?: T[]
  }
}

// Module declarations for assets
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  export default content
}

declare module '*.svg?url' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}

declare module '*.avif' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}

declare module '*.webm' {
  const content: string
  export default content
}

declare module '*.mp4' {
  const content: string
  export default content
}

declare module '*.mp3' {
  const content: string
  export default content
}

declare module '*.wav' {
  const content: string
  export default content
}

declare module '*.ogg' {
  const content: string
  export default content
}

declare module '*.pdf' {
  const content: string
  export default content
}

declare module '*.woff' {
  const content: string
  export default content
}

declare module '*.woff2' {
  const content: string
  export default content
}

declare module '*.eot' {
  const content: string
  export default content
}

declare module '*.ttf' {
  const content: string
  export default content
}

declare module '*.otf' {
  const content: string
  export default content
}

declare module '*.json' {
  const value: any
  export default value
}

declare module '*.md' {
  const content: string
  export default content
}

declare module '*.mdx' {
  const MDXComponent: (props: any) => JSX.Element
  export default MDXComponent
}

declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.sass' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.less' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.styl' {
  const content: { [className: string]: string }
  export default content
}

export {}
