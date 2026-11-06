import { NextRequest, NextResponse } from "next/server";
import { canAccessWeb, sameOrigin, usesLocalAccess } from "@/lib/webAccess";

const LOCAL_DEMO_MODE = process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE === "true";
type ProxyContext = { params: Promise<{ path?: string[] }> };

async function proxy(req: NextRequest, ctx: ProxyContext) {
    const cacheControl = { "Cache-Control": "private, no-store" };
    if (!canAccessWeb(req)) {
        return NextResponse.json({ error: "Sign in to Axiom Wealth." }, { status: 401, headers: cacheControl });
    }
    if (req.method !== "GET" && !usesLocalAccess() && !sameOrigin(req)) {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: cacheControl });
    }
    const BASE = process.env.FINANCE_API_BASE_URL ?? (usesLocalAccess() ? "http://127.0.0.1:8000" : undefined);
    const TOKEN = process.env.PERSONAL_API_TOKEN ?? (usesLocalAccess() ? "dev-token-123" : undefined);
    if (!BASE) {
        return NextResponse.json(
            { error: "Missing FINANCE_API_BASE_URL" },
            { status: 500 }
        );
    }

    if (!TOKEN) {
        return NextResponse.json(
            { error: "Missing PERSONAL_API_TOKEN" },
            { status: 500 }
        );
    }

    if (LOCAL_DEMO_MODE) {
        const hostname = new URL(BASE).hostname;
        if (hostname !== "127.0.0.1" && hostname !== "localhost") {
            return NextResponse.json(
                { error: "Local demo mode requires a loopback API" },
                { status: 500 }
            );
        }
    }

    // Next.js 15: params is a Promise
    const params = await ctx.params;
    const pathArr = params?.path ?? [];
    const path = pathArr.join("/");

    const urlObj = new URL(req.url);
    const search = urlObj.search;

    // Remove trailing slash from BASE to avoid double slashes if path starts with empty
    const cleanBase = BASE.replace(/\/+$/, "");
    const url = `${cleanBase}/${path}${search}`;

    try {
        // Read the request body for POST/PUT/PATCH methods
        let body: string | null = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            body = await req.text();
        }

        const upstream = await fetch(url, {
            method: req.method,
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                "Content-Type": "application/json",
            },
            body: body,
            cache: "no-store",
        });

        const responseBody = await upstream.text();

        return new NextResponse(responseBody, {
            status: upstream.status,
            headers: {
                ...cacheControl,
                "content-type":
                    upstream.headers.get("content-type") ?? "application/json",
            },
        });
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Proxy Failed", details: String(error) }, { status: 500 });
    }
}

export async function GET(req: NextRequest, ctx: ProxyContext) {
    return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: ProxyContext) {
    return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: ProxyContext) {
    return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: ProxyContext) {
    return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: ProxyContext) {
    return proxy(req, ctx);
}
