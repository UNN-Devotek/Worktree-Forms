
import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";

export const POST = auth(async function POST(req: NextRequest) {
  const session = (req as any).auth;
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5005';

  try {
    const response = await fetch(`${backendUrl}/api/share/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.user?.id || "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        // Forward error
        const text = await response.text();
        return NextResponse.json({ error: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
