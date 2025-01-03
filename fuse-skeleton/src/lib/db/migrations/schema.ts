import { pgTable, uuid, varchar, foreignKey, timestamp, text, boolean, json, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const user = pgTable("User", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	email: varchar("email", { length: 64 }).notNull(),
	password: varchar("password", { length: 64 }),
});

export const suggestion = pgTable("Suggestion", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	documentId: uuid("documentId").notNull(),
	documentCreatedAt: timestamp("documentCreatedAt", { mode: 'string' }).notNull(),
	originalText: text("originalText").notNull(),
	suggestedText: text("suggestedText").notNull(),
	description: text("description"),
	isResolved: boolean("isResolved").default(false).notNull(),
	userId: uuid("userId").notNull().references(() => user.id),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtF: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
	}
});

export const message = pgTable("Message", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	chatId: uuid("chatId").notNull().references(() => chat.id),
	role: varchar("role").notNull(),
	content: json("content").notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
});

export const chat = pgTable("Chat", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
	userId: uuid("userId").notNull().references(() => user.id),
	title: text("title").notNull(),
	visibility: varchar("visibility").default('private').notNull(),
});

export const vote = pgTable("Vote", {
	chatId: uuid("chatId").notNull().references(() => chat.id),
	messageId: uuid("messageId").notNull().references(() => message.id),
	isUpvoted: boolean("isUpvoted").notNull(),
},
(table) => {
	return {
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"})
	}
});

export const document = pgTable("Document", {
	id: uuid("id").defaultRandom().notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }).notNull(),
	title: text("title").notNull(),
	content: text("content"),
	userId: uuid("userId").notNull().references(() => user.id),
	text: varchar("text").default('text').notNull(),
},
(table) => {
	return {
		documentIdCreatedAtPk: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"})
	}
});