import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/database"
import { z } from "zod"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import bcrypt from "bcryptjs"
import type { Provider } from "@auth/core/providers"

// Simple schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
})

const providers: Provider[] = [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = await credentialsSchema.parseAsync(credentials);

        // 1. Check if user exists
        let user = await db.user.findUnique({
            where: { email }
        });

        // 2. DEV MODE AUTO-SIGNUP (Only if enabled via env var)
        const enableDevLogin = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';
        
        if (!user && enableDevLogin) {
             // Hash specific dev password if provided, or default "password"
             const hashedPassword = await bcrypt.hash(password || "password", 10);
             
             user = await db.user.create({
                 data: {
                     email,
                     name: email.split('@')[0],
                     systemRole: "MEMBER",
                     password: hashedPassword,
                     complianceStatus: "PENDING"
                 }
             });
        }

        if (!user) {
             return null;
        }

        // 3. Verify Password
        // If user has no password (e.g. created via OAuth), they cannot login via credentials
        if (!user.password) {
            return null;
        }

        if (!password) {
             return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return null;
        }

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
  session: { strategy: "jwt" }, // REVERTED: Database strategy does not support Credentials provider (Dev Login)
  trustHost: true,
  secret: process.env.JWT_SECRET, // Explicitly set secret to avoid config errors
  providers,
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
      async jwt({ token, user }) {
          // On initial sign-in, 'user' is the object returned by authorize()
          if (user) {
              token.id = user.id;
              // @ts-expect-error - Custom fields on User model
              token.systemRole = user.systemRole;
              // @ts-expect-error - Custom fields on User model
              token.complianceStatus = user.complianceStatus;
          }
          return token;
      },
      async session({ session, token }) {
          // With JWT strategy, read from token
          if (session.user && token) {
              session.user.id = token.id as string;
              // @ts-expect-error - Custom fields on User model
              session.user.systemRole = token.systemRole;
              // @ts-expect-error - Custom fields on User model
              session.user.complianceStatus = token.complianceStatus;
          }
          return session;
      },
  }
})

export { handlers, signIn, signOut };

export const auth = nextAuth;

