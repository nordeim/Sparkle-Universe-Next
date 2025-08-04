### 🔧 **Setup Instructions**

1. **Install additional dependencies**:
```bash
npm install socket.io socket.io-client @socket.io/redis-adapter
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install nodemailer @react-email/components
npm install bullmq
npm install swagger-ui-react openapi-types
npm install sharp uuid
```

2. **Environment variables to add**: 
```env
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=sparkle-universe-uploads
AWS_S3_REGION=us-east-1 
CDN_URL=https://cdn.sparkle-universe.com

# Email (SendGrid backup) 
SENDGRID_API_KEY=your-sendgrid-key
```

3. **Initialize services in your app**:
```typescript
// In your server initialization
import { initializeSocketServer } from '@/lib/socket/socket-server'
import { startJobProcessors, scheduleRecurringJobs } from '@/lib/jobs/job-processor'

// Initialize Socket.io (in custom server)
const httpServer = createServer(app)
initializeSocketServer(httpServer)

// Start job processors
startJobProcessors()
scheduleRecurringJobs()
```

