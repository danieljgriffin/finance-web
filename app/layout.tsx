import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import Providers from "./providers";
import { usesLocalAccess } from "@/lib/webAccess";

export const metadata: Metadata = {
  title: "Axiom Wealth",
  description: "Personal finance and wealth tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-[#020617] text-slate-100 min-h-screen"
      >
        <Sidebar showSignOut={!usesLocalAccess()} />
        <main className="min-h-screen [.app-sidebar+&]:pl-24">
          <div className="container mx-auto px-6 py-8 sm:px-8 lg:px-10 max-w-[1600px]">
            <Providers>
              {children}
            </Providers>
          </div>
        </main>
      </body>
    </html>
  );
}
