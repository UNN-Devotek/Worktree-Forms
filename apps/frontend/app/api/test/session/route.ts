// import { headers } from "next/headers"; // Unused
import { signIn } from "@/auth";
import { cookies } from "next/headers";

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

    console.log("[BACKDOOR] Attempting signIn for:", email);
    console.log("[BACKDOOR] Cookies before:", cookies().getAll().map(c => c.name));

    // Use NextAuth's signIn server-side function
    await signIn("credentials", {
        email: email,
        redirect: false, 
    });
    
    console.log("[BACKDOOR] Cookies after:", cookies().getAll().map(c => c.name));
    
    // Explicitly return success. Cookies set via cookies() API should be attached automatically.
    return Response.json({ success: true });

  } catch (error) {
      if (isRedirectError(error)) {
          console.log("[BACKDOOR] Caught Redirect (Success). Cookies:", cookies().getAll().map(c => c.name));
          return Response.json({ success: true });
      }

      console.error("Test Login Error:", error);
      return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

function isRedirectError(error: any) {
    return error?.digest?.startsWith?.('NEXT_REDIRECT');
}
