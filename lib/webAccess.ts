import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const sessionCookie = "__Host-axiom-session";
export const sessionOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
} as const;

export function usesLocalAccess() {
    if (process.env.RENDER === "true") return false;
    if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE !== "true") return false;
    try {
        const base = new URL(process.env.FINANCE_API_BASE_URL ?? "http://127.0.0.1:8000");
        return base.hostname === "127.0.0.1" || base.hostname === "localhost";
    } catch {
        return false;
    }
}

function password() {
    const configured = process.env.WEB_APP_PASSWORD;
    return configured && configured.length >= 16 ? configured : undefined;
}

export function isSignInConfigured() {
    return Boolean(password());
}

export function validPassword(value: string) {
    const configured = password();
    if (!configured || value.length > 1024) return false;
    const digest = (input: string) => createHash("sha256").update(input).digest();
    return timingSafeEqual(digest(configured), digest(value));
}

function signature(payload: string, configured: string) {
    return createHmac("sha256", configured).update("axiom-web-session:" + payload).digest();
}

export function createSession() {
    const configured = password();
    if (!configured) throw new Error("Web sign-in is not configured");
    const expiry = Math.floor(Date.now() / 1000) + sessionOptions.maxAge;
    const payload = `${expiry}.${randomBytes(16).toString("hex")}`;
    return `${payload}.${signature(payload, configured).toString("hex")}`;
}

export function canAccessWeb(request: NextRequest) {
    if (usesLocalAccess()) return true;
    const configured = password();
    const value = request.cookies.get(sessionCookie)?.value ?? "";
    if (!configured || !/^\d{10,12}\.[0-9a-f]{32}\.[0-9a-f]{64}$/.test(value)) return false;
    const [expiry, nonce, proof] = value.split(".");
    if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
    return timingSafeEqual(signature(`${expiry}.${nonce}`, configured), Buffer.from(proof, "hex"));
}

export function webOrigin(request: NextRequest) {
    return process.env.RENDER_EXTERNAL_URL ?? request.nextUrl.origin;
}

export function sameOrigin(request: NextRequest) {
    return request.headers.get("origin") === webOrigin(request);
}
