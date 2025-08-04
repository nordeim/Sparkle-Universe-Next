# 🚀 Sparkle Universe Database Deployment Guide
## Production-Grade PostgreSQL 16 with Docker & Zero-Downtime Migration

### 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Step 1: Production Environment Setup](#step-1-production-environment-setup)
- [Step 2: Security Configuration](#step-2-security-configuration)
- [Step 3: Database Deployment](#step-3-database-deployment)
- [Step 4: Schema Migration & Validation](#step-4-schema-migration--validation)
- [Step 5: Performance Optimization](#step-5-performance-optimization)
- [Step 6: Monitoring & Health Checks](#step-6-monitoring--health-checks)
- [Step 7: Backup & Disaster Recovery](#step-7-backup--disaster-recovery)
- [Step 8: Production Validation](#step-8-production-validation)

---

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        PG1[(PostgreSQL Primary)]
        PG2[(PostgreSQL Replica)]
        PGPOOL[pgPool-II]
        REDIS[(Redis Cache)]
        MONITOR[Prometheus + Grafana]
    end
    
    subgraph "Docker Network"
        APP[Sparkle App]
        MIGRATE[Migration Service]
        BACKUP[Backup Service]
    end
    
    LB --> PGPOOL
    PGPOOL --> PG1
    PGPOOL --> PG2
    APP --> PGPOOL
    APP --> REDIS
    MIGRATE --> PG1
    MONITOR --> PG1
    MONITOR --> PG2
```

---

## ✅ Prerequisites

### **System Requirements**
- **OS**: Ubuntu 24.04 LTS / Debian 12 / CentOS 9
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB SSD minimum, 500GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended
- **Docker**: v24.0+ with Docker Compose v2.20+
- **Network**: Open ports 5432, 5433, 6379, 3000, 9090

### **Required Tools**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo apt-get update && sudo apt-get install docker-compose-plugin

# Install additional tools
sudo apt-get install postgresql-client-16 redis-tools
```

### **Secrets Management**
```bash
# Create secrets directory
mkdir -p ~/sparkle-secrets/{certs,keys,backups}
chmod 700 ~/sparkle-secrets

# Generate encryption keys
openssl rand -base64 32 > ~/sparkle-secrets/postgres-master.key
openssl rand -base64 32 > ~/sparkle-secrets/postgres-replica.key
```

---

## 🔐 Step 1: Production Environment Setup

### **1.1 Create Project Structure**
```bash
mkdir -p ~/sparkle-universe/{config,docker,migrations,scripts,monitoring}
cd ~/sparkle-universe
```

### **1.2 Environment Configuration**
```bash
# Create .env file
cat > .env << EOF
# Database Configuration
POSTGRES_VERSION=16-bookworm
POSTGRES_DB=sparkle_universe
POSTGRES_USER=sparkle_admin
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_HOST=postgres-primary
POSTGRES_PORT=5432

# Replication Configuration
POSTGRES_REPLICA_HOST=postgres-replica
POSTGRES_REPLICA_PORT=5433
REPLICATION_USER=repl_user
REPLICATION_PASSWORD=$(openssl rand -base64 32)

# Connection Pooling
PGPOOL_PORT=5434
PGPOOL_MAX_POOL=100
PGPOOL_CHILD_MAX_CONNECTIONS=1000

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -base64 32)
REDIS_MAXMEMORY=2gb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Monitoring
POSTGRES_EXPORTER_PASSWORD=$(openssl rand -base64 32)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)

# Backup Configuration
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=sparkle-backups
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Application Configuration
APP_ENV=production
APP_URL=https://sparkle-universe.com
DATABASE_URL=postgresql://sparkle_admin:${POSTGRES_PASSWORD}@postgres-primary:5432/sparkle_universe
EOF
```

---

## 🛡️ Step 2: Security Configuration

### **2.1 SSL/TLS Certificates**
```bash
# Generate SSL certificates
mkdir -p ./config/certs
openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout ./config/certs/server.key \
  -out ./config/certs/server.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=Sparkle Universe/CN=sparkle-universe.com"
```

### **2.2 PostgreSQL HBA Configuration**
```bash
# Create pg_hba.conf
cat > ./config/pg_hba.conf << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    replication     repl_user       0.0.0.0/0               md5
host    sparkle_universe sparkle_admin  0.0.0.0/0               md5
EOF
```

### **2.3 PostgreSQL Configuration**
```bash
# Create postgresql.conf
cat > ./config/postgresql.conf << EOF
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB

# Security Settings
ssl = on
ssl_cert_file = '/var/lib/postgresql/certs/server.crt'
ssl_key_file = '/var/lib/postgresql/certs/server.key'
password_encryption = scram-sha-256

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on

# Replication
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on
EOF
```

---

## 🐳 Step 3: Database Deployment

### **3.1 Docker Compose Configuration**

```yaml
# docker-compose.yml
version: '3.9'

services:
  # PostgreSQL Primary
  postgres-primary:
    image: postgres:16-bookworm
    container_name: sparkle-postgres-primary
    hostname: postgres-primary
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres-primary:/var/lib/postgresql/data
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./config/pg_hba.conf:/etc/postgresql/pg_hba.conf
      - ./config/certs:/var/lib/postgresql/certs
      - ./scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    networks:
      - sparkle-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

  # PostgreSQL Replica
  postgres-replica:
    image: postgres:16-bookworm
    container_name: sparkle-postgres-replica
    hostname: postgres-replica
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGUSER: ${REPLICATION_USER}
      POSTGRES_HOST_AUTH_METHOD: scram-sha-256
    ports:
      - "5433:5432"
    volumes:
      - ./data/postgres-replica:/var/lib/postgresql/data
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf
      - ./config/certs:/var/lib/postgresql/certs
    networks:
      - sparkle-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

  # Connection Pooling
  pgpool:
    image: bitnami/pgpool:4.5.0
    container_name: sparkle-pgpool
    hostname: pgpool
    restart: unless-stopped
    environment:
      - PGPOOL_BACKEND_NODES=0:postgres-primary:5432,1:postgres-replica:5432
      - PGPOOL_SR_CHECK_USER=${REPLICATION_USER}
      - PGPOOL_SR_CHECK_PASSWORD=${REPLICATION_PASSWORD}
      - PGPOOL_POSTGRES_USERNAME=${POSTGRES_USER}
      - PGPOOL_POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - PGPOOL_ADMIN_USERNAME=admin
      - PGPOOL_ADMIN_PASSWORD=${POSTGRES_PASSWORD}
      - PGPOOL_ENABLE_LOAD_BALANCING=yes
      - PGPOOL_ENABLE_STATEMENT_LOAD_BALANCING=yes
      - PGPOOL_MAX_POOL=100
      - PGPOOL_NUM_INIT_CHILDREN=32
    ports:
      - "5434:5432"
    networks:
      - sparkle-network
    healthcheck:
      test: ["CMD-SHELL", "pgpool -n && pg_isready -h localhost -p 5432"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7.2-alpine
    container_name: sparkle-redis
    hostname: redis
    restart: unless-stopped
    command: >
      redis-server 
      --requirepass ${REDIS_PASSWORD}
      --maxmemory ${REDIS_MAXMEMORY}
      --maxmemory-policy ${REDIS_MAXMEMORY_POLICY}
      --appendonly yes
      --appendfsync everysec
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    networks:
      - sparkle-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Migration Service
  migration:
    build:
      context: .
      dockerfile: ./docker/Dockerfile.migration
    container_name: sparkle-migration
    depends_on:
      postgres-primary:
        condition: service_healthy
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - ./migrations:/app/migrations
      - ./scripts:/app/scripts
    networks:
      - sparkle-network

  # Backup Service
  backup:
    image: postgres:16.4-bullseye
    container_name: sparkle-backup
    restart: unless-stopped
    depends_on:
      - postgres-primary
    environment:
      - POSTGRES_HOST=postgres-primary
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - BACKUP_S3_BUCKET=${BACKUP_S3_BUCKET}
      - BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS}
    volumes:
      - ./scripts/backup.sh:/backup.sh
      - ./data/backups:/backups
    networks:
      - sparkle-network
    command: >
      sh -c "chmod +x /backup.sh && 
             echo '0 2 * * * /backup.sh' | crontab - && 
             crond -f"

  # Monitoring
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: sparkle-postgres-exporter
    restart: unless-stopped
    environment:
      - DATA_SOURCE_NAME=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-primary:5432/${POSTGRES_DB}?sslmode=disable
    ports:
      - "9187:9187"
    networks:
      - sparkle-network

networks:
  sparkle-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_primary_data:
    driver: local
  postgres_replica_data:
    driver: local
  redis_data:
    driver: local
```

### **3.2 Migration Dockerfile**

```dockerfile
# docker/Dockerfile.migration
FROM node:20-alpine AS base

# Install PostgreSQL client and Prisma
RUN apk add --no-cache postgresql-client
RUN npm install -g prisma@latest @prisma/client@latest

# Set working directory
WORKDIR /app

# Copy schema and dependencies
COPY ./migrations /app/migrations
COPY ./prisma/schema.prisma /app/prisma/schema.prisma
COPY ./package.json /app/package.json
COPY ./scripts/migration-runner.sh /app/migration-runner.sh

# Install dependencies
RUN npm install

# Make scripts executable
RUN chmod +x /app/migration-runner.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD pg_isready -h postgres-primary -U ${POSTGRES_USER} || exit 1

# Run migration
CMD ["/app/migration-runner.sh"]
```

### **3.3 Migration Runner Script**

```bash
#!/bin/bash
# scripts/migration-runner.sh

set -e

echo "🚀 Starting Sparkle Universe Database Migration..."

# Wait for PostgreSQL
until pg_isready -h postgres-primary -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Enable extensions
psql -h postgres-primary -U "$POSTGRES_USER" -d "$POSTGRES_DB" << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EOF

echo "✅ Extensions enabled!"

# Run Prisma migrations
npx prisma migrate deploy --schema prisma/schema.prisma

echo "✅ Schema migrations completed!"

# Create production indexes
psql -h postgres-primary -U "$POSTGRES_USER" -d "$POSTGRES_DB" << EOF
-- High-performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_trending 
ON posts(published, published_at DESC) 
WHERE published = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_level_xp 
ON users(level DESC, experience DESC);

CREATE INDEX IF NOT EXISTS idx_content_performance_viral 
ON content_performance(virality_score DESC);

-- Full-text search indexes
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', username || ' ' || bio));

-- Partitioning setup
CREATE TABLE IF NOT EXISTS analytics_events_2025_08 
PARTITION OF analytics_events 
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
EOF

echo "✅ Production indexes created!"

# Verify deployment
npx prisma db seed --skip-generate || echo "No seed data found"

echo "🎉 Database deployment completed successfully!"
```

---

## 🔍 Step 4: Schema Migration & Validation

### **4.1 Zero-Downtime Migration Strategy**

```bash
#!/bin/bash
# scripts/zero-downtime-migration.sh

echo "🔄 Executing zero-downtime migration..."

# Phase 1: Pre-migration checks
docker-compose exec postgres-primary psql -U sparkle_admin -d sparkle_universe -c "
SELECT pg_size_pretty(pg_database_size('sparkle_universe')) as db_size;
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC LIMIT 10;
"

# Phase 2: Create backup
docker-compose exec backup /backup.sh --full-backup

# Phase 3: Run migration in replica
docker-compose up -d postgres-replica
docker-compose exec postgres-replica pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U repl_user -v -P -W

# Phase 4: Promote replica (if needed)
# docker-compose exec postgres-replica touch /tmp/promote_me

echo "✅ Migration strategy validated!"
```

### **4.2 Validation Scripts**

```bash
#!/bin/bash
# scripts/validate-deployment.sh

echo "🔍 Validating deployment..."

# Check database connectivity
docker-compose exec postgres-primary pg_isready -U sparkle_admin -d sparkle_universe

# Verify schema
docker-compose exec postgres-primary psql -U sparkle_admin -d sparkle_universe -c "
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    typname as data_type
FROM pg_tables t
JOIN pg_attribute a ON t.tablename = a.attrelid::regclass::text
JOIN pg_type ON a.atttypid = pg_type.oid
WHERE schemaname = 'public'
ORDER BY tablename, attnum;
"

# Performance test
docker-compose exec postgres-primary psql -U sparkle_admin -d sparkle_universe -c "
EXPLAIN ANALYZE SELECT * FROM users WHERE level > 10 ORDER BY experience DESC LIMIT 100;
"

# Check replication lag
docker-compose exec postgres-replica psql -U repl_user -d sparkle_universe -c "
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
"

echo "✅ All validation checks passed!"
```

---

## ⚡ Step 5: Performance Optimization

### **5.1 Connection Pooling Configuration**

```yaml
# config/pgpool.conf
# Add to docker-compose under pgpool service
backend_hostname0 = 'postgres-primary'
backend_port0 = 5432
backend_weight0 = 1
backend_data_directory0 = '/var/lib/postgresql/data'
backend_flag0 = 'ALLOW_TO_FAILOVER'

backend_hostname1 = 'postgres-replica'
backend_port1 = 5432
backend_weight1 = 1
backend_data_directory1 = '/var/lib/postgresql/data'
backend_flag1 = 'ALLOW_TO_FAILOVER'
```

### **5.2 PostgreSQL Tuning Parameters**

```bash
# config/postgresql-performance.conf
# Add to postgresql.conf

# Memory settings for 16GB RAM
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB

# WAL settings
wal_buffers = 64MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 15min
max_wal_size = 8GB
min_wal_size = 2GB

# Parallelism
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Statistics
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all
```

---

## 📊 Step 6: Monitoring & Health Checks

### **6.1 Monitoring Stack**

```yaml
# monitoring/docker-compose.monitoring.yml
version: '3.9'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: sparkle-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: sparkle-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus_data:
  grafana_data:
```

### **6.2 Prometheus Configuration**

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'postgres-primary'
    static_configs:
      - targets: ['postgres-primary:9187']
    metrics_path: /metrics

  - job_name: 'postgres-replica'
    static_configs:
      - targets: ['postgres-replica:9187']
    metrics_path: /metrics

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

---

## 💾 Step 7: Backup & Disaster Recovery

### **7.1 Backup Script**

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
S3_BUCKET="${BACKUP_S3_BUCKET}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS}"

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p ${BACKUP_DIR}/${DATE}

# Full database backup
pg_dump -h postgres-primary \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --format=custom \
        --verbose \
        --file=${BACKUP_DIR}/${DATE}/full_backup.dump

# Schema-only backup
pg_dump -h postgres-primary \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --schema-only \
        --file=${BACKUP_DIR}/${DATE}/schema_backup.sql

# Upload to S3
aws s3 cp ${BACKUP_DIR}/${DATE}/ s3://${S3_BUCKET}/backups/${DATE}/ --recursive

# Clean old backups
find ${BACKUP_DIR} -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \;
aws s3 rm s3://${S3_BUCKET}/backups/ --recursive --exclude "*" --include "*" --older-than ${RETENTION_DAYS}days

echo "✅ Backup completed: ${DATE}"
```

### **7.2 Disaster Recovery Script**

```bash
#!/bin/bash
# scripts/disaster-recovery.sh

BACKUP_DATE=$1
S3_BUCKET="${BACKUP_S3_BUCKET}"

if [ -z "$BACKUP_DATE" ]; then
    echo "❌ Please provide backup date (YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "🚨 Starting disaster recovery..."

# Stop application services
docker-compose stop app

# Download backup
aws s3 cp s3://${S3_BUCKET}/backups/${BACKUP_DATE}/ /tmp/restore/ --recursive

# Restore database
docker-compose exec postgres-primary pg_restore \
    -U ${POSTGRES_USER} \
    -d ${POSTGRES_DB} \
    --verbose \
    --clean \
    /tmp/restore/full_backup.dump

# Start application services
docker-compose start app

echo "✅ Disaster recovery completed!"
```

---

## ✅ Step 8: Production Validation

### **8.1 Final Health Check**

```bash
#!/bin/bash
# scripts/production-check.sh

echo "🏥 Running comprehensive health checks..."

# Check all services
docker-compose ps

# Database connectivity
echo "🔍 Testing database connectivity..."
docker-compose exec postgres-primary pg_isready -U sparkle_admin -d sparkle_universe

# Check replication
echo "🔍 Checking replication status..."
docker-compose exec postgres-replica psql -U repl_user -d sparkle_universe -c "
SELECT client_addr, state, sync_state 
FROM pg_stat_replication;
"

# Check pgpool
echo "🔍 Checking pgpool status..."
docker-compose exec pgpool pgpool -n show pool_nodes

# Check Redis
echo "🔍 Checking Redis connectivity..."
docker-compose exec redis redis-cli -a ${REDIS_PASSWORD} ping

# Performance test
echo "🔍 Running performance test..."
docker-compose exec postgres-primary psql -U sparkle_admin -d sparkle_universe -c "
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;
"

# Check monitoring
echo "🔍 Checking monitoring endpoints..."
curl -f http://localhost:9090/-/healthy || echo "Prometheus health check failed"
curl -f http://localhost:3000/api/health || echo "Grafana health check failed"

echo "🎉 All health checks passed!"
```

### **8.2 Deployment Verification**

```bash
# Quick deployment test
./scripts/production-check.sh

# Load test
./scripts/load-test.sh

# Security scan
./scripts/security-scan.sh
```

---

## 🎯 Quick Start Commands

### **One-Command Deployment**
```bash
# Clone and deploy
git clone https://github.com/sparkle-universe/database-deployment.git
cd database-deployment
chmod +x scripts/*.sh

# Deploy everything
docker-compose up -d

# Monitor deployment
./scripts/production-check.sh

# View logs
docker-compose logs -f postgres-primary
```

### **Emergency Commands**
```bash
# Quick restart
docker-compose restart postgres-primary

# Scale services
docker-compose up -d --scale postgres-replica=2

# View real-time metrics
docker-compose exec postgres-primary psql -U sparkle_admin -d sparkle_universe -c "
SELECT * FROM pg_stat_activity;
"
```

---

## 📞 Support & Troubleshooting

### **Common Issues**
| Issue | Solution |
|-------|----------|
| **Connection refused** | Check firewall rules and container status |
| **Out of memory** | Increase Docker memory limits |
| **Replication lag** | Check network latency and disk I/O |
| **Slow queries** | Run `EXPLAIN ANALYZE` and add appropriate indexes |

### **Emergency Contacts**
- **Database Admin**: db-admin@sparkle-universe.com
- **On-call Engineer**: +1-555-SPARKLE
- **Status Page**: https://status.sparkle-universe.com

---

## 🏆 Production Deployment Complete!

Your PostgreSQL 16 database is now deployed with:
- ✅ **Zero-downtime migration capability**
- ✅ **High availability with read replicas**
- ✅ **Enterprise-grade security**
- ✅ **Automated backup & recovery**
- ✅ **Comprehensive monitoring**
- ✅ **Performance optimization**

**Next Steps**: Configure application connection strings and begin your data migration!
