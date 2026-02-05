import { NextResponse } from "next/server";
import { auth } from "@/auth"
export default auth((req: any) => {
  console.log(`[MIDDLEWARE] NODE_ENV=${process.env.NODE_ENV}, Path=${req.nextUrl.pathname}`);
  console.log(`[MIDDLEWARE] Cookies: ${req.cookies.getAll().map((c: any) => c.name).join(', ')}`);
  
  // Use explicit env var for bypass, as NODE_ENV might be production in Docker
  // Use runtime variable (non-NEXT_PUBLIC) to avoid build-time inlining issues
  const isDev = process.env.NODE_ENV === "development" || process.env.ENABLE_DEV_LOGIN === "true";
  // const hasBypass = req.cookies.get("worktree-test-bypass"); // Unused in unconditional mode
  
  // Unconditional bypass in Dev Mode to support E2E tests without cookies
  if (isDev) {
      console.log(`[MIDDLEWARE] Bypassing auth for dev/test (Unconditional)`);
      const response = NextResponse.next();
      // Forward the bypass cookie value as header if present
      const bypassCookie = req.cookies.get("worktree-test-bypass");
      if (bypassCookie) {
         response.headers.set("x-test-bypass", bypassCookie.value);
      }
      return response;
  }
  
  const publicPaths = ["/", "/signup", "/login", "/api/auth"];
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith("/public"));

  if (!req.auth && !isPublicPath) {
      console.log(`[MIDDLEWARE] Redirecting to login`);
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
      const newUrl = new URL(`/login?callbackUrl=${callbackUrl}`, req.nextUrl.origin);
      return Response.redirect(newUrl)
  }

  // COMPLIANCE CHECK
  if (req.auth) {
      // @ts-ignore
      const complianceStatus = req.auth.user?.complianceStatus;
      const isOnboarding = req.nextUrl.pathname.startsWith("/onboarding");
      
      console.log(`[MIDDLEWARE] User: ${req.auth.user?.email}, Status: ${complianceStatus}, Path: ${req.nextUrl.pathname}`);

      if (complianceStatus === 'PENDING' && !isOnboarding) {
           console.log(`[MIDDLEWARE] Redirecting to /onboarding (Compliance Pending)`);
           return Response.redirect(new URL(`/onboarding`, req.nextUrl.origin));
      }
      
      // Optional: Prevent verified users from stuck in onboarding? 
      // Actually, they might want to update insurance, so maybe let them stay if they want.
      // But for main flow, usually we redirect them out.
      // For now, let's just force PENDING -> onboarding.
  }
  
  return NextResponse.next();
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
