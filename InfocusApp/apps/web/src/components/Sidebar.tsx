"use client";

import { LayoutGrid, Settings, PlaySquare, Tv, CheckCircle2, Heart, PlusCircle, Plus, Sparkles, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { SearchModal } from "./SearchModal";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "next-intl";
import { RecommendationsModal } from "./RecommendationsModal";
import { SettingsPanel } from "./SettingsPanel";

export function Sidebar() {

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [lists, setLists] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [user, setUser] = useState<any>(null);

    // AI Recommendations State
    const [isRecModalOpen, setIsRecModalOpen] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [isRecLoading, setIsRecLoading] = useState(false);

    const searchParams = useSearchParams();
    const currentStatus = searchParams.get("status");
    const isFavorite = searchParams.get("favorite") === "true";
    const t = useTranslations('Navigation');
    const tHome = useTranslations('Home');

    // Fetch lists & Check Auth
    const fetchLists = () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:3001/api/lists", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) {
                    handleLogout();
                    return [];
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setLists(data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        // Check local storage for user
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const userData = localStorage.getItem("user");
            if (token && userData) {
                setUser(JSON.parse(userData));
            } else {
                setUser(null);
            }
        };

        checkAuth();
        fetchLists();

        const handleUpdate = () => fetchLists();
        const handleAuthChange = () => {
            checkAuth();
            fetchLists();
        };

        window.addEventListener("list-updated", handleUpdate);
        window.addEventListener("auth-change", handleAuthChange);

        return () => {
            window.removeEventListener("list-updated", handleUpdate);
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.dispatchEvent(new Event("auth-change")); // Notify other components if needed
        window.location.href = "/login";
    };

    const isActive = (status?: string, fav?: boolean) => {
        if (fav) return isFavorite;
        if (!status && !currentStatus && !isFavorite) return true; // Overview
        return currentStatus === status;
    };

    const handleGetRecommendations = async () => {
        setIsRecModalOpen(true);
        if (recommendations.length > 0) return; // Don't refetch if we have data

        setIsRecLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3001/api/ai/recommendations", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const data = await res.json();
            setRecommendations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsRecLoading(false);
        }
    };

    const handleAddRecommendation = async (item: any) => {
        setIsRecModalOpen(false);
        setSearchQuery(item.title);
        setIsSearchOpen(true);
    };

    return (
        <>
            <aside className="w-64 bg-slate-900 h-screen flex flex-col border-r border-slate-800 fixed left-0 top-0 z-40">
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <LayoutGrid className="w-6 h-6" />
                        <span className="text-xl font-bold text-white tracking-tight">CineLog</span>
                    </div>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* User Profile */}
                <div className="px-6 mb-8">
                    {user ? (
                        <Link href="/profile" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800 group relative hover:bg-slate-800 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-white truncate">{user.username}</h3>
                                <p className="text-xs text-slate-400 truncate">Profil bearbeiten</p>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent navigation
                                    handleLogout();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 z-10"
                                title={t('logout')}
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </Link>
                    ) : (
                        <Link href="/login" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-white">{t('login')}</h3>
                                <p className="text-xs text-slate-400">Account erstellen</p>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
                    {/* Main Links */}
                    <div className="space-y-1">
                        <Link
                            href="/"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive() ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                }`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                            <span>{t('home')}</span>
                        </Link>
                    </div>

                    {/* Lists */}
                    {user && (
                        <div>
                            <h4 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{tHome('myLists')}</h4>
                            <div className="space-y-1">
                                <Link
                                    href="/?status=PLANNED"
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${isActive("PLANNED") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }`}
                                >
                                    <PlaySquare className={`w-5 h-5 ${isActive("PLANNED") ? "text-cyan-400" : "group-hover:text-cyan-400"} transition-colors`} />
                                    <span>Geplant</span>
                                </Link>
                                <Link
                                    href="/?status=WATCHING"
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${isActive("WATCHING") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }`}
                                >
                                    <Tv className={`w-5 h-5 ${isActive("WATCHING") ? "text-cyan-400" : "group-hover:text-cyan-400"} transition-colors`} />
                                    <span>Dabei</span>
                                </Link>
                                <Link
                                    href="/?status=WATCHED"
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${isActive("WATCHED") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }`}
                                >
                                    <CheckCircle2 className={`w-5 h-5 ${isActive("WATCHED") ? "text-cyan-400" : "group-hover:text-cyan-400"} transition-colors`} />
                                    <span>Gesehen</span>
                                </Link>
                                <Link
                                    href="/?favorite=true"
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${isActive(undefined, true) ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isActive(undefined, true) ? "text-pink-500" : "group-hover:text-pink-500"} transition-colors`} />
                                    <span>Favoriten</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Custom Lists */}
                    {user && (
                        <div>
                            <div className="flex items-center justify-between px-4 mb-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eigene Listen</h4>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {isCreating && (
                                    <div className="px-4 py-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder={tHome('newListPlaceholder')}
                                            className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors"
                                            onKeyDown={async (e) => {
                                                if (e.key === "Enter") {
                                                    const name = e.currentTarget.value;
                                                    if (name) {
                                                        try {
                                                            const token = localStorage.getItem("token");
                                                            await fetch("http://localhost:3001/api/lists", {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                    "Authorization": `Bearer ${token}`
                                                                },
                                                                body: JSON.stringify({ name }),
                                                            });
                                                            window.dispatchEvent(new Event("list-updated"));
                                                            setIsCreating(false);
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("Fehler beim Erstellen.");
                                                        }
                                                    }
                                                } else if (e.key === "Escape") {
                                                    setIsCreating(false);
                                                }
                                            }}
                                            onBlur={() => setIsCreating(false)}
                                        />
                                    </div>
                                )}
                                {lists.map((list: any) => (
                                    <Link
                                        key={list.id}
                                        href={`/lists/${list.id}`}
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors group text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <LayoutGrid className="w-4 h-4" />
                                            <span className="truncate max-w-[120px]">{list.name}</span>
                                        </div>
                                        <span className="text-xs text-slate-600 group-hover:text-slate-500">{list._count?.items || 0}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 space-y-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
                    <div className="flex justify-center">
                        <LanguageSwitcher />
                    </div>

                    {user && (
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{tHome('create')}</span>
                        </button>
                    )}

                    {/* AI Widget */}
                    {user && (
                        <div
                            onClick={handleGetRecommendations}
                            className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-colors"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sparkles className="w-12 h-12 text-purple-500" />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">AI Tipp</span>
                                </div>
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded uppercase">Neu</span>
                            </div>
                            <p className="text-sm text-slate-300 font-medium leading-snug">
                                Füge etwas hinzu!
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Ich analysiere deinen Geschmack.
                            </p>
                        </div>
                    )}
                </div>
            </aside>

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                }}
                initialQuery={searchQuery}
            />

            <RecommendationsModal
                isOpen={isRecModalOpen}
                onClose={() => setIsRecModalOpen(false)}
                recommendations={recommendations}
                isLoading={isRecLoading}
                onAdd={handleAddRecommendation}
            />

            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={user}
                onLogout={handleLogout}
            />
        </>
    );
}
