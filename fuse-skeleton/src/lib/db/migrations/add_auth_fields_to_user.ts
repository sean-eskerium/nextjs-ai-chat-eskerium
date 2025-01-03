import { sql } from 'drizzle-orm';
import { user } from '../models/user';
import { varchar, text } from 'drizzle-orm/pg-core';

export const addAuthFieldsToUser = sql`
  ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "name" varchar(64),
  ADD COLUMN IF NOT EXISTS "emailVerified" timestamp(3),
  ADD COLUMN IF NOT EXISTS "image" text;
`; 