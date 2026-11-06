import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, sessionCookie, sessionOptions } from "@/lib/webAccess";

export function POST(request: NextRequest) {
    if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
    const response = new NextResponse(null, {
        status: 303, headers: { "Cache-Control": "private, no-store", Location: "/sign-in" },
    });
    response.cookies.set(sessionCookie, "", { ...sessionOptions, maxAge: 0 });
    return response;
}
