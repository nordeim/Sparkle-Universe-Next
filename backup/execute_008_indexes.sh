#!/bin/bash
# execute_008_indexes.sh
# Specialized execution script for advanced indexes

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_USER="${DB_USER:-sparkle_user}"
DB_NAME="${DB_NAME:-sparkle_db}"

echo "================================================"
echo "Executing Advanced Indexes Migration"
echo "Database: $DB_NAME"
echo "================================================"

# Create a temporary file to split the SQL
TEMP_INDEXES="/tmp/008_indexes_part1.sql"
TEMP_FUNCTIONS="/tmp/008_indexes_part2.sql"

# Extract the non-transactional part (indexes)
sed -n '/^-- ===.*PART 1/,/^-- ===.*PART 2/p' migrations/008_advanced_indexes.sql | \
    sed '$ d' > "$TEMP_INDEXES"

# Extract the transactional part (functions/views)
sed -n '/^-- ===.*PART 2/,$ p' migrations/008_advanced_indexes.sql > "$TEMP_FUNCTIONS"

echo "Phase 1: Creating indexes (this may take several minutes)..."
echo "Creating partial indexes..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -v ON_ERROR_STOP=1 -f "$TEMP_INDEXES" 2>&1 | \
     grep -E "(CREATE INDEX|ERROR)" || true

echo ""
echo "Phase 2: Creating analysis functions and views..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -v ON_ERROR_STOP=1 -f "$TEMP_FUNCTIONS"

echo ""
echo "Phase 3: Analyzing tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
     -c "ANALYZE;"

echo ""
echo "Phase 4: Verification..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
SELECT 'Total Indexes Created' as metric, COUNT(*) as count 
FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

SELECT 'Index Types Distribution' as metric, amname, COUNT(*)
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
JOIN pg_am a ON a.oid = c.relam
WHERE c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY amname;

SELECT * FROM recommend_index_maintenance() LIMIT 10;
EOF

# Cleanup
rm -f "$TEMP_INDEXES" "$TEMP_FUNCTIONS"

echo ""
echo "================================================"
echo "Advanced Indexes Migration Complete!"
echo "================================================"
echo ""
echo "Post-deployment tasks:"
echo "1. Monitor index usage for 24-48 hours"
echo "2. Run: SELECT * FROM index_usage_stats; to check usage"
echo "3. Run: SELECT * FROM find_unused_indexes(); to identify unused indexes"
echo "4. Run: SELECT * FROM analyze_index_effectiveness(); for optimization insights"
