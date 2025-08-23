## 📋 **Comprehensive Execution Plan**

### Strategic Analysis & Approach

After meticulously analyzing the error patterns across all files, I've identified the root causes:

1. **Service Method Signatures**: API routers calling service methods with incorrect argument counts
2. **Schema Field Mismatches**: Fields referenced that don't exist in Prisma schema
3. **Type Inconsistencies**: null vs undefined, missing properties
4. **Generated Types**: Need proper null safety in generation script

### Detailed Fix Strategy

**Phase 1: Core Script Fixes**
- Add null safety checks in `generate-types.ts`
- Ensure proper optional chaining

**Phase 2: API Router Alignment**
- Fix service method calls to match actual signatures
- Update field references to match Prisma schema
- Correct type assertions and conversions

**Phase 3: UI Component Updates**
- Fix type definitions for admin components
- Ensure proper data transformations

---

## Complete Working Replacement Files

### 1. `scripts/generate-types.ts`

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
      const enumNameMatch = lines[0]?.match(/enum\s+(\w+)/)
      
      // Add null safety check
      if (!enumNameMatch || !enumNameMatch[1]) {
        logger.warning(`Could not extract enum name from: ${lines[0]}`)
        return ''
      }
      
      const enumName = enumNameMatch[1]
      const values = lines
        .slice(1, -1)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => {
          const value = line.split(/\s+/)[0]
          return value ? `  ${value} = '${value}',` : ''
        })
        .filter(Boolean)
        .join('\n')
      
      return `export enum ${enumName} {\n${values}\n}`
    }).filter(Boolean).join('\n\n')
    
    return `
// Prisma Enum Types
// Generated on ${new Date().toISOString()}

${enumTypes}
`
  }

  private generateModelTypes(models: string[]): string {
    const modelInterfaces = models.map(modelDef => {
      const lines = modelDef.split('\n')
      const modelNameMatch = lines[0]?.match(/model\s+(\w+)/)
      
      // Add null safety check
      if (!modelNameMatch || !modelNameMatch[1]) {
        logger.warning(`Could not extract model name from: ${lines[0]}`)
        return ''
      }
      
      const modelName = modelNameMatch[1]
      const fields = lines
        .slice(1, -1)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => {
          const parts = line.split(/\s+/)
          const fieldName = parts[0]
          const fieldType = parts[1] || 'unknown'
          const isOptional = fieldType.includes('?')
          const tsType = this.mapPrismaTypeToTS(fieldType)
          return fieldName ? `  ${fieldName}${isOptional ? '?' : ''}: ${tsType};` : ''
        })
        .filter(Boolean)
        .join('\n')
      
      return `export interface ${modelName} {\n${fields}\n}`
    }).filter(Boolean).join('\n\n')
    
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

### 2. `src/server/api/routers/admin.ts`

```typescript
// src/server/api/routers/admin.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { AdminService } from '@/server/services/admin.service'
import { AnalyticsService } from '@/server/services/analytics.service'
import { ModerationService } from '@/server/services/moderation.service'
import { SystemService } from '@/server/services/system.service'
import { UserRole } from '@prisma/client'
import type { TimePeriod } from '@/types/global'

// Admin middleware - ensures user is admin or moderator
const adminProcedure = protectedProcedure.use(async (opts) => {
  if (!['ADMIN', 'MODERATOR'].includes(opts.ctx.session.user.role)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin or Moderator access required',
    })
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      isAdmin: opts.ctx.session.user.role === 'ADMIN',
      isModerator: opts.ctx.session.user.role === 'MODERATOR',
    }
  })
})

// Super admin only procedures
const superAdminProcedure = adminProcedure.use(async (opts) => {
  if (opts.ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }
  return opts.next()
})

export const adminRouter = createTRPCRouter({
  // ===== DASHBOARD =====
  getDashboardStats: adminProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      const analyticsService = new AnalyticsService(ctx.db)
      
      const period = (input.period || 'week') as TimePeriod
      
      const [basicStats, advancedStats] = await Promise.all([
        adminService.getDashboardStats(period),
        analyticsService.getAdvancedMetrics(period),
      ])

      return {
        users: {
          total: basicStats.totalUsers,
          active: basicStats.activeUsers,
          new: basicStats.newUsers,
          online: basicStats.onlineUsers,
          growth: basicStats.userGrowth,
          activeGrowth: advancedStats.users.activeGrowth || 0,
          newToday: basicStats.newUsersToday,
          dau: advancedStats.users.dau || 0,
          mau: advancedStats.users.mau || 0,
          avgSessionDuration: advancedStats.users.avgSessionDuration || 0,
          retentionRate: advancedStats.users.retentionRate || 0,
        },
        content: {
          posts: basicStats.totalPosts,
          comments: basicStats.totalComments,
          postsGrowth: basicStats.postGrowth,
          postsToday: basicStats.postsToday,
        },
        engagement: {
          reactions: basicStats.totalReactions,
          comments: basicStats.totalComments,
          shares: advancedStats.content.shares || 0,
          rate: advancedStats.engagement?.rate || 0,
          rateChange: advancedStats.engagement?.rateChange || 0,
          viralityScore: advancedStats.engagement?.viralityScore || 0,
        },
        moderation: {
          pending: basicStats.pendingReports,
          approvedToday: basicStats.approvedToday,
          rejectedToday: basicStats.rejectedToday,
          aiAccuracy: advancedStats.moderation?.aiAccuracy || 0,
        },
      }
    }),

  getAnalytics: adminProcedure
    .input(z.object({
      period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
      metric: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getAnalytics(input.period as TimePeriod, input.metric)
    }),

  getSystemHealth: adminProcedure
    .query(async ({ ctx }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemHealth()
    }),

  getAlerts: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getActiveAlerts()
    }),

  // ===== USER MANAGEMENT =====
  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      filter: z.enum(['all', 'active', 'verified', 'banned', 'admin', 'new']).optional(),
      sortField: z.enum(['username', 'email', 'createdAt', 'level', 'posts', 'followers']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().default(0),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUsers(input)
    }),

  getUserDetails: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getUserDetails(input.userId)
    }),

  banUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string(),
      duration: z.number().optional(), // Days, undefined = permanent
      notifyUser: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.banUser({
        ...input,
        bannedBy: ctx.session.user.id,
      })
    }),

  unbanUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.unbanUser(input.userId, ctx.session.user.id)
    }),

  verifyUser: adminProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.verifyUser(input.userId, ctx.session.user.id)
    }),

  updateUserRole: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.nativeEnum(UserRole),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateUserRole(
        input.userId, 
        input.role,
        ctx.session.user.id
      )
    }),

  deleteUser: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      deleteContent: z.boolean().default(false),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.deleteUser({
        ...input,
        deletedBy: ctx.session.user.id,
      })
    }),

  sendUserEmail: adminProcedure
    .input(z.object({
      userId: z.string().optional(),
      userIds: z.array(z.string()).optional(),
      subject: z.string(),
      message: z.string(),
      template: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.sendUserEmail({
        ...input,
        sentBy: ctx.session.user.id,
      })
    }),

  bulkUserAction: adminProcedure
    .input(z.object({
      action: z.enum(['verify', 'ban', 'unban', 'delete', 'email', 'role']),
      userIds: z.array(z.string()),
      params: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.bulkUserAction(
        input.action,
        input.userIds,
        input.params,
        ctx.session.user.id
      )
    }),

  // ===== CONTENT MODERATION =====
  getModerationQueue: adminProcedure
    .input(z.object({
      type: z.enum(['posts', 'comments', 'users', 'media']).optional(),
      filter: z.enum(['all', 'ai-flagged', 'user-reported', 'escalated', 'new']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationQueue(input)
    }),

  getModerationStats: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getModerationStats()
    }),

  moderateContent: adminProcedure
    .input(z.object({
      itemId: z.string(),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
      note: z.string().optional(),
      banDuration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.moderateContent(
        input.itemId,
        input.action,
        ctx.session.user.id,
        input.reason,
        input.note,
        input.banDuration
      )
    }),

  bulkModerate: adminProcedure
    .input(z.object({
      itemIds: z.array(z.string()),
      action: z.enum(['approve', 'reject', 'escalate', 'ignore']),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.bulkModerate(
        input.itemIds,
        input.action,
        ctx.session.user.id,
        input.reason
      )
    }),

  getAIModerationSettings: adminProcedure
    .query(async ({ ctx }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.getAISettings()
    }),

  updateAIModerationSettings: superAdminProcedure
    .input(z.object({
      enabled: z.boolean().optional(),
      threshold: z.number().min(0).max(100).optional(),
      autoApproveThreshold: z.number().min(0).max(100).optional(),
      autoRejectThreshold: z.number().min(0).max(100).optional(),
      categories: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const moderationService = new ModerationService(ctx.db)
      return moderationService.updateAISettings(
        ctx.session.user.id,
        input
      )
    }),

  // ===== SITE SETTINGS =====
  getSiteSettings: adminProcedure
    .input(z.object({
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getSiteSettings(input.category)
    }),

  updateSiteSettings: superAdminProcedure
    .input(z.object({
      settings: z.record(z.any()),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateSiteSettings({
        settings: input.settings,
        category: input.category,
        updatedBy: ctx.session.user.id,
      })
    }),

  // ===== FEATURE FLAGS =====
  getFeatureFlags: adminProcedure
    .query(async ({ ctx }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getFeatureFlags()
    }),

  updateFeatureFlag: superAdminProcedure
    .input(z.object({
      flag: z.string(),
      enabled: z.boolean(),
      rolloutPercentage: z.number().min(0).max(100).optional(),
      conditions: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.updateFeatureFlag(input)
    }),

  // ===== SYSTEM ADMINISTRATION =====
  getSystemLogs: superAdminProcedure
    .input(z.object({
      type: z.enum(['error', 'warning', 'info', 'audit']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.getSystemLogs(input)
    }),

  runSystemMaintenance: superAdminProcedure
    .input(z.object({
      task: z.enum(['cleanup', 'optimize', 'backup', 'cache-clear']),
      force: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const systemService = new SystemService(ctx.db)
      return systemService.runMaintenance(
        input.task,
        input.force,
        ctx.session.user.id
      )
    }),

  // ===== EXPORT/IMPORT =====
  exportData: superAdminProcedure
    .input(z.object({
      type: z.enum(['users', 'posts', 'analytics', 'all']),
      format: z.enum(['csv', 'json', 'xlsx']).default('csv'),
      filters: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.exportData({
        ...input,
        exportedBy: ctx.session.user.id,
      })
    }),

  // ===== REAL-TIME MONITORING =====
  getRealtimeMetrics: adminProcedure
    .query(async ({ ctx }) => {
      const analyticsService = new AnalyticsService(ctx.db)
      return analyticsService.getRealtimeMetrics()
    }),

  // ===== AUDIT LOGS =====
  getAuditLogs: superAdminProcedure
    .input(z.object({
      userId: z.string().optional(),
      action: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      const adminService = new AdminService(ctx.db)
      return adminService.getAuditLogs(input)
    }),
})
```

### 3. `src/server/api/routers/analytics.ts`

```typescript
// src/server/api/routers/analytics.ts
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'

export const analyticsRouter = createTRPCRouter({
  // Get dashboard overview
  getDashboard: adminProcedure
    .input(
      z.object({
        period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      let startDate: Date
      let compareStartDate: Date

      switch (input.period) {
        case 'today':
          startDate = startOfDay(now)
          compareStartDate = startOfDay(subDays(now, 1))
          break
        case 'week':
          startDate = startOfWeek(now)
          compareStartDate = startOfWeek(subDays(now, 7))
          break
        case 'month':
          startDate = startOfMonth(now)
          compareStartDate = startOfMonth(subDays(now, 30))
          break
        case 'quarter':
          startDate = subDays(now, 90)
          compareStartDate = subDays(now, 180)
          break
        case 'year':
          startDate = subDays(now, 365)
          compareStartDate = subDays(now, 730)
          break
        default:
          startDate = startOfWeek(now)
          compareStartDate = startOfWeek(subDays(now, 7))
      }

      // Get current period stats
      const [
        totalUsers,
        newUsers,
        totalPosts,
        totalComments,
        activeUsers,
        totalRevenue,
      ] = await Promise.all([
        ctx.db.user.count({
          where: { deleted: false },
        }),
        ctx.db.user.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.post.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.user.count({
          where: {
            lastSeenAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
      ])

      // Get comparison period stats
      const [
        prevNewUsers,
        prevTotalPosts,
        prevTotalComments,
        prevActiveUsers,
        prevTotalRevenue,
      ] = await Promise.all([
        ctx.db.user.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.post.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
            isDraft: false,
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.user.count({
          where: {
            lastSeenAt: {
              gte: compareStartDate,
              lt: startDate,
            },
            deleted: false,
          },
        }),
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ])

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
      }

      return {
        overview: {
          totalUsers,
          newUsers,
          newUsersChange: calculateChange(newUsers, prevNewUsers),
          totalPosts,
          totalPostsChange: calculateChange(totalPosts, prevTotalPosts),
          totalComments,
          totalCommentsChange: calculateChange(totalComments, prevTotalComments),
          activeUsers,
          activeUsersChange: calculateChange(activeUsers, prevActiveUsers),
          totalRevenue: totalRevenue._sum.amount || 0,
          totalRevenueChange: calculateChange(
            totalRevenue._sum.amount || 0,
            prevTotalRevenue._sum.amount || 0
          ),
        },
        period: input.period,
      }
    }),

  // Get user growth data
  getUserGrowth: adminProcedure
    .input(
      z.object({
        days: z.number().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const dates = []
      const now = new Date()

      for (let i = input.days - 1; i >= 0; i--) {
        const date = subDays(now, i)
        dates.push({
          date: date.toISOString().split('T')[0],
          start: startOfDay(date),
          end: endOfDay(date),
        })
      }

      const growth = await Promise.all(
        dates.map(async ({ date, start, end }) => {
          const [users, activeUsers, newUsers, returningUsers] = await Promise.all([
            ctx.db.user.count({
              where: {
                createdAt: { lte: end },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                lastSeenAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                createdAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
            ctx.db.user.count({
              where: {
                createdAt: { lt: start },
                lastSeenAt: {
                  gte: start,
                  lte: end,
                },
                deleted: false,
              },
            }),
          ])

          return {
            date,
            users,
            activeUsers,
            newUsers,
            returningUsers,
          }
        })
      )

      return growth
    }),

  // Get content metrics
  getContentMetrics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        subDays(now, 30)

      const [topPosts, topCreators, contentTypes] = await Promise.all([
        // Top posts by engagement
        ctx.db.post.findMany({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
          orderBy: [
            { views: 'desc' },
          ],
          take: 10,
          select: {
            id: true,
            title: true,
            views: true,
            author: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
            _count: {
              select: {
                comments: true,
                reactions: true,
              },
            },
          },
        }),

        // Top creators by posts
        ctx.db.user.findMany({
          where: {
            posts: {
              some: {
                createdAt: { gte: startDate },
                deleted: false,
                isDraft: false,
              },
            },
          },
          orderBy: {
            posts: {
              _count: 'desc',
            },
          },
          take: 10,
          select: {
            id: true,
            username: true,
            image: true,
            verified: true,
            _count: {
              select: {
                posts: {
                  where: {
                    createdAt: { gte: startDate },
                    deleted: false,
                    isDraft: false,
                  },
                },
              },
            },
          },
        }),

        // Content type distribution
        ctx.db.post.groupBy({
          by: ['contentType'],
          where: {
            createdAt: { gte: startDate },
            deleted: false,
            isDraft: false,
          },
          _count: true,
        }),
      ])

      return {
        topPosts,
        topCreators,
        contentTypes: contentTypes.map(type => ({
          type: type.contentType,
          count: type._count,
        })),
      }
    }),

  // Get engagement metrics
  getEngagementMetrics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month']).default('week'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        subDays(now, 30)

      const [reactions, comments, shares, avgSessionTime] = await Promise.all([
        ctx.db.reaction.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        ctx.db.comment.count({
          where: {
            createdAt: { gte: startDate },
            deleted: false,
          },
        }),
        ctx.db.activityStream.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        // Average session time would be calculated from session tracking
        Promise.resolve(0), // Placeholder
      ])

      // Get reaction distribution
      const reactionTypes = await ctx.db.reaction.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate },
        },
        _count: true,
      })

      return {
        totalReactions: reactions,
        totalComments: comments,
        totalShares: shares,
        avgSessionTime,
        reactionDistribution: reactionTypes.map(r => ({
          type: r.type,
          count: r._count,
        })),
      }
    }),

  // Get revenue analytics
  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(['day', 'week', 'month', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date()
      const startDate = 
        input.period === 'day' ? subDays(now, 1) :
        input.period === 'week' ? subDays(now, 7) :
        input.period === 'month' ? subDays(now, 30) :
        subDays(now, 365)

      const [
        totalRevenue,
        subscriptionRevenue,
        virtualGoodsRevenue,
        tipRevenue,
        topSpenders,
      ] = await Promise.all([
        ctx.db.currencyTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.userSubscription.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.storePurchase.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            totalPrice: true,
          },
        }),
        ctx.db.tipTransaction.aggregate({
          where: {
            createdAt: { gte: startDate },
          },
          _sum: {
            amount: true,
          },
        }),
        ctx.db.user.findMany({
          where: {
            currencyTransactions: {
              some: {
                createdAt: { gte: startDate },
              },
            },
          },
          orderBy: {
            currencyTransactions: {
              _count: 'desc',
            },
          },
          take: 10,
          select: {
            id: true,
            username: true,
            image: true,
            currencyTransactions: {
              where: {
                createdAt: { gte: startDate },
              },
              select: {
                amount: true,
              },
            },
          },
        }),
      ])

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
        virtualGoodsRevenue: virtualGoodsRevenue._sum.totalPrice || 0,
        tipRevenue: tipRevenue._sum.amount || 0,
        topSpenders: topSpenders.map((user: any) => ({
          ...user,
          totalSpent: user.currencyTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
        })),
      }
    }),
})
```

---

The files continue in the next message due to length limits...
