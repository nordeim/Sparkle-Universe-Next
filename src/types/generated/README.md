
# Generated Types Documentation

Generated on: 2025-08-23T09:12:06.761Z

## Files Generated

- **enums.ts**: Enumeration types from Prisma schema
- **models.ts**: Model interfaces from Prisma schema
- **api.ts**: API request and response types
- **components.ts**: React component prop types
- **utils.ts**: TypeScript utility types
- **custom.ts**: Custom application types

## Usage

```typescript
import { 
  // Import types as needed
  ApiResponse,
  PaginatedResponse,
  TableProps,
  ButtonProps,
  DeepPartial,
  // ... etc
} from '@/types/generated'
```

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
```bash
npm run generate:types
```

Or:
```bash
tsx scripts/generate-types.ts
```

## Configuration

You can configure type generation by modifying the options in `scripts/generate-types.ts`:

```typescript
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
```
