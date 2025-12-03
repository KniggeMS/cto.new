"use client";

import { usePathname, useRouter } from "@/navigation";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // Check if the current path is login or register
    const isAuthPage = pathname.includes('/login') || pathname.includes('/register');

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");

            if (!token && !isAuthPage) {
                router.push("/login");
                return;
            }
            setIsLoading(false);
        };

        checkAuth();

        // Listen for logout events
        const handleAuthChange = () => checkAuth();
        window.addEventListener("auth-change", handleAuthChange);

        return () => {
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, [pathname, isAuthPage, router]);

    if (isLoading) {
        return <div className="min-h-screen bg-slate-950" />; // Prevent flash
    }

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
