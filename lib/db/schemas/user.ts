import {pgTable, text,timestamp,uuid,varchar, boolean} from "drizzle-orm/pg-core"

export const users = pgTable("users",{
    id:uuid("id").primaryKey().defaultRandom(),
    email:varchar("email",{length:256}).notNull().unique(),
    password:varchar("password",{length:255}),
    name:varchar("name",{length:100}),
    image:text("image"),
    emailVerified:timestamp("email_verified",{mode:"date"}),
    isActive:boolean("is_active").default(false),
    createdAt:timestamp("created_at",{mode:"date"}).defaultNow(),
    updatedAt:timestamp("updated_at",{mode:"date"}).defaultNow(),

})