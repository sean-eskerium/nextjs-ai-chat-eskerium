import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const user = pgTable("User", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
  name: varchar("name", { length: 64 }),
  emailVerified: timestamp("emailVerified", { precision: 3 }),
  image: text("image"),
}); 