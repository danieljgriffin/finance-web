import { NextResponse } from "next/server";

const BASE = process.env.FINANCE_API_BASE_URL;
const TOKEN = process.env.PERSONAL_API_TOKEN;

async function proxy(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
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
                "content-type":
                    upstream.headers.get("content-type") ?? "application/json",
            },
        });
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Proxy Failed", details: String(error) }, { status: 500 });
    }
}

export async function GET(req: Request, ctx: any) {
    return proxy(req, ctx);
}
export async function POST(req: Request, ctx: any) {
    return proxy(req, ctx);
}
export async function PUT(req: Request, ctx: any) {
    return proxy(req, ctx);
}
export async function DELETE(req: Request, ctx: any) {
    return proxy(req, ctx);
}
