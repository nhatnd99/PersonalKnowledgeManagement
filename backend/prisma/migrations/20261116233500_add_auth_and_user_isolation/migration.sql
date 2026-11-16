-- Step 1: Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" VARCHAR(100);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);

-- Step 2: Insert or update default owner account for legacy data
INSERT INTO "users" ("id", "email", "password_hash", "display_name", "name", "created_at", "updated_at")
VALUES (
    '00000000-0000-4000-8000-000000000000',
    'architect@knowledge.app',
    '$2b$10$PaRcAodeXmcV33OXACdN.uP4rOcELSfQU3hUQrmrMF9SMitOALLVe',
    'Knowledge Architect',
    'Knowledge Architect',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE 
SET "password_hash" = EXCLUDED."password_hash",
    "email" = EXCLUDED."email",
    "display_name" = COALESCE("users"."display_name", EXCLUDED."display_name");

-- Step 3: Add nullable user_id to existing data tables
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "user_id" UUID;
ALTER TABLE "note_relationships" ADD COLUMN IF NOT EXISTS "user_id" UUID;
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "user_id" UUID;

-- Step 4: Backfill existing records to default owner
UPDATE "notes" SET "user_id" = '00000000-0000-4000-8000-000000000000' WHERE "user_id" IS NULL;
UPDATE "note_relationships" SET "user_id" = '00000000-0000-4000-8000-000000000000' WHERE "user_id" IS NULL;
UPDATE "tags" SET "user_id" = '00000000-0000-4000-8000-000000000000' WHERE "user_id" IS NULL;

-- Step 5: Enforce NOT NULL constraints
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;
ALTER TABLE "notes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "note_relationships" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "tags" ALTER COLUMN "user_id" SET NOT NULL;

-- Step 6: Update tag unique constraint to be per-user
DROP INDEX IF EXISTS "tags_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "tags_user_id_name_key" ON "tags"("user_id", "name");

-- Step 7: Add foreign keys for ownership
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "note_relationships" ADD CONSTRAINT "note_relationships_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Create sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "device_name" VARCHAR(255),
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions"("expires_at");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Add user_id indexes
CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes"("user_id");
CREATE INDEX IF NOT EXISTS "note_relationships_user_id_idx" ON "note_relationships"("user_id");
CREATE INDEX IF NOT EXISTS "tags_user_id_idx" ON "tags"("user_id");
