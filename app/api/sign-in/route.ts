import { NextRequest, NextResponse } from "next/server";
import { createSession, sameOrigin, sessionCookie, sessionOptions, validPassword } from "@/lib/webAccess";

export async function POST(request: NextRequest) {
    if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
    const form = await request.formData().catch(() => null);
    const password = form?.get("password");
    const authenticated = typeof password === "string" && validPassword(password);
    const response = new NextResponse(null, {
        status: 303, headers: { "Cache-Control": "private, no-store", Location: authenticated ? "/" : "/sign-in?invalid=1" },
    });
    if (authenticated) response.cookies.set(sessionCookie, createSession(), sessionOptions);
    return response;
}
