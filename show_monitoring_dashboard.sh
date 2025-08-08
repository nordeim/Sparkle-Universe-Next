# Full dashboard
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f prisma/migrations/dashboard.sql

# Health check
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -c "SELECT * FROM check_system_health();"

# Cache statistics
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -c "SELECT * FROM simple_cache_stats;"

# Find unused indexes
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -c "SELECT * FROM find_unused_indexes();"

# Monitor index usage over time
psql -h localhost -p 5433 -U sparkle_user -d sparkle_db -f prisma/migrations/index_monitor_over_time.sql

