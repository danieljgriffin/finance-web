import { NextResponse } from "next/server";

// Server-side env vars
const BASE = (process.env.FINANCE_API_BASE_URL || 'https://finance-api-snqw.onrender.com').replace(/\/+$/, "");
const TOKEN = process.env.PERSONAL_API_TOKEN;

async function handler(req: Request, params: { path: string[] }) {
    // Reconstruct the destination URL
    // We need to handle query parameters too
    const path = params.path.join("/");
    const urlObj = new URL(req.url);
    const queryString = urlObj.search; // includes '?'

    const destinationUrl = `${BASE}/${path}${queryString}`;

    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${TOKEN}`);

    // Clean up headers that might cause issues
    headers.delete("host");
    headers.delete("connection");
    // Don't delete content-length, let fetch handle it or copy it? 
    // Fetch often handles content-length automatically when body is provided.

    try {
        const init: RequestInit = {
            method: req.method,
            headers,
            body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
            cache: "no-store",
        };

        const upstream = await fetch(destinationUrl, init);

        // Get body as ArrayBuffer to handle any content type safely
        const body = await upstream.arrayBuffer();

        return new NextResponse(body, {
            status: upstream.status,
            headers: {
                "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            },
        });
    } catch (error) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: "Failed to reach backend", details: String(error) }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: any) { return handler(req, params); }
export async function POST(req: Request, { params }: any) { return handler(req, params); }
export async function PUT(req: Request, { params }: any) { return handler(req, params); }
export async function PATCH(req: Request, { params }: any) { return handler(req, params); }
export async function DELETE(req: Request, { params }: any) { return handler(req, params); }
