ALTER TABLE "User" ALTER COLUMN "data" SET DEFAULT '{"shortcuts":[], "settings":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";