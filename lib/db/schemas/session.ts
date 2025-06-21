import { pgTable, varchar, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});