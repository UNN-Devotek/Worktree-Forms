import NextAuth from "next-auth";
import { DynamoDBAdapter } from "@auth/dynamodb-adapter";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authDocClient, AUTH_TABLE_NAME } from "@/lib/dynamo/auth-client";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
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

      const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "worktree-local";
      console.log("[auth] authorize called for:", email, "table:", TABLE_NAME);

      // 1. Look up user by email via GSI1 (GSI1PK = email, GSI1SK = "USER")
      let item: Record<string, string> | undefined;
      try {
        const queryResult = await authDocClient.send(
          new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :email AND GSI1SK = :sk",
            ExpressionAttributeValues: {
              ":email": email,
              ":sk": "USER",
            },
            Limit: 1,
          })
        );
        item = queryResult.Items?.[0] as Record<string, string> | undefined;
        console.log("[auth] User lookup result:", item ? `found (userId: ${item.userId})` : "not found");
      } catch (err) {
        console.error("[auth] DynamoDB user lookup failed:", err);
        return null;
      }

      // 2. DEV MODE AUTO-SIGNUP (only when explicitly enabled)
      const enableDevLogin =
        process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";

      if (!item && enableDevLogin) {
        console.log("[auth] Dev auto-signup for:", email);
        try {
          const userId = crypto.randomUUID();
          const hashedPassword = await bcrypt.hash(password || "password", 10);
          const now = new Date().toISOString();
          await authDocClient.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: {
                PK: `USER#${userId}`,
                SK: "USER",
                GSI1PK: email,
                GSI1SK: "USER",
                __edb_e__: "user",
                __edb_v__: "1",
                userId,
                email,
                name: email.split("@")[0],
                role: "USER",
                passwordHash: hashedPassword,
                createdAt: now,
                updatedAt: now,
              },
            })
          );
          item = { userId, email, name: email.split("@")[0], role: "USER", passwordHash: hashedPassword };
          console.log("[auth] Dev auto-signup success:", userId);
        } catch (err) {
          console.error("[auth] Dev auto-signup failed:", err);
          return null;
        }
      }

      if (!item) {
        console.log("[auth] No user found and dev signup disabled. NODE_ENV:", process.env.NODE_ENV, "DEV_LOGIN:", process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN);
        return null;
      }

      // 3. Verify password
      if (!item.passwordHash) {
        console.log("[auth] User has no passwordHash");
        return null;
      }
      if (!password) {
        console.log("[auth] No password provided");
        return null;
      }

      const isValid = await bcrypt.compare(password, item.passwordHash);
      if (!isValid) {
        console.log("[auth] Password mismatch for:", email);
        return null;
      }

      console.log("[auth] Login success for:", email, "role:", item.role);
      return {
        id: item.userId,
        email: item.email,
        name: item.name ?? email,
        role: item.role,
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
  debug: true,
  adapter: DynamoDBAdapter(authDocClient, { tableName: AUTH_TABLE_NAME }),
  // JWT strategy is required because NextAuth v5 database sessions
  // do not support the Credentials provider (dev login flow).
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.JWT_SECRET,
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
