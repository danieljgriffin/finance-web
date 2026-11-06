import { NextRequest, NextResponse } from "next/server";
import { canAccessWeb, webOrigin } from "@/lib/webAccess";

export function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const headers = { "Cache-Control": "private, no-store" };
    if (path === "/api/sign-in" || path === "/api/sign-out") return NextResponse.next();
    const allowed = canAccessWeb(request);
    if (path === "/sign-in") {
        return allowed ? NextResponse.redirect(new URL("/", webOrigin(request)), { headers }) : NextResponse.next();
    }
    if (allowed) return NextResponse.next();
    if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Sign in to Axiom Wealth." }, { status: 401, headers });
    }
    return NextResponse.redirect(new URL("/sign-in", webOrigin(request)), { headers });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
