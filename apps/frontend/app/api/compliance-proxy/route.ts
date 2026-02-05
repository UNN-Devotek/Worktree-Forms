
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { insuranceUrl } = await req.json();

    // Call Backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5005";
    
    try {
        const res = await fetch(`${backendUrl}/api/users/compliance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': session.user.id || '' // Fallback to empty string or handle error
            },
            body: JSON.stringify({ insuranceUrl })
        });

        if (!res.ok) {
            throw new Error(`Backend error: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Proxy Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
