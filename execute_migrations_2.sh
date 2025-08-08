echo "Phase 1: Database Extensions"
psql -f prisma/migrations/001_enable_extensions.sql

echo "Phase 2: JSON GIN Indexes"
psql -f prisma/migrations/002_json_gin_indexes.sql

echo "Phase 3: Database Functions"
psql -f prisma/migrations/003_database_functions.sql

echo "Phase 4: Materialized Views"
psql -f prisma/migrations/004_materialized_views.sql  # after fixing function

echo "Phase 5: Database Triggers"
psql -f prisma/migrations/005_triggers.sql

echo "Phase 6: Full-text Search"
psql -c "CREATE INDEX CONCURRENTLY ..."  # individually

echo "Phase 8: Advanced Indexes"
psql -c "CREATE INDEX CONCURRENTLY ..."  # individually

exit 0

#######
# https://chatgpt.com/share/6895538d-b8c4-8000-8cc3-abdeff1bf5ca
<think>

Alright, time to dive deep.

We’re faced with a failed migration execution. The symptoms involve:

1. ❌ A missing Postgres function `calculate_reputation_score(text)`
2. ❌ Errors from `CREATE INDEX CONCURRENTLY` inside a transaction block
3. ✅ Some functions like `calculate_user_level` exist and were tested
4. ✅ Extensions and triggers largely worked fine
5. ✅ `calculate_user_level` logs were successful
6. ⚠️ Materialized view creation aborted midway due to a missing function
7. ❌ Full-text search index creation partially failed (transaction block issue)

---

Let me structure this review in the most **systematic** and **surgical** way possible.

---

## 🧭 PHASED ANALYSIS PLAN

I’ll go through:

1. **What worked** ✅
2. **What failed and why** ❌
3. **Mapping to `schema.prisma` and migration scripts** 🧩
4. **Root cause analysis** 🔬
5. **Corrective action plan** 🛠️
6. **Validated and revised execution strategy** 🧭

---

## ✅ WHAT WORKED

### ✅ Phase 1: Extensions

* All expected Postgres extensions installed: `pg_stat_statements`, `pgcrypto`, `pg_trgm`, `uuid-ossp`
* Output: `CREATE EXTENSION`, no conflict or error
* ✔ Correct behavior — idempotent setup (via `IF NOT EXISTS` or graceful re-install)

### ✅ Phase 2: JSON GIN Indexes

* 40+ GIN indexes successfully created
* Index names not shown, but no errors
* Assumes proper syntax (e.g. `CREATE INDEX CONCURRENTLY ON tab USING gin(jsonb_col)`)

### ✅ Phase 3: Functions

* `calculate_user_level` tested inside script
* Output logs show test: `1 (should be 1)`
* ✔ Clear validation step present (this is excellent practice)
* All `CREATE FUNCTION` statements completed without failure

---

## ❌ WHAT FAILED & WHY

### ❌ Phase 4: Materialized Views

#### Problem

* Error:

  ```sql
  ERROR: function calculate_reputation_score(text) does not exist
  ```
* This caused a cascade of ROLLBACK failures since all further SQL was blocked by the failed transaction.

#### Cause

* Materialized view `top_creators` or others depend on `calculate_reputation_score()`
* That function was *not created* in the earlier `003_database_functions.sql`
* Prisma cannot recover from this unless rerun cleanly.

---

### ❌ Phase 6: Full-text Search

#### Problem

```sql
ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

#### Cause

* Postgres requires `CREATE INDEX CONCURRENTLY` to run outside `BEGIN ... COMMIT`
* Your migration script wraps this in a transaction, which is invalid

---

### ❌ Phase 8: Advanced Indexes

Same issue:

```sql
ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

---

## 🧩 VALIDATION AGAINST `schema.prisma`

From previous analysis, your `schema.prisma` **does not define Postgres functions** (those are in SQL only). So the errors are **not Prisma schema errors**, but they *affect application runtime queries* that expect these views/functions to exist.

---

## 🔬 ROOT CAUSES IDENTIFIED

| Failure                                    | Root Cause                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Missing `calculate_reputation_score(text)` | The function definition is not present in the `003_database_functions.sql`                   |
| `CREATE INDEX CONCURRENTLY` errors         | These must be executed *outside* transaction blocks — they currently are inside one          |
| Aborted transactions cascading             | Failure to use per-object `BEGIN ... COMMIT` wrappers or conditional checks like `IF EXISTS` |
| Partial full-text search setup             | Trigger and index creation not guarded and partially missing                                 |

---

## 🛠️ FIX PLAN (STEP-BY-STEP)

### ✅ Step 1: Fix `calculate_reputation_score` Error

* Search in `/prisma/migrations/003_database_functions.sql`
* If the function is missing, **add this block**:

```sql
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Temporary logic (you can refine later)
  RETURN 100;
END;
$$ LANGUAGE plpgsql STABLE;
```

* Add proper logic based on your real formula later
* This unblocks `top_creators` materialized view

---

### ✅ Step 2: Remove Transactions Around `CREATE INDEX CONCURRENTLY`

* Postgres doesn't allow `BEGIN ... COMMIT` around these
* Find and refactor in:

  * `006_fulltext_search.sql`
  * `008_advanced_indexes.sql`

**Fix**:

* Split those statements out from the transaction block

**Instead of**:

```sql
BEGIN;
CREATE INDEX CONCURRENTLY ...;
COMMIT;
```

**Do this**:

```bash
psql -d sparkle_db -c "CREATE INDEX CONCURRENTLY ...;"
```

Or wrap in bash script with individual calls.

---

### ✅ Step 3: Guard Materialized Views and Triggers

* Add `DROP MATERIALIZED VIEW IF EXISTS ...` before creation
* Add `DROP FUNCTION IF EXISTS ...` before function creation
* Wrap trigger setup in `DO $$ BEGIN ... END $$;` if necessary

---

## 🧭 FIXED MIGRATION EXECUTION STRATEGY

### 🔁 Revised `execute_migrations.sh` Phases

```bash
echo "Phase 1: Database Extensions"
psql -f prisma/migrations/001_enable_extensions.sql

echo "Phase 2: JSON GIN Indexes"
psql -f prisma/migrations/002_json_gin_indexes.sql

echo "Phase 3: Database Functions"
psql -f prisma/migrations/003_database_functions.sql

echo "Phase 4: Materialized Views"
psql -f prisma/migrations/004_materialized_views.sql  # after fixing function

echo "Phase 5: Database Triggers"
psql -f prisma/migrations/005_triggers.sql

echo "Phase 6: Full-text Search"
psql -c "CREATE INDEX CONCURRENTLY ..."  # individually

echo "Phase 8: Advanced Indexes"
psql -c "CREATE INDEX CONCURRENTLY ..."  # individually
```

---

## ✅ VALIDATION CHECKLIST

| Task                                                    | Status                                      |
| ------------------------------------------------------- | ------------------------------------------- |
| Ensure all functions are present                        | 🔄 Add missing `calculate_reputation_score` |
| Ensure no `CREATE INDEX CONCURRENTLY` inside tx block   | 🔄 Refactor into standalone commands        |
| Wrap function and view creation with `IF EXISTS` guards | ✅ Already done in many parts                |
| Retry migration once fixed                              | ⏳ Post-fix execution                        |

</think>

\<final\_answer>
Your migration script failed due to:

* A missing `calculate_reputation_score(text)` function needed by a materialized view
* Use of `CREATE INDEX CONCURRENTLY` inside a transaction block (not allowed in PostgreSQL)

✅ Recommended Fix Plan:

1. **Add the missing `calculate_reputation_score` function** to `003_database_functions.sql`
2. **Refactor `CREATE INDEX CONCURRENTLY` commands** to run outside transaction blocks — either manually or via `psql -c`
3. **Retry `execute_migrations.sh`** after fixes

📌 You are very close to a complete and robust migration setup. These are the final polishing steps to make it fully production-ready.
\</final\_answer>

