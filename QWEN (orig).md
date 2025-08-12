# Sparkle Universe Next.js Project Guide

## 🌟 Project Overview

**Sparkle Universe** is a next-generation community platform designed exclusively for Sparkle YouTube fans. It combines blog forum functionality, social networking, YouTube integration, advanced gamification, and AI-powered features to create an immersive digital ecosystem.

### 🎯 Core Purpose
- **Primary Goal**: Premier global destination for Sparkle YouTube fans
- **Target Users**: 13-35 year old content creators and fans
- **Key Differentiators**: YouTube-native integration, real-time features, AI intelligence, advanced gamification

## 🏗️ Technical Architecture

### Tech Stack
```
Frontend: Next.js 15 + TypeScript 5 + Tailwind CSS 4
Backend: PostgreSQL 16 + Prisma ORM + tRPC
Real-time: Socket.io + Redis
Infrastructure: Vercel Edge Functions + Cloudflare CDN
AI/ML: OpenAI API + TensorFlow.js
```

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 4 with custom design system
- **Database**: PostgreSQL 16 with advanced indexing
- **ORM**: Prisma with full-text search and JSON support
- **API**: tRPC for type-safe APIs
- **Authentication**: NextAuth.js v5 with multi-provider OAuth
- **Real-time**: Socket.io with Redis adapter
- **State Management**: Zustand + React Query
- **UI Components**: shadcn/ui with custom Sparkle theme

## 📁 Project Structure

```
Sparkle-Universe-Next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (main)/            # Main application routes
│   │   ├── api/               # API routes
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── shared/           # Shared components
│   │   └── features/         # Feature-specific components
│   ├── server/               # Server-side code
│   │   ├── api/              # tRPC routers
│   │   ├── auth/             # Authentication logic
│   │   └── db/               # Database utilities
│   ├── lib/                  # Utility libraries
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   └── services/             # External services
├── prisma/                   # Database schema
├── public/                   # Static assets
├── docs/                     # Documentation
└── scripts/                  # Build and utility scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20.0.0+
- PostgreSQL 16+
- Redis (for caching and real-time features)
- npm 10.0.0+

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd Sparkle-Universe-Next
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Database setup**:
```bash
# Create database
createdb sparkle_universe

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

4. **Start development server**:
```bash
npm run dev
```

### Environment Variables

Required environment variables:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sparkle_universe"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
YOUTUBE_API_KEY="your-youtube-api-key"

# Redis
REDIS_URL="redis://localhost:6379"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-s3-bucket"
```

## 🗄️ Database Schema

### Core Models
- **User**: Complete user profile with gamification data
- **Post**: Rich content with versioning and collaboration
- **Comment**: Threaded discussions with YouTube timestamp support
- **Group**: Community groups with roles and permissions
- **Event**: Watch parties and community events
- **Achievement**: Gamification system with badges and rewards

### Key Features
- **Full-text search** across posts, comments, and users
- **JSON fields** for flexible metadata storage
- **Advanced indexing** for performance optimization
- **Soft deletes** for data recovery
- **Audit logging** for compliance

### Schema Highlights
```prisma
// User with gamification
model User {
  id              String   @id @default(cuid())
  username        String   @unique
  email           String   @unique
  experience      Int      @default(0)
  level           Int      @default(1)
  sparklePoints   Int      @default(0)
  reputationScore Int      @default(0)
  // ... 50+ fields for complete user profile
}

// Rich content posts
model Post {
  id            String      @id @default(cuid())
  content       Json        // Rich text with media
  youtubeVideoId String?
  reactions     Reaction[]
  comments      Comment[]
  stats         PostStats?
  // ... versioning, collaboration, SEO
}
```

## 🎮 Gamification System

### XP and Leveling
- **XP Sources**: Post creation (10 XP), comments (5 XP), likes received (2 XP)
- **Level Progression**: Exponential curve with 100 levels
- **Rewards**: Unlock features, badges, virtual currency

### Virtual Economy
- **Sparkle Points**: Earned through engagement, spent on virtual goods
- **Premium Points**: Purchased currency for exclusive items
- **Marketplace**: Avatar items, profile themes, special effects
- **Trading System**: User-to-user item trading with escrow

### Achievement System
- **Badge Categories**: Participation, Quality, Milestones, Special Events
- **Rarity Levels**: Common, Rare, Epic, Legendary, Mythic
- **Secret Achievements**: Hidden badges for discovery
- **Seasonal Events**: Limited-time achievements

## 📱 Features Overview

### Core Features
- **Rich Content Creation**: WYSIWYG editor with YouTube integration
- **Real-time Chat**: Global, group, and post-specific chat
- **Watch Parties**: Synchronized YouTube viewing with chat
- **Video Clips**: Create and share video segments
- **Collaborative Spaces**: Real-time document editing

### Social Features
- **Following System**: Follow users, topics, and tags
- **Direct Messaging**: Text, voice notes, and media sharing
- **Groups**: Public, private, and invite-only communities
- **Events**: Meetups, contests, and premieres
- **Notifications**: Real-time push and email notifications

### Creator Tools
- **Channel Analytics**: Subscriber growth and engagement metrics
- **Content Calendar**: Schedule posts around video releases
- **Monetization**: Direct fan funding and exclusive content
- **Collaboration Hub**: Find editors, artists, and moderators

### AI Features
- **Content Recommendations**: Personalized feed based on interests
- **Writing Assistant**: Grammar, style, and SEO suggestions
- **Automated Moderation**: AI-powered content filtering
- **Sentiment Analysis**: Community mood tracking

## 🎨 Design System

### Visual Identity
- **Theme**: Dark mode first with Sparkle-inspired aesthetics
- **Colors**: Purple (#8B5CF6), Pink (#EC4899), Emerald (#10B981)
- **Typography**: Inter for UI, custom Sparkle font for branding
- **Effects**: Glassmorphism, particle animations, glow effects

### Component Library
```typescript
// Example component usage
<SparkleButton 
  variant="primary" 
  size="lg"
  sparkleEffect={true}
>
  Create Post
</SparkleButton>

<GlassCard 
  glow={true}
  interactive={true}
>
  Content goes here
</GlassCard>
```

## 🔧 Development Workflow

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Type checking
```

### Git Workflow
1. **Feature branches**: `feature/your-feature-name`
2. **Commit conventions**: Follow conventional commits
3. **Pull requests**: Require review and CI passing
4. **Release tags**: Semantic versioning

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Testing**: Jest for unit tests, Playwright for E2E

## 📊 Performance & Monitoring

### Performance Targets
- **Page Load**: < 2 seconds on 3G
- **API Response**: < 100ms p95
- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: All green

### Monitoring Setup
- **Error Tracking**: Sentry integration
- **Performance**: Vercel Analytics
- **Database**: Query performance monitoring
- **Uptime**: 99.9% SLA with automated alerts

### Optimization Strategies
- **Code Splitting**: Route and component-based
- **Image Optimization**: Next.js Image with WebP
- **Caching**: Multi-layer caching strategy
- **CDN**: Global edge deployment

## 🔐 Security & Privacy

### Security Features
- **Authentication**: Multi-factor authentication
- **Authorization**: Role-based access control
- **Data Protection**: GDPR and COPPA compliance
- **Content Security**: XSS prevention, input sanitization
- **API Security**: Rate limiting, request validation

### Privacy Controls
- **Data Minimization**: Collect only necessary data
- **Right to Deletion**: Complete data removal
- **Consent Management**: Granular privacy controls
- **Audit Logging**: Comprehensive activity tracking

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### Environment Configuration
- **Production**: Automatic deployments from main branch
- **Staging**: Preview deployments for PRs
- **Development**: Local development with hot reload

### Infrastructure
- **Hosting**: Vercel with global edge network
- **Database**: PostgreSQL with read replicas
- **Cache**: Redis for session and real-time data
- **Storage**: AWS S3 with CloudFront CDN

## 📈 Analytics & Metrics

### Key Metrics
- **User Engagement**: DAU, WAU, session duration
- **Content Performance**: Views, likes, shares, comments
- **Technical Metrics**: Response times, error rates, uptime
- **Business Metrics**: Conversion rates, revenue, retention

### Analytics Integration
- **Vercel Analytics**: Web vitals and performance
- **Custom Events**: User interactions and conversions
- **A/B Testing**: Feature experimentation framework

## 🆘 Troubleshooting

### Common Issues
1. **Database connection errors**: Check DATABASE_URL format
2. **Authentication issues**: Verify OAuth credentials
3. **Build failures**: Check Node.js version and dependencies
4. **Performance issues**: Review database indexes and queries

### Debug Commands
```bash
# Check database connection
npm run db:status

# Debug authentication
npm run auth:debug

# Performance profiling
npm run analyze

# Check environment
npm run doctor
```

## 🤝 Contributing

### Contribution Guidelines
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Review Process
- **Automated checks**: CI/CD pipeline
- **Manual review**: Code quality and security
- **Testing**: Unit and E2E test coverage
- **Documentation**: Update relevant docs

## 📞 Support & Resources

### Documentation
- **API Documentation**: `/docs/api`
- **Component Storybook**: `/storybook`
- **Database Schema**: Prisma Studio at `/db-studio`

### Community
- **Discord**: [Sparkle Universe Discord](https://discord.gg/sparkle)
- **GitHub Issues**: [Report bugs and features](https://github.com/sparkle-universe/next/issues)
- **Email**: support@sparkleuniverse.com

### Development Resources
- **Design System**: [Figma File](https://figma.com/sparkle-design)
- **API Playground**: [GraphQL Playground](https://api.sparkleuniverse.com/playground)
- **Staging Environment**: [Staging Site](https://staging.sparkleuniverse.com)

---

## 🏁 Quick Start Checklist

- [ ] Clone repository and install dependencies
- [ ] Set up environment variables
- [ ] Create and configure database
- [ ] Run database migrations
- [ ] Start development server
- [ ] Create admin user
- [ ] Configure OAuth providers
- [ ] Test core features
- [ ] Review security settings
- [ ] Set up monitoring

**Welcome to Sparkle Universe! ✨**
