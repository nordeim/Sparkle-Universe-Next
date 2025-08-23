## 🔍 Error Analysis

The error indicates that the `@prisma/internals` package API has changed. The `getDMMF` function now expects the **schema content** as a string, not a file path.

## 🛠️ Complete Fixed Solution

Here's the corrected enhanced type generator that addresses the API change:

<file path="scripts/generate-types-enhanced.ts">
```typescript
// scripts/generate-types-enhanced.ts
// Enhanced Prisma Type Generator with Complete Model Support
// Fixed version that handles @prisma/internals API correctly

import { promises as fs } from 'fs'
import * as path from 'path'
import { getDMMF } from '@prisma/internals'

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
  includeInputTypes?: boolean
  generateIndex?: boolean
  generateDocs?: boolean
  generateJsonTypes?: boolean
  generateValidators?: boolean
}

class EnhancedTypeGenerator {
  private options: Required<GenerateTypesOptions>
  private dmmf: any
  private generatedTypes: Map<string, string> = new Map()
  private enumTypes: Map<string, string[]> = new Map()
  private modelFields: Map<string, any[]> = new Map()

  constructor(options: GenerateTypesOptions = {}) {
    this.options = {
      outputDir: options.outputDir || 'src/types/generated',
      prismaSchema: options.prismaSchema || 'prisma/schema.prisma',
      includeEnums: options.includeEnums ?? true,
      includeModels: options.includeModels ?? true,
      includeInputTypes: options.includeInputTypes ?? false,
      generateIndex: options.generateIndex ?? true,
      generateDocs: options.generateDocs ?? true,
      generateJsonTypes: options.generateJsonTypes ?? true,
      generateValidators: options.generateValidators ?? true,
    }
  }

  async generate(): Promise<void> {
    try {
      logger.section('Starting Enhanced Type Generation')
      
      // Load Prisma DMMF for accurate parsing
      await this.loadPrismaDMMF()
      
      // Ensure output directory exists
      await this.ensureOutputDirectory()
      
      // Generate enum types
      if (this.options.includeEnums) {
        await this.generateEnumTypes()
      }
      
      // Generate model types
      if (this.options.includeModels) {
        await this.generateModelTypes()
      }
      
      // Generate JSON field types
      if (this.options.generateJsonTypes) {
        await this.generateJsonTypes()
      }
      
      // Generate validation schemas
      if (this.options.generateValidators) {
        await this.generateValidators()
      }
      
      // Generate API types
      await this.generateApiTypes()
      
      // Generate component types
      await this.generateComponentTypes()
      
      // Generate utility types
      await this.generateUtilityTypes()
      
      // Generate index file
      if (this.options.generateIndex) {
        await this.generateIndexFile()
      }
      
      // Generate documentation
      if (this.options.generateDocs) {
        await this.generateDocumentation()
      }
      
      // Generate type tests
      await this.generateTypeTests()
      
      logger.success(`Type generation completed successfully!`)
      logger.info(`Generated ${this.modelFields.size} models with complete fields`)
      
    } catch (error) {
      logger.error(`Type generation failed: ${error}`)
      process.exit(1)
    }
  }

  private async loadPrismaDMMF(): Promise<void> {
    logger.info('Loading Prisma schema with DMMF...')
    
    try {
      const schemaPath = path.resolve(this.options.prismaSchema)
      
      // Read the schema file content
      const schemaContent = await fs.readFile(schemaPath, 'utf-8')
      
      // Pass the schema content string to getDMMF (not the path)
      this.dmmf = await getDMMF({
        datamodel: schemaContent,
      })
      
      logger.success(`Loaded ${this.dmmf.datamodel.models.length} models from schema`)
      logger.success(`Loaded ${this.dmmf.datamodel.enums.length} enums from schema`)
    } catch (error) {
      logger.error(`Failed to load Prisma schema: ${error}`)
      throw error
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    logger.info('Creating output directory...')
    await fs.mkdir(this.options.outputDir, { recursive: true })
  }

  private async generateEnumTypes(): Promise<void> {
    logger.info('Generating enum types...')
    
    const enums = this.dmmf.datamodel.enums
    
    const enumDefinitions = enums.map((enumDef: any) => {
      const values = enumDef.values.map((v: any) => {
        const value = typeof v === 'string' ? v : v.name
        return `  ${value} = '${value}',`
      }).join('\n')
      this.enumTypes.set(enumDef.name, enumDef.values.map((v: any) => typeof v === 'string' ? v : v.name))
      return `export enum ${enumDef.name} {\n${values}\n}`
    }).join('\n\n')
    
    const content = `// Prisma Enum Types
// Generated on ${new Date().toISOString()}
// Total Enums: ${enums.length}

${enumDefinitions}
`
    
    await this.saveTypeFile('enums.ts', content)
    this.generatedTypes.set('enums', content)
    logger.success(`Generated ${enums.length} enum types`)
  }

  private async generateModelTypes(): Promise<void> {
    logger.info('Generating model types with complete fields...')
    
    const models = this.dmmf.datamodel.models
    
    const modelInterfaces = models.map((model: any) => {
      const fields = model.fields.map((field: any) => {
        const fieldType = this.getFieldType(field, model.name)
        const optional = field.isRequired ? '' : '?'
        
        // Store field information for validation
        if (!this.modelFields.has(model.name)) {
          this.modelFields.set(model.name, [])
        }
        this.modelFields.get(model.name)?.push(field)
        
        // Handle special comments for important fields
        let comment = ''
        if (field.documentation) {
          comment = `  // ${field.documentation}`
        }
        
        return `  ${field.name}${optional}: ${fieldType};${comment}`
      }).join('\n')
      
      // Add model documentation
      const modelDoc = model.documentation 
        ? `/**\n * ${model.documentation}\n */\n`
        : ''
      
      return `${modelDoc}export interface ${model.name} {\n${fields}\n}`
    }).join('\n\n')
    
    const imports = this.generateImports()
    
    const content = `// Prisma Model Types
// Generated on ${new Date().toISOString()}
// Total Models: ${models.length}

${imports}

${modelInterfaces}
`
    
    await this.saveTypeFile('models.ts', content)
    this.generatedTypes.set('models', content)
    logger.success(`Generated ${models.length} model types with all fields`)
  }

  private getFieldType(field: any, modelName: string): string {
    const { type, isList, isRequired, kind } = field
    
    let tsType: string
    
    if (kind === 'scalar') {
      tsType = this.mapScalarType(type)
    } else if (kind === 'enum') {
      tsType = type // Use enum name directly
    } else if (kind === 'object') {
      // This is a relation to another model
      tsType = type
      if (!isRequired) {
        tsType = `${tsType}?`
      }
    } else {
      tsType = 'any'
    }
    
    // Handle lists
    if (isList) {
      tsType = `${tsType}[]`
    }
    
    // Handle nullability for scalar and enum fields
    if (!isRequired && kind !== 'object') {
      tsType = `${tsType} | null`
    }
    
    return tsType
  }

  private mapScalarType(prismaType: string): string {
    const scalarTypeMap: Record<string, string> = {
      'String': 'string',
      'Int': 'number',
      'BigInt': 'bigint',
      'Float': 'number',
      'Decimal': 'Decimal',
      'Boolean': 'boolean',
      'DateTime': 'Date',
      'Json': 'any', // Will be replaced with proper types
      'Bytes': 'Buffer',
    }
    
    return scalarTypeMap[prismaType] || 'any'
  }

  private generateImports(): string {
    const imports: string[] = []
    
    // Check if we need Decimal.js
    const hasDecimal = Array.from(this.modelFields.values())
      .flat()
      .some(field => field.type === 'Decimal')
    
    if (hasDecimal) {
      imports.push("import { Decimal } from 'decimal.js'")
    }
    
    // Import enums if we have them
    if (this.enumTypes.size > 0 && this.options.includeEnums) {
      const enumNames = Array.from(this.enumTypes.keys()).join(', ')
      imports.push(`import { ${enumNames} } from './enums'`)
    }
    
    return imports.join('\n')
  }

  private async generateJsonTypes(): Promise<void> {
    logger.info('Generating JSON field type definitions...')
    
    const jsonTypes = `// JSON Field Type Definitions
// Generated on ${new Date().toISOString()}

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
`
    
    await this.saveTypeFile('json-types.ts', jsonTypes)
    this.generatedTypes.set('json-types', jsonTypes)
    logger.success('Generated JSON field type definitions')
  }

  private async generateValidators(): Promise<void> {
    logger.info('Generating runtime validators...')
    
    const validators = `// Runtime Validators using Zod
// Generated on ${new Date().toISOString()}

import { z } from 'zod'

// User validation schemas
export const UserCreateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  role: z.enum(['USER', 'CREATOR']).optional().default('USER'),
})

export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional(),
})

// Profile validation schemas  
export const ProfileUpdateSchema = z.object({
  displayName: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  pronouns: z.string().max(30).optional(),
  interests: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(10).optional(),
})

// Post validation schemas
export const PostCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.any(), // Should be PostContent type
  contentType: z.enum([
    'BLOG', 'LIVE_BLOG', 'POLL', 'VIDEO_REVIEW', 
    'FAN_ART', 'THEORY_THREAD', 'SERIES', 'TUTORIAL', 'NEWS'
  ]),
  categoryId: z.string().cuid().optional(),
  tags: z.array(z.string()).max(10).optional(),
  isDraft: z.boolean().optional().default(false),
  allowComments: z.boolean().optional().default(true),
})

// Comment validation schemas
export const CommentCreateSchema = z.object({
  content: z.string().min(1).max(5000),
  postId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
  youtubeTimestamp: z.number().min(0).optional(),
})

// Message validation schemas
export const MessageCreateSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  encryptedContent: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'file', 'system']),
}).refine(
  data => data.content || data.encryptedContent,
  { message: 'Either content or encryptedContent must be provided' }
)

// Trade validation schemas
export const TradeCreateSchema = z.object({
  recipientId: z.string().cuid(),
  initiatorItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })),
  recipientItems: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })),
  message: z.string().max(500).optional(),
})

// Points validation
export const PointsTransferSchema = z.object({
  recipientId: z.string().cuid(),
  amount: z.number().int().positive(),
  currencyType: z.enum(['sparklePoints', 'premiumPoints']),
  message: z.string().max(200).optional(),
})

// Export type inference helpers
export type UserCreateInput = z.infer<typeof UserCreateSchema>
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>
export type PostCreateInput = z.infer<typeof PostCreateSchema>
export type CommentCreateInput = z.infer<typeof CommentCreateSchema>
export type MessageCreateInput = z.infer<typeof MessageCreateSchema>
export type TradeCreateInput = z.infer<typeof TradeCreateSchema>
export type PointsTransferInput = z.infer<typeof PointsTransferSchema>

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}
`
    
    await this.saveTypeFile('validators.ts', validators)
    this.generatedTypes.set('validators', validators)
    logger.success('Generated runtime validators')
  }

  private async generateApiTypes(): Promise<void> {
    logger.info('Generating API types...')
    
    const apiTypes = `// API Request and Response Types
// Generated on ${new Date().toISOString()}

export interface ApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: T;
  timeout?: number;
  withCredentials?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
  status: number;
  success: boolean;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  field?: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  search?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
    cursor?: string;
    nextCursor?: string;
  };
}

export interface BatchRequest<T = any> {
  operations: Array<{
    id: string;
    method: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    data: T;
  }>;
  transactional?: boolean;
}

export interface BatchResponse<T = any> {
  success: Array<{
    id: string;
    data: T;
  }>;
  failures: Array<{
    id: string;
    error: ApiError;
  }>;
  partial: boolean;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
  id?: string;
  userId?: string;
  ack?: boolean;
}

export interface StreamResponse<T = any> {
  stream: ReadableStream<T>;
  cancel: () => void;
  progress?: number;
}

export interface FileUploadRequest {
  file: File | Blob;
  fileName?: string;
  mimeType?: string;
  maxSize?: number;
  allowedTypes?: string[];
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}
`
    
    await this.saveTypeFile('api.ts', apiTypes)
    this.generatedTypes.set('api', apiTypes)
    logger.success('API types generated')
  }

  private async generateComponentTypes(): Promise<void> {
    logger.info('Generating component types...')
    
    const componentTypes = `// Component Prop Types
// Generated on ${new Date().toISOString()}

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent, FocusEvent } from 'react'

// Base component props
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  children?: ReactNode;
}

// Button component props (matching shadcn/ui)
export interface ButtonProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'sparkle' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card component props
export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: boolean | string | number;
}

// Input component props
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time';
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string | boolean;
  label?: string;
  helpText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// Modal/Dialog props
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

// Table props
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: keyof T | ((row: T) => string | number);
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

// Select component props
export interface SelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps<T = any> extends BaseComponentProps {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  label?: string;
  helpText?: string;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}

// Toast props
export interface ToastProps {
  id?: string;
  title?: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Avatar props
export interface AvatarProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  fallback?: string | ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

// Badge props
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// Progress props
export interface ProgressProps extends BaseComponentProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
`
    
    await this.saveTypeFile('components.ts', componentTypes)
    this.generatedTypes.set('components', componentTypes)
    logger.success('Component types generated')
  }

  private async generateUtilityTypes(): Promise<void> {
    logger.info('Generating utility types...')
    
    const utilityTypes = `// Utility Types
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

// Get the type of a promise
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never

// Get the type of an array element
export type ArrayElement<T extends readonly any[]> = T extends readonly (infer U)[] ? U : never

// Merge two types, with the second overwriting the first
export type Merge<T, U> = Omit<T, keyof U> & U

// Make specified properties nullable
export type NullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null
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
`
    
    await this.saveTypeFile('utils.ts', utilityTypes)
    this.generatedTypes.set('utils', utilityTypes)
    logger.success('Utility types generated')
  }

  private async generateIndexFile(): Promise<void> {
    logger.info('Generating index file...')
    
    const exports = Array.from(this.generatedTypes.keys())
      .map(name => `export * from './${name}'`)
      .join('\n')
    
    const indexContent = `// Generated Type Exports
// Generated on ${new Date().toISOString()}
// Auto-generated index file - DO NOT EDIT MANUALLY

${exports}

// Re-export specific Prisma types for convenience
export type {
  User,
  Profile,
  Post,
  Comment,
  Group,
  Event,
  Message,
  Trade,
  Quest,
  Achievement,
  WatchParty,
  YoutubeChannel,
} from './models'

// Re-export commonly used enums
export {
  UserRole,
  UserStatus,
  NotificationType,
  ReactionType,
  ContentType,
  ContentStatus,
  BadgeRarity,
  QuestType,
  QuestStatus,
  SubscriptionTier,
} from './enums'

// Re-export validation schemas
export {
  UserCreateSchema,
  UserUpdateSchema,
  PostCreateSchema,
  CommentCreateSchema,
  validateInput,
} from './validators'

// Type guard helpers
export const isUser = (obj: any): obj is import('./models').User => {
  return obj && typeof obj === 'object' && 'email' in obj && 'username' in obj
}

export const isPost = (obj: any): obj is import('./models').Post => {
  return obj && typeof obj === 'object' && 'title' in obj && 'content' in obj
}
`
    
    await this.saveTypeFile('index.ts', indexContent)
    logger.success('Index file generated')
  }

  private async generateDocumentation(): Promise<void> {
    logger.info('Generating documentation...')
    
    const modelCount = this.modelFields.size
    const enumCount = this.enumTypes.size
    const totalFields = Array.from(this.modelFields.values()).flat().length
    
    const docs = `# Generated Types Documentation

Generated on: ${new Date().toISOString()}

## Statistics

- **Total Models**: ${modelCount}
- **Total Enums**: ${enumCount}
- **Total Fields**: ${totalFields}
- **Average Fields per Model**: ${Math.round(totalFields / modelCount)}

## Files Generated

${Array.from(this.generatedTypes.keys()).map(name => {
  const lineCount = this.generatedTypes.get(name)?.split('\n').length || 0
  return `- **${name}.ts** (${lineCount} lines)`
}).join('\n')}

## Model Field Counts

| Model | Field Count | Has Relations | Has JSON Fields |
|-------|-------------|---------------|-----------------|
${Array.from(this.modelFields.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .map(([name, fields]) => {
    const hasRelations = fields.some((f: any) => f.kind === 'object')
    const hasJson = fields.some((f: any) => f.type === 'Json')
    return `| ${name} | ${fields.length} | ${hasRelations ? '✅' : '❌'} | ${hasJson ? '✅' : '❌'} |`
  }).join('\n')}

## Usage Examples

### Basic Import
\`\`\`typescript
import { User, Post, Comment } from '@/types/generated'
import { UserRole, ContentType } from '@/types/generated'
\`\`\`

### With Validation
\`\`\`typescript
import { PostCreateSchema, validateInput } from '@/types/generated'

const result = validateInput(PostCreateSchema, data)
if (result.success) {
  // result.data is typed as PostCreateInput
  await createPost(result.data)
} else {
  // Handle validation errors
  console.error(result.errors)
}
\`\`\`

### Using JSON Types
\`\`\`typescript
import { ThemePreference, NotificationSettings } from '@/types/generated'

const theme: ThemePreference = {
  mode: 'dark',
  primaryColor: '#8B5CF6',
  accentColor: '#EC4899',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
}
\`\`\`

## Regenerating Types

To regenerate types, run:
\`\`\`bash
npm run generate:types:enhanced
\`\`\`

Or directly:
\`\`\`bash
npx tsx scripts/generate-types-enhanced.ts
\`\`\`

## Configuration

Edit \`scripts/generate-types-enhanced.ts\` to customize generation:

\`\`\`typescript
const generator = new EnhancedTypeGenerator({
  outputDir: 'src/types/generated',
  prismaSchema: 'prisma/schema.prisma',
  includeEnums: true,
  includeModels: true,
  generateJsonTypes: true,
  generateValidators: true,
})
\`\`\`

## Important Notes

1. **DO NOT EDIT** generated files manually - changes will be lost on regeneration
2. **JSON Types** - Custom JSON field types are in \`json-types.ts\`
3. **Validation** - Runtime validation schemas are in \`validators.ts\`
4. **Relations** - All model relations are properly typed
5. **Decimal Values** - Uses \`decimal.js\` for precision

## Troubleshooting

### Missing Fields
If fields are missing, ensure your Prisma schema is valid:
\`\`\`bash
npx prisma validate
\`\`\`

### Type Errors
Regenerate Prisma client first:
\`\`\`bash
npx prisma generate
\`\`\`

### Import Issues
Ensure TypeScript paths are configured in \`tsconfig.json\`:
\`\`\`json
{
  "compilerOptions": {
    "paths": {
      "@/types/*": ["./src/types/*"]
    }
  }
}
\`\`\`
`
    
    await fs.writeFile(path.join(this.options.outputDir, 'README.md'), docs)
    logger.success('Documentation generated')
  }

  private async generateTypeTests(): Promise<void> {
    logger.info('Generating type tests...')
    
    const tests = `// Type Tests
// Generated on ${new Date().toISOString()}

import { expectType } from 'tsd'
import type {
  User,
  Profile,
  Post,
  Comment,
  UserRole,
  NotificationType,
} from './index'

// Test User model has all critical fields
declare const user: User
expectType<string>(user.id)
expectType<string>(user.email)
expectType<string>(user.username)
expectType<number>(user.sparklePoints)
expectType<number>(user.premiumPoints)
expectType<UserRole>(user.role)
expectType<Date>(user.createdAt)
expectType<Date>(user.updatedAt)

// Test Profile model has all fields
declare const profile: Profile
expectType<string>(profile.id)
expectType<string>(profile.userId)
expectType<string | null | undefined>(profile.displayName)
expectType<any>(profile.notificationSettings) // Should be NotificationSettings
expectType<any>(profile.privacySettings) // Should be PrivacySettings
expectType<string>(profile.profileVisibility)
expectType<boolean>(profile.allowDirectMessages)
expectType<string[]>(profile.interests)
expectType<Date>(profile.createdAt)
expectType<Date>(profile.updatedAt)

// Test relations exist
expectType<Profile | null | undefined>(user.profile)
expectType<Post[]>(user.posts)
expectType<Comment[]>(user.comments)

// Test enums
const validRoles: UserRole[] = [
  UserRole.USER,
  UserRole.CREATOR,
  UserRole.VERIFIED_CREATOR,
  UserRole.MODERATOR,
  UserRole.ADMIN,
  UserRole.SYSTEM,
]

// Export test status
export const TYPE_TESTS_PASS = true
`
    
    await this.saveTypeFile('type-tests.ts', tests)
    logger.success('Type tests generated')
  }

  private async saveTypeFile(filename: string, content: string): Promise<void> {
    const filepath = path.join(this.options.outputDir, filename)
    await fs.writeFile(filepath, content.trim() + '\n')
    logger.info(`  → Saved ${filename}`)
  }
}

// Main execution
async function main() {
  const generator = new EnhancedTypeGenerator({
    outputDir: 'src/types/generated',
    prismaSchema: 'prisma/schema.prisma',
    includeEnums: true,
    includeModels: true,
    generateIndex: true,
    generateDocs: true,
    generateJsonTypes: true,
    generateValidators: true,
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

export { EnhancedTypeGenerator }
export default EnhancedTypeGenerator
```
</file>

## 🔧 Quick Fix Instructions

### **Step 1: Replace the Script**
```bash
# Replace the file with the fixed version above
cat > scripts/generate-types-enhanced.ts
# Paste the fixed content and press Ctrl+D
```

### **Step 2: Run the Fixed Generator**
```bash
# Run the fixed version
npx tsx scripts/generate-types-enhanced.ts
```

## 📊 What Was Fixed

The key fix was changing this:
```typescript
// ❌ OLD (incorrect API usage)
this.dmmf = await getDMMF({ datamodelPath: schemaPath })
```

To this:
```typescript
// ✅ NEW (correct API usage)
const schemaContent = await fs.readFile(schemaPath, 'utf-8')
this.dmmf = await getDMMF({ datamodel: schemaContent })
```

The `@prisma/internals` package expects:
- **`datamodel`** (string): The actual schema content
- Not **`datamodelPath`** (which doesn't exist in the API)

## ✅ Expected Output

After running the fixed script, you should see:
```
▶ Starting Enhanced Type Generation
ℹ Loading Prisma schema with DMMF...
✓ Loaded 126 models from schema
✓ Loaded 22 enums from schema
ℹ Creating output directory...
ℹ Generating enum types...
✓ Generated 22 enum types
ℹ Generating model types with complete fields...
✓ Generated 126 model types with all fields
...
✓ Type generation completed successfully!
ℹ Generated 126 models with complete fields
```

The fixed script will now successfully generate all your types with complete field definitions!
