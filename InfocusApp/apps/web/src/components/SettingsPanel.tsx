"use client";

import { Save, Download, Upload, FileText, LogOut, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "@/navigation";
import { ImportModal } from "./ImportModal";
import { SearchResult } from "../types";
import { Toast, ToastType } from "./Toast";
import { API_URL } from "@/config";

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onLogout: () => void;
}

export function SettingsPanel({ isOpen, onClose, user, onLogout }: SettingsPanelProps) {
    const t = useTranslations('Common');
    const [tmdbKey, setTmdbKey] = useState("");
    const [omdbKey, setOmdbKey] = useState("");
    const [isImportOpen, setIsImportOpen] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false
    });

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const storedTmdb = localStorage.getItem("tmdb_api_key");
        if (storedTmdb) setTmdbKey(storedTmdb);

        const storedOmdb = localStorage.getItem("omdb_api_key");
        if (storedOmdb) setOmdbKey(storedOmdb);
    }, []);

    const showToast = (message: string, type: ToastType = "success") => {
        setToast({ message, type, isVisible: true });
    };

    if (!isOpen && !toast.isVisible) return null;

    const isAdmin = user?.username === "BigDaddy";

    const handleLanguageChange = (locale: string) => {
        router.replace(pathname, { locale });
    };

    const handleSaveKeys = () => {
        if (tmdbKey) localStorage.setItem("tmdb_api_key", tmdbKey);
        if (omdbKey) localStorage.setItem("omdb_api_key", omdbKey);
        showToast("API Keys gespeichert!");
    };

    const handleImport = async (results: SearchResult[]) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Save imported items to backend
        let successCount = 0;
        for (const item of results) {
            try {
                await fetch(`${API_URL}/api/media`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        tmdbId: item.tmdbId,
                        type: item.type,
                        title: item.title,
                        posterPath: item.posterPath,
                        backdropPath: item.backdropPath,
                        status: "PLANNED", // Default status
                        userNotes: item.customNotes
                    })
                });
                successCount++;
            } catch (err) {
                console.error("Failed to import item:", item.title, err);
            }
        }

        showToast(`${successCount} von ${results.length} Einträgen erfolgreich importiert!`, "success");
        window.dispatchEvent(new Event("list-updated")); // Refresh lists
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            {isOpen && (
                <div className="fixed left-20 top-20 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-6">

                        {/* API Keys - Admin Only */}
                        {isAdmin && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Key className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">TMDB API Key</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={tmdbKey}
                                        onChange={(e) => setTmdbKey(e.target.value)}
                                        placeholder="••••••••••••••••••••"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>

                                {/* OMDB Key - Visual only as requested */}
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Key className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">OMDB API Key</span>
                                    </div>
                                    <input
                                        type="password"
                                        value={omdbKey}
                                        onChange={(e) => setOmdbKey(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    />
                                </div>

                                <button
                                    onClick={handleSaveKeys}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg transition-colors text-sm"
                                >
                                    Merken
                                </button>
                            </div>
                        )}

                        {/* Language */}
                        <div>
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Sprache</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleLanguageChange('de')}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                                >
                                    DE
                                </button>
                                <button
                                    onClick={() => handleLanguageChange('en')}
                                    className="px-3 py-2 bg-slate-950 text-slate-400 hover:text-white text-sm font-medium rounded-lg border border-slate-800 transition-colors"
                                >
                                    EN
                                </button>
                            </div>
                        </div>

                        {/* Backup */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Save className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Backup</span>
                            </div>
                            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors">
                                <Download className="w-4 h-4" />
                                <span>Daten sichern</span>
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span>Daten wiederherstellen</span>
                            </button>
                        </div>

                        {/* Smart Import - Admin Only */}
                        {isAdmin && (
                            <button
                                onClick={() => setIsImportOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Smart Import</span>
                            </button>
                        )}

                        {/* Logout */}
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors mt-4"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Abmelden</span>
                        </button>
                    </div>
                </div>
            )}

            <ImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
                apiKey={tmdbKey}
                omdbApiKey={omdbKey}
            />

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </>
    );
}
