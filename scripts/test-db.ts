import { db } from "../lib/db";
import { users } from "../lib/db/schemas/user";

async function test() {
  const allUsers = await db.select().from(users);
  console.log("✅ Connected! Users:", allUsers);
}

test().catch((err) => {
  console.error("❌ DB connection sfailed:", err);
});
