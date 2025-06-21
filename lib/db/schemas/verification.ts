import { pgTable, text, timestamp,varchar,uuid,boolean } from "drizzle-orm/pg-core";

export const verificationTokens = pgTable("verification_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", {length: 256}).notNull(),
    token: varchar("token", {length: 6}).notNull(), // 6-digit OTP
    type: varchar("type", {length: 50}).notNull(), // 'email_verification', 'password_reset', etc.
    expiresAt: timestamp("expires_at", {mode: "date"}).notNull(),
    used: boolean("used").default(false),
    createdAt: timestamp("created_at", {mode: "date"}).defaultNow(),
})