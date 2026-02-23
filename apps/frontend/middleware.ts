import { NextResponse } from "next/server";
// import { auth } from "@/auth" // Removed to avoid Edge Runtime crash with Prisma Adapter
// Use explicit env var for bypass, as NODE_ENV might be production in Docker
// Use explicit env var for bypass, as NODE_ENV might be production in Docker
export default function middleware(req: any) {
  // Gated bypass: Only allow if explicitly enabled via specific env var
  const isDevBypassEnabled = process.env.ENABLE_DEV_UNCONDITIONAL_BYPASS === "true";
  
  if (isDevBypassEnabled) {
      const response = NextResponse.next();
      // Forward the bypass cookie value as header if present
      const bypassCookie = req.cookies.get("worktree-test-bypass");
      if (bypassCookie) {
         response.headers.set("x-test-bypass", bypassCookie.value);
      }
      return response;
  }
  
  // NOTE: Auth checks moved to Layout/Page Server Components
  // because "Database Strategy" is not supported in Edge Middleware.
  // See architecture.md regarding Database Sessions.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
