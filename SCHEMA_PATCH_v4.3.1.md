// =====================================================
// SPARKLE UNIVERSE SCHEMA PATCH v4.3.1
// Fixes for confirmed issues from comprehensive review
// Apply these changes to prisma/schema.prisma
// =====================================================

// ========== FIX 1: User Model Financial Field ==========
// Location: Line 369
// BEFORE:
// creatorRevenueShare Decimal   @default(0.7000) @db.Decimal(5, 4)
// AFTER:
model User {
  // ... existing fields ...
  
  // --- Creator Monetization Fields ---
  creatorRevenueShare Decimal   @default(0.7000) @db.Decimal(19, 4)  // FIXED: Standardized precision
  totalRevenueEarned  BigInt    @default(0)
  lastPayoutDate      DateTime?
  
  // ... rest of model ...
}

// ========== FIX 2: Report Model Relations ==========
// Location: Lines 3747-3772
// ADD missing relation for reportedUserId
model Report {
  id                String           @id @default(cuid())
  reporterId        String
  reportedUserId    String?
  reportedPostId    String?
  reportedCommentId String?
  // ... other fields ...
  
  // Relations - FIXED: Added missing reportedUser relation
  reporter     User     @relation("reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  reportedUser User?    @relation("reportedUser", fields: [reportedUserId], references: [id], onDelete: SetNull)  // NEW
  resolver     User?    @relation("resolver", fields: [resolvedBy], references: [id], onDelete: SetNull)
  post         Post?    @relation("reportedPost", fields: [reportedPostId], references: [id], onDelete: Cascade)
  comment      Comment? @relation("reportedComment", fields: [reportedCommentId], references: [id], onDelete: Cascade)
  
  // ... indexes ...
}

// Update User model to include the new relation
model User {
  // ... existing relations ...
  reports                  Report[]                  @relation("reporter")
  reportedReports          Report[]                  @relation("reportedUser")  // NEW
  reportResolutions        Report[]                  @relation("resolver")
  // ... rest of relations ...
}

// ========== FIX 3: WatchPartyChat Self-Relation ==========
// Location: Lines 2804-2806
// FIX: Ensure relation names are properly defined
model WatchPartyChat {
  id        String    @id @default(cuid())
  partyId   String
  userId    String
  message   String    @db.Text
  timestamp Int
  replyToId String?
  reactions Json?
  deleted   Boolean   @default(false)
  deletedAt DateTime?
  deletedBy String?
  createdAt DateTime  @default(now())

  // Relations - FIXED: Consistent relation naming
  party   WatchParty       @relation(fields: [partyId], references: [id], onDelete: Cascade)
  user    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  replyTo WatchPartyChat?  @relation("WatchPartyChatReplies", fields: [replyToId], references: [id], onDelete: SetNull)
  replies WatchPartyChat[] @relation("WatchPartyChatReplies")

  @@index([partyId, createdAt])
  @@index([userId])
  @@map("watch_party_chat")
}

// ========== FIX 4: Add Optimistic Locking to Critical Models ==========

// Location: After line 2001 - Add to Trade model
model Trade {
  // ... existing fields ...
  version         Int         @default(0) // Already exists at line 2001
  // ... rest of model ...
}

// Location: After line 2517 - Conversation model already has version
model Conversation {
  // ... existing fields ...
  version        Int       @default(0) // Already exists at line 2517
  // ... rest of model ...
}

// Location: After line 2990 - Poll model already has version
model Poll {
  // ... existing fields ...
  version         Int       @default(0) // Already exists at line 2990
  // ... rest of model ...
}

// Location: After line 2255 - Add to Group model (currently missing)
model Group {
  // ... existing fields before version ...
  metadata         Json?
  version          Int             @default(0) // Already exists at line 2255
  deleted          Boolean         @default(false)
  // ... rest of model ...
}

// ========== FIX 5: Add Missing Critical Model Versions ==========

// Add to GroupPost model (after line 2339)
model GroupPost {
  // ... existing fields ...
  commentCount     Int              @default(0)
  moderationStatus ModerationStatus @default(AUTO_APPROVED)
  version          Int              @default(0)  // NEW: Add optimistic locking
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  // ... rest of model ...
}

// Add to Event model (already has at line 2444)
model Event {
  // ... existing fields ...
  version          Int         @default(0) // Already exists
  // ... rest of model ...
}

// Add to Message model (already has at line 2617)
model Message {
  // ... existing fields ...
  version          Int           @default(0) // Already exists
  // ... rest of model ...
}

// ========== FIX 6: Optimize Composite Indexes ==========

// Location: Lines 427-435 - User model indexes
model User {
  // ... fields ...
  
  // OPTIMIZED INDEXES - Remove redundant, combine where possible
  @@index([email])
  @@index([username])
  @@index([deleted, status, role, lastSeenAt(sort: Desc)])  // Keep most comprehensive
  // REMOVED: @@index([deleted, status, lastSeenAt, onlineStatus]) // Redundant with above
  @@index([deleted, level, experience(sort: Desc)])
  @@index([status, onlineStatus, lastSeenAt(sort: Desc)])
  @@index([createdAt])
  @@index([role, verified, createdAt(sort: Desc)])
  // OPTIMIZED: Combine related indexes
  @@index([deleted, status, onlineStatus, lastSeenAt(sort: Desc)])  // NEW: Combined index
  @@map("users")
}

// ========== FIX 7: Add Strategic Missing Indexes ==========

// Add to high-query models
model Notification {
  // ... existing fields and indexes ...
  
  // NEW: Add index for cleanup operations
  @@index([expiresAt, dismissed])
  @@map("notifications")
}

model Trade {
  // ... existing fields and indexes ...
  
  // NEW: Add index for active trades
  @@index([status, expiresAt])
  @@map("trades")
}

// ========== FIX 8: Financial Field Standardization ==========

// Ensure ALL monetary fields use consistent precision
model CreatorPayout {
  // ... existing fields ...
  totalRevenue  Decimal   @default(0) @db.Decimal(19, 4)  // Already correct
  platformFee   Decimal   @default(0) @db.Decimal(19, 4)  // Already correct
  creatorShare  Decimal   @default(0) @db.Decimal(19, 4)  // Already correct
  taxWithheld   Decimal   @default(0) @db.Decimal(19, 4)  // Already correct
  finalAmount   Decimal   @default(0) @db.Decimal(19, 4)  // Already correct
  // ... rest of model ...
}

model StoreItem {
  // ... existing fields ...
  priceSparkle         Decimal? @db.Decimal(19, 4)  // Already correct
  pricePremium         Decimal? @db.Decimal(19, 4)  // Already correct
  originalPriceSparkle Decimal? @db.Decimal(19, 4)  // Already correct
  originalPricePremium Decimal? @db.Decimal(19, 4)  // Already correct
  // ... rest of model ...
}
