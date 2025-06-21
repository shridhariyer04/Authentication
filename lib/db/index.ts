import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in env");
}

const sql = postgres(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
export { sql };
