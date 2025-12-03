"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "glass" }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const nextLocale = locale === "de" ? "en" : "de";

    const toggleLanguage = () => {
        router.replace(pathname, { locale: nextLocale });
    };

    const baseStyles = "flex items-center gap-2 px-3 py-1.5 transition-colors text-xs font-medium";
    const variants = {
        default: "bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700",
        glass: "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-full backdrop-blur-sm"
    };

    return (
        <button
            onClick={toggleLanguage}
            className={`${baseStyles} ${variants[variant]}`}
        >
            <Languages className="w-3.5 h-3.5" />
            <span>{nextLocale.toUpperCase()}</span>
        </button>
    );
}
