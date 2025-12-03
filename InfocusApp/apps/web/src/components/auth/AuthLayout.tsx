"use client";

import { ReactNode } from "react";
import { Clapperboard, Languages } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
            {/* Background Image / Gradient Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1517604931442-71053e6e2306?q=80&w=2070&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-purple-900/30" />

            {/* Language Switcher */}
            <div className="absolute top-4 right-4 z-20">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors">
                    <Languages className="w-3 h-3" />
                    <span>English</span>
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md px-4">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                        <Clapperboard className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">CineLog</h1>
                    <p className="text-slate-400 text-sm">Starte deine filmische Reise noch heute.</p>
                </div>

                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
                    {children}
                </div>
            </div>
        </div>
    );
}
