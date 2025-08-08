-- AlterTable
ALTER TABLE "public"."trades" ALTER COLUMN "expiresAt" SET DEFAULT (CURRENT_TIMESTAMP + interval '7 days');
