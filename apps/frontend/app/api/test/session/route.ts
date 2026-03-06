import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== "true") {
    return new Response("Not allowed", { status: 403 });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response("Email required", { status: 400 });
    }

    // Use NextAuth's signIn server-side function
    await signIn("credentials", {
        email: email,
        redirect: false,
    });

    // Explicitly return success. Cookies set via cookies() API should be attached automatically.
    return Response.json({ success: true });

  } catch (error) {
      if (isRedirectError(error)) {
          return Response.json({ success: true });
      }

      console.error("Test Login Error:", error);
      return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function isRedirectError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest: unknown }).digest === 'string' &&
      (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    );
}
