-- Set emailVerified to current timestamp for all existing users where it's NULL
UPDATE "User" 
SET "emailVerified" = CURRENT_TIMESTAMP 
WHERE "emailVerified" IS NULL; 