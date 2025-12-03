"use client";

import { ReactNode } from "react";
import { Clapperboard } from "lucide-react";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            {/* Dark Overlay with subtle gradient */}
            <div className="absolute inset-0 z-0 bg-black/60 bg-gradient-to-t from-black via-black/80 to-transparent" />

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher variant="glass" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-[420px] px-4">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/20">
                        <Clapperboard className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">CineLog</h1>
                    <p className="text-slate-400 text-sm font-medium">Melde dich an, um deine Watchlist zu verwalten.</p>
                </div>

                <div className="bg-[#0f1115]/90 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black">
                    {children}
                </div>

                {/* Footer Text moved inside layout to match screenshot placement roughly, or kept in children */}
            </div>
        </div>
    );
}
