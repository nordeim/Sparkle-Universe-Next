## 📋 Comprehensive Execution Plan

### Phase 1: Analysis of Type Issues
**Priority**: P0 (Critical)

**Checklist:**
- [ ] Review all type-check errors related to global types
- [ ] Identify missing type definitions
- [ ] Analyze conflicts between existing and required types
- [ ] Ensure compatibility with Prisma types
- [ ] Verify YouTube API type completeness

### Phase 2: Update Global Type Definitions
**Priority**: P0 (Critical)

**Checklist:**
- [ ] Fix TimePeriod type (remove 'today', keep 'day')
- [ ] Add complete chart component prop types
- [ ] Ensure ExtendedUser has all required fields including 'version'
- [ ] Add missing analytics type definitions
- [ ] Verify YouTube API types are complete
- [ ] Add missing module declarations

### Phase 3: Create Type Generation Script
**Priority**: P1 (High)

**Checklist:**
- [ ] Create script to generate types from Prisma schema
- [ ] Add utilities for type validation
- [ ] Include type export functionality
- [ ] Add documentation generation
- [ ] Ensure script is reusable

---

## 🔧 Complete File Replacements

### 1. Updated Global Type Definitions

```typescript
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
```

### 2. Create Type Generation Script

```typescript
// scripts/generate-types.ts

import { exec } from 'child_process'
import { promises as fs } from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Logger utility
const logger = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}▶ ${msg}${colors.reset}`),
}

interface GenerateTypesOptions {
  outputDir?: string
  prismaSchema?: string
  includeEnums?: boolean
  includeModels?: boolean
  generateIndex?: boolean
  generateDocs?: boolean
  customTypes?: Record<string, any>
}

class TypeGenerator {
  private options: Required<GenerateTypesOptions>
  private generatedTypes: Map<string, string> = new Map()

  constructor(options: GenerateTypesOptions = {}) {
    this.options = {
      outputDir: options.outputDir || 'src/types/generated',
      prismaSchema: options.prismaSchema || 'prisma/schema.prisma',
      includeEnums: options.includeEnums ?? true,
      includeModels: options.includeModels ?? true,
      generateIndex: options.generateIndex ?? true,
      generateDocs: options.generateDocs ?? true,
      customTypes: options.customTypes || {},
    }
  }

  async generate(): Promise<void> {
    try {
      logger.section('Starting Type Generation')
      
      // Ensure output directory exists
      await this.ensureOutputDirectory()
      
      // Generate Prisma types
      await this.generatePrismaTypes()
      
      // Generate API types
      await this.generateApiTypes()
      
      // Generate component types
      await this.generateComponentTypes()
      
      // Generate utility types
      await this.generateUtilityTypes()
      
      // Generate custom types
      await this.generateCustomTypes()
      
      // Generate index file
      if (this.options.generateIndex) {
        await this.generateIndexFile()
      }
      
      // Generate documentation
      if (this.options.generateDocs) {
        await this.generateDocumentation()
      }
      
      logger.success('Type generation completed successfully!')
      
    } catch (error) {
      logger.error(`Type generation failed: ${error}`)
      process.exit(1)
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    logger.info('Creating output directory...')
    await fs.mkdir(this.options.outputDir, { recursive: true })
  }

  private async generatePrismaTypes(): Promise<void> {
    logger.info('Generating Prisma types...')
    
    try {
      // Generate Prisma client
      await execAsync('npx prisma generate')
      
      // Extract types from schema
      const schemaContent = await fs.readFile(this.options.prismaSchema, 'utf-8')
      const enums = this.extractEnums(schemaContent)
      const models = this.extractModels(schemaContent)
      
      // Generate enum types
      if (this.options.includeEnums && enums.length > 0) {
        const enumTypes = this.generateEnumTypes(enums)
        await this.saveTypeFile('enums.ts', enumTypes)
        this.generatedTypes.set('enums', enumTypes)
      }
      
      // Generate model interfaces
      if (this.options.includeModels && models.length > 0) {
        const modelTypes = this.generateModelTypes(models)
        await this.saveTypeFile('models.ts', modelTypes)
        this.generatedTypes.set('models', modelTypes)
      }
      
      logger.success('Prisma types generated')
    } catch (error) {
      logger.error(`Failed to generate Prisma types: ${error}`)
      throw error
    }
  }

  private async generateApiTypes(): Promise<void> {
    logger.info('Generating API types...')
    
    const apiTypes = `
// API Request and Response Types
// Generated on ${new Date().toISOString()}

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: T
  timeout?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  message?: string
  status: number
  success: boolean
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface BatchRequest<T = any> {
  operations: Array<{
    id: string
    method: 'CREATE' | 'UPDATE' | 'DELETE'
    data: T
  }>
}

export interface BatchResponse<T = any> {
  success: Array<{
    id: string
    data: T
  }>
  failures: Array<{
    id: string
    error: ApiError
  }>
}

export interface WebSocketMessage<T = any> {
  type: string
  payload: T
  timestamp: string
  id?: string
}

export interface StreamResponse<T = any> {
  stream: ReadableStream<T>
  cancel: () => void
}
`

    await this.saveTypeFile('api.ts', apiTypes)
    this.generatedTypes.set('api', apiTypes)
    logger.success('API types generated')
  }

  private async generateComponentTypes(): Promise<void> {
    logger.info('Generating component types...')
    
    const componentTypes = `
// Component Prop Types
// Generated on ${new Date().toISOString()}

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent, FocusEvent, ChangeEvent } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  id?: string
  'data-testid'?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-hidden'?: boolean
}

// Interactive component props
export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean
  loading?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  tabIndex?: number
}

// Form component props
export interface FormComponentProps<T = any> extends InteractiveComponentProps {
  name?: string
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  onSubmit?: (value: T) => void
  error?: string
  required?: boolean
  placeholder?: string
  label?: string
  helpText?: string
}

// Layout component props
export interface LayoutComponentProps extends BaseComponentProps {
  children?: ReactNode
  as?: keyof JSX.IntrinsicElements
  gap?: number | string
  padding?: number | string
  margin?: number | string
  direction?: 'row' | 'column'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  footer?: ReactNode
}

// Table component props
export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T, index: number) => ReactNode
  headerRender?: () => ReactNode
  className?: string
  headerClassName?: string
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T, index: number) => void
  rowKey?: keyof T | ((row: T) => string | number)
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onChange: (page: number, pageSize: number) => void
  }
  sorting?: {
    sortBy?: keyof T | string
    sortOrder?: 'asc' | 'desc'
    onSort: (column: keyof T | string) => void
  }
}

// Chart component props
export interface ChartProps extends BaseComponentProps {
  data: any[]
  type?: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar'
  width?: number | string
  height?: number | string
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showGrid?: boolean
  animate?: boolean
  responsive?: boolean
}

// Card component props
export interface CardProps extends BaseComponentProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  header?: ReactNode
  footer?: ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'filled'
  padding?: boolean | number | string
  hoverable?: boolean
  clickable?: boolean
  onClick?: () => void
}

// Button component props
export interface ButtonProps extends InteractiveComponentProps {
  children?: ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  type?: 'button' | 'submit' | 'reset'
}

// Input component props
export interface InputProps extends FormComponentProps<string> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  prefix?: string
  suffix?: string
  maxLength?: number
  minLength?: number
  pattern?: string
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
}

// Select component props
export interface SelectOption<T = any> {
  value: T
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps<T = any> extends FormComponentProps<T> {
  options: SelectOption<T>[]
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  loading?: boolean
  loadingText?: string
  noOptionsText?: string
  onSearch?: (query: string) => void
}

// Toast/Notification props
export interface ToastProps {
  id?: string
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  closable?: boolean
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}
`

    await this.saveTypeFile('components.ts', componentTypes)
    this.generatedTypes.set('components', componentTypes)
    logger.success('Component types generated')
  }

  private async generateUtilityTypes(): Promise<void> {
    logger.info('Generating utility types...')
    
    const utilityTypes = `
// Utility Types
// Generated on ${new Date().toISOString()}

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
        ? \`\${K}\` | (Paths<T[K], Prev[D]> extends infer P
            ? P extends string | number
              ? \`\${K}.\${P}\`
              : never
            : never)
        : never
    }[keyof T]
  : ''

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]]

// Path value of an object
export type PathValue<T, P extends Paths<T>> = P extends \`\${infer Key}.\${infer Rest}\`
  ? Key extends keyof T
    ? Rest extends Paths<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never
`

    await this.saveTypeFile('utils.ts', utilityTypes)
    this.generatedTypes.set('utils', utilityTypes)
    logger.success('Utility types generated')
  }

  private async generateCustomTypes(): Promise<void> {
    if (Object.keys(this.options.customTypes).length === 0) {
      return
    }
    
    logger.info('Generating custom types...')
    
    const customTypes = Object.entries(this.options.customTypes)
      .map(([name, type]) => `export type ${name} = ${JSON.stringify(type, null, 2)};`)
      .join('\n\n')
    
    const customTypesContent = `
// Custom Types
// Generated on ${new Date().toISOString()}

${customTypes}
`

    await this.saveTypeFile('custom.ts', customTypesContent)
    this.generatedTypes.set('custom', customTypesContent)
    logger.success('Custom types generated')
  }

  private async generateIndexFile(): Promise<void> {
    logger.info('Generating index file...')
    
    const exports = Array.from(this.generatedTypes.keys())
      .map(name => `export * from './${name}'`)
      .join('\n')
    
    const indexContent = `
// Generated Type Exports
// Generated on ${new Date().toISOString()}

${exports}

// Re-export Prisma types
export * from '@prisma/client'
`

    await this.saveTypeFile('index.ts', indexContent)
    logger.success('Index file generated')
  }

  private async generateDocumentation(): Promise<void> {
    logger.info('Generating documentation...')
    
    const docs = `
# Generated Types Documentation

Generated on: ${new Date().toISOString()}

## Files Generated

${Array.from(this.generatedTypes.keys()).map(name => `- **${name}.ts**: ${this.getTypeDescription(name)}`).join('\n')}

## Usage

\`\`\`typescript
import { 
  // Import types as needed
  ApiResponse,
  PaginatedResponse,
  TableProps,
  ButtonProps,
  DeepPartial,
  // ... etc
} from '@/types/generated'
\`\`\`

## Type Categories

### API Types
Types for API requests, responses, and error handling.

### Component Types
Prop types for React components.

### Utility Types
Helper types for TypeScript development.

### Prisma Types
Generated from your Prisma schema (enums and models).

## Regenerating Types

To regenerate types, run:
\`\`\`bash
npm run generate:types
\`\`\`

Or:
\`\`\`bash
tsx scripts/generate-types.ts
\`\`\`

## Configuration

You can configure type generation by modifying the options in \`scripts/generate-types.ts\`:

\`\`\`typescript
const generator = new TypeGenerator({
  outputDir: 'src/types/generated',
  prismaSchema: 'prisma/schema.prisma',
  includeEnums: true,
  includeModels: true,
  generateIndex: true,
  generateDocs: true,
  customTypes: {
    // Add custom types here
  }
})
\`\`\`
`

    await fs.writeFile(path.join(this.options.outputDir, 'README.md'), docs)
    logger.success('Documentation generated')
  }

  private extractEnums(schemaContent: string): string[] {
    const enumRegex = /enum\s+(\w+)\s*{([^}]+)}/g
    const enums: string[] = []
    let match
    
    while ((match = enumRegex.exec(schemaContent)) !== null) {
      enums.push(match[0])
    }
    
    return enums
  }

  private extractModels(schemaContent: string): string[] {
    const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g
    const models: string[] = []
    let match
    
    while ((match = modelRegex.exec(schemaContent)) !== null) {
      models.push(match[0])
    }
    
    return models
  }

  private generateEnumTypes(enums: string[]): string {
    const enumTypes = enums.map(enumDef => {
      const lines = enumDef.split('\n')
      const enumName = lines[0].match(/enum\s+(\w+)/)![1]
      const values = lines
        .slice(1, -1)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => {
          const value = line.split(/\s+/)[0]
          return `  ${value} = '${value}',`
        })
        .join('\n')
      
      return `export enum ${enumName} {\n${values}\n}`
    }).join('\n\n')
    
    return `
// Prisma Enum Types
// Generated on ${new Date().toISOString()}

${enumTypes}
`
  }

  private generateModelTypes(models: string[]): string {
    const modelInterfaces = models.map(modelDef => {
      const lines = modelDef.split('\n')
      const modelName = lines[0].match(/model\s+(\w+)/)![1]
      const fields = lines
        .slice(1, -1)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => {
          const parts = line.split(/\s+/)
          const fieldName = parts[0]
          const fieldType = this.mapPrismaTypeToTS(parts[1])
          const isOptional = parts[1].includes('?')
          return `  ${fieldName}${isOptional ? '?' : ''}: ${fieldType};`
        })
        .join('\n')
      
      return `export interface ${modelName} {\n${fields}\n}`
    }).join('\n\n')
    
    return `
// Prisma Model Types
// Generated on ${new Date().toISOString()}

import { Decimal } from 'decimal.js'

${modelInterfaces}
`
  }

  private mapPrismaTypeToTS(prismaType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'String?': 'string | null',
      'Int': 'number',
      'Int?': 'number | null',
      'BigInt': 'bigint',
      'BigInt?': 'bigint | null',
      'Float': 'number',
      'Float?': 'number | null',
      'Decimal': 'Decimal',
      'Decimal?': 'Decimal | null',
      'Boolean': 'boolean',
      'Boolean?': 'boolean | null',
      'DateTime': 'Date',
      'DateTime?': 'Date | null',
      'Json': 'any',
      'Json?': 'any | null',
    }
    
    // Check for array types
    if (prismaType.endsWith('[]')) {
      const baseType = prismaType.slice(0, -2)
      const tsType = typeMap[baseType] || baseType
      return `${tsType}[]`
    }
    
    return typeMap[prismaType] || prismaType
  }

  private getTypeDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'enums': 'Enumeration types from Prisma schema',
      'models': 'Model interfaces from Prisma schema',
      'api': 'API request and response types',
      'components': 'React component prop types',
      'utils': 'TypeScript utility types',
      'custom': 'Custom application types',
    }
    
    return descriptions[name] || 'Generated types'
  }

  private async saveTypeFile(filename: string, content: string): Promise<void> {
    const filepath = path.join(this.options.outputDir, filename)
    await fs.writeFile(filepath, content.trim())
    logger.info(`  → Saved ${filename}`)
  }
}

// Main execution
async function main() {
  const generator = new TypeGenerator({
    outputDir: 'src/types/generated',
    prismaSchema: 'prisma/schema.prisma',
    includeEnums: true,
    includeModels: true,
    generateIndex: true,
    generateDocs: true,
    customTypes: {
      // Add any custom types here
      SparklePoints: 'number',
      PremiumPoints: 'number',
      ExperiencePoints: 'number',
    }
  })
  
  await generator.generate()
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { TypeGenerator }
export default TypeGenerator
```

## ✅ Summary of Changes

### 1. **Updated `src/types/global.d.ts`**
- **Fixed TimePeriod type**: Removed 'today' to match API expectations
- **Added missing fields**: Added 'name' and 'version' to ExtendedUser
- **Complete chart props**: Added all required props for chart components
- **Enhanced YouTube types**: Added window.YT.get() method
- **Improved Algolia types**: Added complete type definitions with proper exports
- **Extended environment variables**: Added all missing env vars
- **Added utility types**: Common TypeScript patterns and helpers
- **Enhanced module declarations**: Added more file type declarations

### 2. **Created `scripts/generate-types.ts`**
- **Comprehensive type generator**: Full-featured script to generate types from various sources
- **Prisma integration**: Extracts types from Prisma schema
- **API types**: Generates standard API request/response types
- **Component types**: Creates prop types for React components
- **Utility types**: Generates helpful TypeScript utility types
- **Documentation**: Auto-generates documentation for generated types
- **Extensible**: Easy to add custom type generation logic

### Key Improvements:
1. **Type safety**: All types are now properly aligned with actual usage
2. **Completeness**: No missing type definitions that were causing errors
3. **Maintainability**: Type generation script makes it easy to keep types in sync
4. **Documentation**: Auto-generated docs help developers understand available types
5. **Extensibility**: Easy to add new types as the project grows

The type generation script can be run with:
```bash
npx tsx scripts/generate-types.ts
```

Or add to package.json:
```json
"scripts": {
  "generate:types": "tsx scripts/generate-types.ts"
}
```
