"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const nextLocale = locale === "de" ? "en" : "de";

    const toggleLanguage = () => {
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs font-medium border border-slate-700"
        >
            <Languages className="w-3.5 h-3.5" />
            <span>{nextLocale.toUpperCase()}</span>
        </button>
    );
}
