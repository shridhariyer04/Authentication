import { pgTable, text, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(), // e.g., 'oauth'
  provider: varchar("provider", { length: 255 }).notNull(), // e.g., 'google'
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at", { mode: "date" }),
  id_token: text("id_token"),
  refresh_token: text("refresh_token"),
  scope: varchar("scope", { length: 255 }),
  token_type: varchar("token_type", { length: 255 }),
  session_state: varchar("session_state", { length: 255 }),
});
