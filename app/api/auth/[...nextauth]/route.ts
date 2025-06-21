import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export named exports for GET and POST methods
export { handler as GET, handler as POST };