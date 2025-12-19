import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axiom Wealth",
  description: "Personal finance and wealth tracking dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof window !== 'undefined') {
    console.log("Environment Debug:");
    console.log("NEXT_PUBLIC_API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
  }
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#020617] text-slate-100 min-h-screen`}
      >
        <Sidebar />
        {/* Adjusted padding: Sidebar is floating, so we don't need consistent 20 (5rem) padding. 
            However, we want to center the content or offset it slightly properly.
            Let's keep pl-24 to push content right of the floating dock. */}
        <main className="pl-24 min-h-screen">
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
