'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, PieChart, Target, CalendarDays, Wallet } from 'lucide-react';

// navItems: Removed Goals as requested.
// Only showing Dashboard, Investments, Tracker.
const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Investments', href: '/investments', icon: PieChart },
    { name: 'Tracker', href: '/tracker', icon: CalendarDays },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 h-auto w-16 bg-[#0B101B]/90 backdrop-blur-xl border border-slate-800 rounded-2xl flex flex-col items-center py-6 shadow-2xl z-50">

            <div className="flex flex-col gap-6 items-center w-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 group relative",
                                isActive
                                    ? "bg-blue-600 shadow-lg shadow-blue-500/25 text-white scale-105"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className="w-5 h-5" />

                            {/* Tooltip */}
                            <span className="absolute left-14 bg-[#0B101B] border border-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none translate-x-2 group-hover:translate-x-0 shadow-xl z-50">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
