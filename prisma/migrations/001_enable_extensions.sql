-- migrations/001_enable_extensions.sql
-- Enable required PostgreSQL extensions for Sparkle Universe v4.3
-- IMPORTANT: This script has two parts - transactional and non-transactional

-- =====================================================
-- PART 1: Extensions (Transactional)
-- =====================================================
-- Run this part first
BEGIN;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp for UUID generation (if not using gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify extensions
SELECT 
    extname AS extension_name,
    extversion AS version,
    extnamespace::regnamespace AS schema
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp', 'pg_stat_statements')
ORDER BY extname;

COMMIT;

-- =====================================================
-- PART 2: System Configuration (Non-transactional)
-- =====================================================
-- Run these commands separately AFTER the transaction above
-- These MUST be run as superuser or with appropriate permissions

-- NOTE: Run each line separately in psql or your admin tool:
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';
-- ALTER SYSTEM SET pg_stat_statements.max = 10000;

-- After running ALTER SYSTEM commands:
-- 1. Restart PostgreSQL service
-- 2. Run: SELECT pg_reload_conf();
-- 3. Verify with: SHOW shared_preload_libraries;

-- =====================================================
-- PART 3: Verification Query
-- =====================================================
-- Run this after restart to verify pg_stat_statements is active
SELECT 
    name, 
    setting, 
    unit, 
    category 
FROM pg_settings 
WHERE name LIKE 'pg_stat_statements%'
ORDER BY name;
