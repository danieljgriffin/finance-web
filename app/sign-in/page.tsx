import { isSignInConfigured } from "@/lib/webAccess";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
    const { invalid } = await searchParams;

    return (
        <section className="grid min-h-[75vh] place-items-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0B101B] p-7">
                <h1 className="text-2xl font-bold">Sign in to Axiom Wealth</h1>
                {isSignInConfigured() ? (
                    <form action="/api/sign-in" method="post" className="mt-6 space-y-4">
                        <label className="grid gap-2 text-sm font-medium">
                            Password
                            <input type="password" name="password" autoComplete="current-password" required
                                maxLength={1024} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
                        </label>
                        {invalid && <p role="alert" className="text-sm text-rose-300">That password didn’t match. Try again.</p>}
                        <button type="submit" className="w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-500">
                            Sign in
                        </button>
                    </form>
                ) : <p className="mt-4 text-sm text-slate-400">Web sign-in needs to be configured in Render.</p>}
            </div>
        </section>
    );
}
