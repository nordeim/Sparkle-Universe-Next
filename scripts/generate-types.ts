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
