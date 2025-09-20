# P2P API Supabase Local Development Guide

## Table of Contents
1. [One-time Setup](#one-time-setup)
2. [Daily Development Workflow](#daily-development-workflow)  
3. [Local Database Commands](#local-database-commands)
4. [Production Database Commands](#production-database-commands)
5. [Troubleshooting](#troubleshooting)

---

## One-time Setup

### Prerequisites
- ✅ Docker installed and running
- ✅ Supabase CLI installed (`brew install supabase/tap/supabase`)
- ✅ Node.js and npm installed

### Initial Setup (Only run once)

1. **Initialize Supabase** (Already done)
   ```bash
   supabase init
   ```

2. **Start Supabase locally for the first time**
   ```bash
   supabase start
   ```
   
   This will:
   - Pull required Docker images (takes 5-10 minutes first time)
   - Start all Supabase services locally
   - Apply your migrations automatically
   - Seed your database with test data

3. **Note your local URLs** (displayed after startup):
   ```
   API URL: http://127.0.0.1:54321
   GraphQL URL: http://127.0.0.1:54321/graphql/v1
   S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
   DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
   Studio URL: http://127.0.0.1:54323
   Inbucket URL: http://127.0.0.1:54324
   JWT secret: your-jwt-secret-here
   anon key: your-anon-key-here
   service_role key: your-service-role-key-here
   S3 Access Key: your-s3-access-key
   S3 Secret Key: your-s3-secret-key
   S3 Region: local
   ```

4. **Update your environment variables**
   Create/update your `.env` file:
   ```bash
   # Local Development
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```

---

## Daily Development Workflow

### When you open your laptop and want to work

```bash
# 1. Navigate to your project
cd /Users/chiragahuja/Desktop/p2p/p2p-api

# 2. Start Docker (if not already running)
# Check: Docker Desktop should be running

# 3. Start Supabase services
supabase start

# 4. Start your API server
npm run dev
```

### When you're done working

```bash
# Stop Supabase services (saves resources)
supabase stop

# Or stop everything including removing containers
supabase stop --no-backup
```

### Quick Status Check

```bash
# Check if Supabase is running
supabase status

# View logs from all services
supabase logs

# View specific service logs
supabase logs api
supabase logs db
supabase logs storage
```

---

## Local Database Commands

### Database Operations

```bash
# Apply new migrations
supabase db push

# Reset database to clean state + run migrations + seed data
supabase db reset

# Create a new migration file
supabase migration new <migration_name>

# View database diff (compare local vs migrations)
supabase db diff

# Generate TypeScript types from your database
supabase gen types typescript --local > src/types/supabase.ts

# Connect to database via psql
supabase db connect

# Run a specific SQL file
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f your_file.sql

# Backup local database
supabase db dump -f backup.sql

# Restore from backup
supabase db reset && psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f backup.sql
```

### Rollback Operations

```bash
# Rollback a specific migration using our custom script
./supabase/scripts/rollback.sh 20250101120000

# Manual rollback (if script fails)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/rollbacks/20250101120000_rollback_create_core_tables.sql
```

### Seeding and Testing

```bash
# Re-run seed data only
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed.sql

# Drop all data and re-seed
supabase db reset

# Test your migrations on fresh database
supabase db reset --no-seed  # Migrations only, no seed data
```

### Storage Operations

```bash
# View storage buckets
supabase storage list

# Create a new storage bucket
supabase storage mb images

# Upload a file
supabase storage cp ./test-image.jpg s3://images/test-image.jpg

# Download a file
supabase storage cp s3://images/test-image.jpg ./downloaded-image.jpg
```

---

## Production Database Commands

⚠️ **WARNING: These commands affect your live production database. Always backup first!**

### Setup Production Connection

```bash
# Link to your production project (one-time)
supabase link --project-ref your-project-ref
```

### Database Operations

```bash
# Push local migrations to production
supabase db push --linked

# Generate types from production database
supabase gen types typescript --linked > src/types/supabase-prod.ts

# Create migration from production diff
supabase db diff --linked -f new_migration

# View production database status
supabase projects list
```

### Safe Production Deployments

```bash
# 1. First, test locally
supabase db reset
npm test

# 2. Create a database backup (via Supabase Dashboard)
# Go to: Dashboard > Settings > Database > Database Backups

# 3. Deploy to staging first (if available)
supabase db push --project-ref your-staging-project

# 4. Deploy to production
supabase db push --linked

# 5. Verify deployment
supabase gen types typescript --linked > temp-types.ts
diff src/types/supabase.ts temp-types.ts
```

### Production Rollbacks

```bash
# Option 1: Point-in-time recovery (Supabase Dashboard)
# Go to: Dashboard > Settings > Database > Point in time recovery

# Option 2: Manual rollback (if you have rollback scripts)
# ⚠️ DANGEROUS - Test in staging first!
supabase db connect --linked
# Then paste your rollback SQL

# Option 3: Restore from backup (Supabase Dashboard)
# Go to: Dashboard > Settings > Database > Database Backups
```

### Environment Management

```bash
# Production environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
DATABASE_URL=your-production-postgres-url

# View production project info
supabase projects list
supabase projects api-keys --project-ref your-project-ref
```

---

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop application
   # Then: supabase start
   ```

2. **Port conflicts**
   ```bash
   # Check what's using your ports
   lsof -i :54321
   lsof -i :54322
   lsof -i :54323
   
   # Stop conflicting processes or change ports in config.toml
   ```

3. **Migration errors**
   ```bash
   # Reset and try again
   supabase stop
   supabase db reset
   
   # Check migration syntax
   supabase db diff
   ```

4. **Out of sync with production**
   ```bash
   # Pull latest from production
   supabase db pull --linked
   
   # Or reset local and re-apply
   supabase db reset
   ```

5. **Storage permission issues**
   ```bash
   # Reset storage policies
   supabase db reset
   
   # Check RLS policies in Studio UI
   # http://127.0.0.1:54323
   ```

### Useful Debugging Commands

```bash
# View all running containers
docker ps

# View Supabase container logs
docker logs supabase_db_p2p-api
docker logs supabase_kong_p2p-api

# Check disk space
docker system df

# Clean up unused containers (careful!)
docker system prune
```

### Performance Tips

```bash
# Speed up subsequent starts
supabase start --ignore-health-check

# Keep containers running between sessions
# (uses more resources but faster startups)

# Clean up old migrations periodically
# Review and consolidate old migration files
```

---

## Quick Reference Card

**Save this for daily use:**

```bash
# Start development
cd /Users/chiragahuja/Desktop/p2p/p2p-api
supabase start
npm run dev

# Database operations
supabase db reset        # Fresh start
supabase db push         # Apply migrations
./supabase/scripts/rollback.sh    # Rollback migration
supabase status          # Check status

# End development
supabase stop           # Stop services
```

**URLs to bookmark:**
- Studio: http://127.0.0.1:54323
- API: http://127.0.0.1:54321
- Email testing: http://127.0.0.1:54324