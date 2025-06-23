import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schemas';
import { eq, and } from 'drizzle-orm';
import { ipRateLimiter, emailRateLimiter, getClientIP } from '@/lib/rate-limit';
import { ActivityLogger } from '../lib/activitylogs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const clientIP = getClientIP(req);
        const email = credentials.email.toLowerCase().trim();

        try {
          // Check rate limits for both IP and email
          const [ipCheck, emailCheck] = await Promise.all([
            ipRateLimiter.checkRateLimit(clientIP),
            emailRateLimiter.checkRateLimit(email)
          ]);

          // Check IP rate limit
          if (!ipCheck.allowed) {
            const message = ipCheck.blockedUntil 
              ? `Too many failed attempts from your IP. Try again after ${ipCheck.blockedUntil.toLocaleTimeString()}`
              : `Too many attempts from your IP. Please try again later.`;
            
            // Log rate limit exceeded
            await ActivityLogger.logRateLimitExceeded(email, 'ip', req as any);
            throw new Error(message);
          }

          // Check email rate limit
          if (!emailCheck.allowed) {
            const message = emailCheck.blockedUntil 
              ? `Too many failed attempts for this email. Try again after ${emailCheck.blockedUntil.toLocaleTimeString()}`
              : `Too many attempts for this email. Please try again later.`;
            
            // Log rate limit exceeded
            await ActivityLogger.logRateLimitExceeded(email, 'email', req as any);
            throw new Error(message);
          }

          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user.length) {
            // Record failed attempt and log activity
            await Promise.all([
              ipRateLimiter.recordAttempt(clientIP, false),
              emailRateLimiter.recordAttempt(email, false),
              ActivityLogger.logFailedLogin(email, 'User not found', req as any)
            ]);
            throw new Error('Invalid credentials');
          }

          const foundUser = user[0];

          // Check if this user has a password (email/password account)
          if (!foundUser.password) {
            // Check if they have a Google account linked
            const googleAccount = await db
              .select()
              .from(accounts)
              .where(and(
                eq(accounts.userId, foundUser.id),
                eq(accounts.provider, 'google')
              ))
              .limit(1);

            if (googleAccount.length) {
              // Record failed attempt and log activity
              await Promise.all([
                ipRateLimiter.recordAttempt(clientIP, false),
                emailRateLimiter.recordAttempt(email, false),
                ActivityLogger.logFailedLogin(email, 'Attempted password login on Google account', req as any)
              ]);
              throw new Error('This account is linked to Google. Please use Google to sign in, or contact support to set up a password.');
            } else {
              // Account exists but has no password and no Google link - this shouldn't happen
              await Promise.all([
                ipRateLimiter.recordAttempt(clientIP, false),
                emailRateLimiter.recordAttempt(email, false),
                ActivityLogger.logFailedLogin(email, 'Account setup incomplete', req as any)
              ]);
              throw new Error('Account setup incomplete. Please contact support.');
            }
          }

          // Check if user account is active (email verified)
          if (!foundUser.isActive) {
            // Record failed attempt and log activity
            await Promise.all([
              ipRateLimiter.recordAttempt(clientIP, false),
              emailRateLimiter.recordAttempt(email, false),
              ActivityLogger.logFailedLogin(email, 'Account not activated', req as any)
            ]);
            throw new Error('Please verify your email address before logging in');
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(credentials.password, foundUser.password);
          if (!passwordMatch) {
            // Record failed attempt and log activity
            await Promise.all([
              ipRateLimiter.recordAttempt(clientIP, false),
              emailRateLimiter.recordAttempt(email, false),
              ActivityLogger.logFailedLogin(email, 'Invalid password', req as any)
            ]);
            throw new Error('Invalid credentials');
          }

          // Success! Record successful attempt, update user, and log activity
          await Promise.all([
            ipRateLimiter.recordAttempt(clientIP, true),
            emailRateLimiter.recordAttempt(email, true),
            db.update(users)
              .set({ updatedAt: new Date() })
              .where(eq(users.id, foundUser.id)),
            ActivityLogger.logLogin(foundUser.id, foundUser.email, 'email', req as any)
          ]);

          // Return user object (will be available in session)
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            image: foundUser.image,
            emailVerified: foundUser.emailVerified,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error; // NextAuth will handle the error message
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('=== SIGNIN CALLBACK ===');
      console.log('Provider:', account?.provider);
      console.log('User email:', user.email);
      console.log('Account ID:', account?.providerAccountId);

      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          const email = user.email!.toLowerCase().trim();
          
          // Check if user already exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          let userId: string;
          let isNewUser = false;

          if (existingUser.length) {
            console.log('Existing user found:', existingUser[0].id);
            // User exists - this could be a password user now using Google
            userId = existingUser[0].id;
            
            // Update user info but preserve their password if they have one
            await db
              .update(users)
              .set({
                name: user.name || existingUser[0].name,
                image: user.image || existingUser[0].image,
                emailVerified: new Date(),
                isActive: true,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userId));
            
            console.log('Updated existing user');
          } else {
            console.log('Creating new user');
            isNewUser = true;
            // Create new user from Google OAuth
            const newUser = await db.insert(users).values({
              email: email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              isActive: true,
              password: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }).returning({ id: users.id });
            
            userId = newUser[0].id;
            console.log('Created new user:', userId);
          }

          // Check if Google account record already exists for this user
          const existingAccount = await db
            .select()
            .from(accounts)
            .where(and(
              eq(accounts.userId, userId),
              eq(accounts.provider, 'google'),
              eq(accounts.providerAccountId, account.providerAccountId)
            ))
            .limit(1);

          if (!existingAccount.length) {
            console.log('Creating new Google account record');
            // Create new Google account record
            await db.insert(accounts).values({
              userId: userId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at ? new Date(account.expires_at * 1000) : null,
              id_token: account.id_token,
              refresh_token: account.refresh_token,
              scope: account.scope,
              token_type: account.token_type,
              session_state: account.session_state,
            });
            console.log('Created Google account record');
          } else {
            console.log('Updating existing Google account record');
            // Update existing Google account record with new tokens
            await db
              .update(accounts)
              .set({
                access_token: account.access_token,
                expires_at: account.expires_at ? new Date(account.expires_at * 1000) : null,
                id_token: account.id_token,
                refresh_token: account.refresh_token,
                scope: account.scope,
                token_type: account.token_type,
                session_state: account.session_state,
              })
              .where(and(
                eq(accounts.userId, userId),
                eq(accounts.provider, 'google'),
                eq(accounts.providerAccountId, account.providerAccountId)
              ));
            console.log('Updated Google account record');
          }

          // Log the appropriate activity
          if (isNewUser) {
            await ActivityLogger.logSignup(userId, email, 'google');
          } else {
            await ActivityLogger.logLogin(userId, email, 'google');
          }

          // Update the user object with the database ID for the session
          user.id = userId;
          
          console.log('Google sign-in successful for user:', userId);
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          // Log the full error details
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          return false;
        }
      } else if (account?.provider === 'credentials') {
        // Handle credentials sign-in
        try {
          const email = user.email!.toLowerCase().trim();
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser.length) {
            await ActivityLogger.logLogin(existingUser[0].id, email, 'email');
            user.id = existingUser[0].id;
            console.log('Credentials sign-in successful for user:', existingUser[0].id);
            return true;
          } else {
            console.error('User not found for credentials login');
            return false;
          }
        } catch (error) {
          console.error('Credentials sign-in error:', error);
          return false;
        }
      }

      // For credentials provider, authorization already handled in authorize callback
      console.log('Credentials sign-in successful');
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      console.log('=== JWT CALLBACK ===');
      console.log('User ID:', user?.id);
      console.log('Token userId:', token.userId);
      
      // Include user ID in token for database queries
      if (user) {
        token.userId = user.id;
        console.log('Set token userId to:', user.id);
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.email = session.email;
        console.log('Updated token from session');
      }

      return token;
    },

    async session({ session, token }) {
      console.log('=== SESSION CALLBACK ===');
      console.log('Token userId:', token.userId);
      
      // Get fresh user data from database
      if (token.userId) {
        try {
          const user = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              image: users.image,
              emailVerified: users.emailVerified,
              isActive: users.isActive,
            })
            .from(users)
            .where(eq(users.id, token.userId as string))
            .limit(1);

          if (user.length && user[0].isActive) {
            session.user = {
              ...session.user,
              id: user[0].id,
              email: user[0].email!,
              name: user[0].name,
              image: user[0].image,
            };
            console.log('Session updated with user data:', user[0].id);
          } else {
            console.log('User not found or inactive');
            // User is inactive or deleted
            session.user = {
              ...session.user,
              id: '',
              email: '',
              name: null,
              image: null,
            };
          }
        } catch (error) {
          console.error('Session callback error:', error);
          // Return session with empty user data on error
          session.user = {
            ...session.user,
            id: '',
            email: '',
            name: null,
            image: null,
          };
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('=== REDIRECT CALLBACK ===');
      console.log('URL:', url);
      console.log('Base URL:', baseUrl);
      
      // Don't redirect back to auth-related pages after successful sign-in
      const authPages = ['/login', '/register', '/auth/error'];
      const urlPath = url.startsWith('/') ? url : new URL(url).pathname;
      
      if (authPages.some(page => urlPath.startsWith(page))) {
        console.log('Redirecting away from auth page to dashboard');
        return `${baseUrl}/dashboard`; // Change this to your desired redirect page
      }
      
      // Allows relative callback URLs
      if (url.startsWith('/')) {
        console.log('Redirecting to relative URL:', `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        console.log('Redirecting to same origin URL:', url);
        return url;
      }
      
      console.log('Redirecting to base URL:', baseUrl);
      return baseUrl;
    }
  },

  events: {
    async signOut({ token }) {
      // Log user logout
      if (token?.userId) {
        await ActivityLogger.logLogout(token.userId as string);
      }
    }
  },

  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};