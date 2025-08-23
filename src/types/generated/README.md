# Generated Types Documentation

Generated on: 2025-08-23T12:43:09.514Z

## Statistics

- **Total Models**: 112
- **Total Enums**: 22
- **Total Fields**: 1923
- **Average Fields per Model**: 17

## Files Generated

- **enums.ts** (221 lines)
- **models.ts** (2266 lines)
- **json-types.ts** (254 lines)
- **validators.ts** (108 lines)
- **api.ts** (120 lines)
- **components.ts** (162 lines)
- **utils.ts** (65 lines)

## Model Field Counts

| Model | Field Count | Has Relations | Has JSON Fields |
|-------|-------------|---------------|-----------------|
| User | 132 | ✅ | ❌ |
| Post | 73 | ✅ | ✅ |
| Event | 57 | ✅ | ✅ |
| Group | 40 | ✅ | ✅ |
| Profile | 34 | ✅ | ✅ |
| WatchParty | 32 | ✅ | ✅ |
| Achievement | 31 | ✅ | ✅ |
| StoreItem | 31 | ✅ | ✅ |
| Comment | 30 | ✅ | ✅ |
| Report | 29 | ✅ | ✅ |
| Message | 28 | ✅ | ✅ |
| YoutubeChannel | 27 | ✅ | ✅ |
| Notification | 26 | ✅ | ✅ |
| ChatRoom | 26 | ✅ | ✅ |
| Trade | 25 | ✅ | ✅ |
| Quest | 25 | ✅ | ✅ |
| YoutubeVideo | 25 | ✅ | ✅ |
| FanArtSubmission | 25 | ✅ | ✅ |
| Conversation | 23 | ✅ | ✅ |
| CollaborativeSpace | 23 | ✅ | ✅ |

## Usage Examples

### Basic Import
```typescript
import { User, Post, Comment } from '@/types/generated'
import { UserRole, ContentType } from '@/types/generated'
```

### With Validation
```typescript
import { PostCreateSchema, validateInput } from '@/types/generated'

const result = validateInput(PostCreateSchema, data)
if (result.success) {
  // result.data is typed as PostCreateInput
  await createPost(result.data)
} else {
  // Handle validation errors
  console.error(result.errors)
}
```

### Using JSON Types
```typescript
import { ThemePreference, NotificationSettings } from '@/types/generated'

const theme: ThemePreference = {
  mode: 'dark',
  primaryColor: '#8B5CF6',
  accentColor: '#EC4899',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
}
```

## Regenerating Types

To regenerate types, run:
```bash
npm run generate:types:enhanced
```

Or directly:
```bash
npx tsx scripts/generate-types-enhanced.ts
```

## Configuration

Edit `scripts/generate-types-enhanced.ts` to customize generation:

```typescript
const generator = new EnhancedTypeGenerator({
  outputDir: 'src/types/generated',
  prismaSchema: 'prisma/schema.prisma',
  includeEnums: true,
  includeModels: true,
  generateJsonTypes: true,
  generateValidators: true,
})
```

## Important Notes

1. **DO NOT EDIT** generated files manually - changes will be lost on regeneration
2. **JSON Types** - Custom JSON field types are in `json-types.ts`
3. **Validation** - Runtime validation schemas are in `validators.ts`
4. **Relations** - All model relations are properly typed
5. **Decimal Values** - Uses `decimal.js` for precision

## Troubleshooting

### Missing Fields
If fields are missing, ensure your Prisma schema is valid:
```bash
npx prisma validate
```

### Type Errors
Regenerate Prisma client first:
```bash
npx prisma generate
```

### Import Issues
Ensure TypeScript paths are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/types/*": ["./src/types/*"]
    }
  }
}
```
