import { pgTable, text, varchar, timestamp, uuid, jsonb,boolean } from "drizzle-orm/pg-core";
import { users } from "./user";

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // e.g., 'login', 'signup', 'password_reset'
  category: varchar("category", { length: 30 }).notNull(), // e.g., 'auth', 'profile', 'security'
  description: text("description").notNull(), // Human-readable description
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"), // Browser/device info
  metadata: jsonb("metadata"), // Additional structured data
  success: boolean("success").default(true), // Whether the action was successful
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});
