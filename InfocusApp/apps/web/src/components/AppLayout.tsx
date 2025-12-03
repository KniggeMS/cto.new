"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if the current path is login or register
    // We check for both localized and non-localized paths just in case, 
    // though usePathname from next/navigation usually returns the full path.
    const isAuthPage = pathname.includes('/login') || pathname.includes('/register');

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
