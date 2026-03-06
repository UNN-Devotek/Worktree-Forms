import NextAuth from "next-auth";
import { DynamoDBAdapter } from "@auth/dynamodb-adapter";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authDocClient, AUTH_TABLE_NAME } from "@/lib/dynamo/auth-client";
import { UserEntity } from "@/lib/dynamo";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Provider } from "@auth/core/providers";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(),
});

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const { email, password } = await credentialsSchema.parseAsync(
        credentials
      );

      // 1. Look up user in the main app DynamoDB table via ElectroDB
      const result = await UserEntity.query.byEmail({ email }).go();
      let user = result.data[0];

      // 2. DEV MODE AUTO-SIGNUP (only when explicitly enabled)
      const enableDevLogin =
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

      if (!user && enableDevLogin) {
        const hashedPassword = await bcrypt.hash(password || "password", 10);
        const created = await UserEntity.create({
          userId: crypto.randomUUID(),
          email,
          name: email.split("@")[0],
          role: "USER",
          passwordHash: hashedPassword,
        }).go();
        user = created.data;
      }

      if (!user) return null;

      // 3. Verify password
      if (!user.passwordHash) return null;
      if (!password) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      return {
        id: user.userId,
        email: user.email,
        name: user.name ?? email,
        role: user.role,
      };
    },
  }),
];

// Conditionally add Microsoft Entra ID provider when configured
if (
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    })
  );
}

const useSecureCookies = process.env.NODE_ENV === "production";

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth({
  adapter: DynamoDBAdapter(authDocClient, { tableName: AUTH_TABLE_NAME }),
  // JWT strategy is required because NextAuth v5 database sessions
  // do not support the Credentials provider (dev login flow).
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.JWT_SECRET,
  providers,
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, 'user' is the object returned by authorize()
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handlers, signIn, signOut };
export const auth = nextAuth;
