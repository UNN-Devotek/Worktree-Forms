import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/database"
import { z } from "zod"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

// Simple schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
})

const providers: any[] = [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        console.log("[AUTH] Authorizing credentials:", { email: credentials?.email, flow: 'credentials' });
        const { email, password: _password } = await credentialsSchema.parseAsync(credentials);

        // 1. Check if user exists
        let user = await db.user.findUnique({
            where: { email }
        });

        // 2. DEV MODE AUTO-SIGNUP (If User doesn't exist, create them for testing)
        // In production, this would verify password hash.
        if (!user && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true')) {
             console.log(`[DEV] Auto-creating user: ${email}`);
             if (!user) { // Double check
                 user = await db.user.create({
                     data: {
                         email,
                         name: email.split('@')[0], // simple name from email
                         systemRole: "MEMBER" // Default
                     }
                 });
             }
        }

        if (!user) {
             throw new Error("User not found.");
        }

        // Return user object
        return user;
      },
    }),
];

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET && process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID) {
    providers.push(MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`
    }));
}

const useSecureCookies = process.env.NODE_ENV === "production";

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db as any),
  session: { strategy: "jwt" },
  trustHost: true, // Essential when running behind proxies or in containers
  providers,
  // Force insecure cookies in dev/test to allow http://localhost:3005 access in Docker
  cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies
            }
        },
        callbackUrl: {
             name: `next-auth.callback-url`,
             options: {
                 sameSite: 'lax',
                 path: '/',
                 secure: useSecureCookies
             }
        },
        csrfToken: {
             name: `next-auth.csrf-token`,
             options: {
                 sameSite: 'lax',
                 path: '/',
                 secure: useSecureCookies
             }
        }
  },
  callbacks: {
      async session({ session, token }) {
          if (token.sub && session.user) {
              session.user.id = token.sub;
              // @ts-ignore
              session.user.systemRole = token.systemRole;
              // @ts-ignore
              session.user.complianceStatus = token.complianceStatus;
          }
          return session;
      },
      async jwt({ token, user }) {
          if (user) {
              token.sub = user.id;
              // @ts-ignore
              token.systemRole = user.systemRole;
              // @ts-ignore
              token.complianceStatus = user.complianceStatus || 'PENDING';
          }
          return token;
      }
  }
})

export { handlers, signIn, signOut };

export const auth = (...args: any[]) => {
    // 1. Middleware Case (args present) or non-standard usage
    if (args.length > 0) {
        // @ts-ignore: Spread argument type mismatch
        return nextAuth(...args);
    }

    // 2. Server Component / Action Case (no args)
    // Check for Bypass Cookie
    return (async () => {
        try {
            console.log("[AUTH] auth() called");
            // Dynamic import to avoid Edge Runtime issues in Middleware
            const { cookies, headers } = await import("next/headers");
            const cookieStore = cookies();
            const headerStore = headers();
            
            const bypassCookie = cookieStore.get("worktree-test-bypass");
            const bypassHeader = headerStore.get("x-test-bypass");
            
            const bypassValue = bypassCookie?.value || bypassHeader;
            
            const isDev = process.env.NODE_ENV === "development" || process.env.ENABLE_DEV_LOGIN === "true";

            if (bypassValue) {
                 console.log(`[AUTH] Bypass found (Cookie/Header): ${bypassValue}, isDev: ${isDev}`);
            } else {
                 console.log(`[AUTH] No bypass found. Cookies: ${cookieStore.getAll().map(c => c.name).join(', ')}`);
            }

            // CHECK BYPASS FIRST
            if (isDev && bypassValue) {
                 const userId = bypassValue;
                 console.log(`[AUTH] Bypassing session with cookie for user: ${userId}`);
                 return {
                     user: {
                         name: "Test User",
                         email: "test@example.com",
                         image: null,
                         id: userId,
                         systemRole: "ADMIN",
                         complianceStatus: "VERIFIED"
                     },
                     expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                 }
            }

            // FALLBACK: Force Admin Session in Dev Mode (Nuclear Nuclear Option)
            // ... commented out ...
        } catch (e) {
            console.error("[AUTH] Error in auth() bypass logic:", e);
            // cookies() might fail if called outside of request context (e.g. static gen)
            // or if dynamic import fails
        }

        return nextAuth();
    })();
}
