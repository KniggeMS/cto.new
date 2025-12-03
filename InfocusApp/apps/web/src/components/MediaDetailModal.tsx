"use client";

import { X, Calendar, Star, Clock, Trash2, Check, PlaySquare, Tv, CheckCircle2, PlusCircle, MoreVertical, Heart, Bookmark, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface MediaDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: {
        id: string; // DB ID
        tmdbId: number;
        type: "MOVIE" | "TV";
        title: string;
        status: "PLANNED" | "WATCHING" | "WATCHED" | "DROPPED";
        posterPath?: string | null;
        isFavorite?: boolean;
        rating?: number | null;
    };
}

export function MediaDetailModal({ isOpen, onClose, item }: MediaDetailModalProps) {
    const [details, setDetails] = useState<any>(null);
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations('Common');

    // Close popover on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsPopoverOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const token = localStorage.getItem("token");
            if (!token) return;

            fetch("http://localhost:3001/api/lists", {
                headers: { "Authorization": `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setLists(data);
                })
                .catch(err => console.error(err));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && item.tmdbId) {
            setLoading(true);
            fetch(`http://localhost:3001/api/tmdb/${item.type.toLowerCase()}/${item.tmdbId}`)
                .then((res) => res.json())
                .then((data) => setDetails(data))
                .catch((err) => console.error("Failed to load details", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, item]);

    if (!isOpen) return null;

    const handleUpdate = async (updates: any) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await fetch(`http://localhost:3001/api/media/${item.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updates),
            });
            router.refresh();
            // Optimistic update could go here, but for now we rely on parent refresh or just close
        } catch (e) {
            console.error("Failed to update", e);
            alert("Fehler beim Aktualisieren.");
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Wirklich löschen?")) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await fetch(`http://localhost:3001/api/media/${item.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            router.refresh();
            onClose();
        } catch (e) {
            console.error("Failed to delete", e);
            alert("Fehler beim Löschen.");
        } finally {
            setUpdating(false);
        }
    }

    const handleAddToList = async (listId: string) => {
        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            await fetch(`http://localhost:3001/api/lists/${listId}/items`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ mediaId: item.id }),
            });
            window.dispatchEvent(new Event("list-updated"));
            setIsPopoverOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null;

    const providers = details?.["watch/providers"]?.results?.DE?.flatrate || [];
    const collection = details?.belongs_to_collection;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f1115] w-full max-w-md rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative border border-white/5">

                {/* Hero Section */}
                <div className="relative h-96 shrink-0">
                    {/* Backdrop / Poster */}
                    <div className="absolute inset-0">
                        {item.posterPath ? (
                            <img src={`https://image.tmdb.org/t/p/w780${item.posterPath}`} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                <Tv className="w-12 h-12 text-slate-600" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Top Actions */}
                    <div className="absolute top-4 right-4 z-10">
                        <div className="relative" ref={popoverRef}>
                            <button
                                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                                className="p-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                <MoreVertical className="w-6 h-6" />
                            </button>

                            {/* Popover */}
                            {isPopoverOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                    <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                        <PlusCircle className="w-4 h-4 text-cyan-400" />
                                        <span>Zur Liste hinzufügen</span>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => handleUpdate({ isFavorite: !item.isFavorite })}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                                        >
                                            <Heart className={`w-5 h-5 ${item.isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                                            <span className="font-medium">Favorit</span>
                                        </button>
                                        <button
                                            onClick={() => {/* TODO: Watchlist logic if separate from status */ }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                                        >
                                            <Bookmark className="w-5 h-5 text-cyan-500 fill-cyan-500" />
                                            <span className="font-medium">Watchlist</span>
                                        </button>

                                        {/* Rating */}
                                        <div className="px-3 py-2">
                                            <div className="flex items-center gap-3 text-slate-700 mb-1">
                                                <Star className="w-5 h-5 text-slate-400" />
                                                <span className="font-medium">Deine Bewertung</span>
                                            </div>
                                            <div className="flex gap-1 pl-8">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        onClick={() => handleUpdate({ rating: star })}
                                                        className={`w-6 h-6 flex items-center justify-center transition-colors ${(item.rating || 0) >= star ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"
                                                            }`}
                                                    >
                                                        <Star className={`w-5 h-5 ${(item.rating || 0) >= star ? "fill-current" : ""}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 my-1" />

                                        {/* Lists */}
                                        {lists.map(list => (
                                            <button
                                                key={list.id}
                                                onClick={() => handleAddToList(list.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                                            >
                                                <PlusCircle className="w-5 h-5 text-slate-400" />
                                                <span className="font-medium truncate">{list.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close Button (Left) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 z-10 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Title & Info */}
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <h2 className="text-3xl font-bold text-white mb-2 leading-tight shadow-black drop-shadow-md">{item.title}</h2>
                        <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                            {details?.release_date && (
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded">
                                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{details.release_date.split("-")[0]}</span>
                                </div>
                            )}
                            {details?.genres && details.genres.length > 0 && (
                                <span className="text-slate-400 truncate max-w-[200px]">
                                    {details.genres.map((g: any) => g.name).slice(0, 2).join(", ")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto bg-[#0f1115]">
                    <div className="p-6 space-y-6">

                        {/* Collection Info */}
                        {collection && (
                            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800/50">
                                <div className="p-2 bg-cyan-500/10 rounded-lg">
                                    <PlaySquare className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Teil von</p>
                                    <p className="text-sm text-white font-medium">{collection.name}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </div>
                        )}

                        {/* Plot */}
                        <div>
                            <p className="text-slate-400 leading-relaxed text-sm">
                                {details ? (details.overview || "Keine Beschreibung verfügbar.") : "Lade Details..."}
                            </p>
                        </div>

                        {/* Streaming Providers */}
                        {providers.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Als Stream verfügbar</h4>
                                <div className="flex flex-wrap gap-3">
                                    {providers.map((provider: any) => (
                                        <div key={provider.provider_id} className="w-10 h-10 rounded-xl overflow-hidden border border-white/10" title={provider.provider_name}>
                                            <img src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt={provider.provider_name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status Badge (Current) */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold uppercase tracking-wide">
                            <span>{item.status === "PLANNED" ? "Geplant" : item.status === "WATCHING" ? "Dabei" : item.status === "WATCHED" ? "Gesehen" : "Abgebrochen"}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-[#0f1115] border-t border-white/5 flex items-center justify-between">
                    <button
                        onClick={() => handleUpdate({ status: "PLANNED" })}
                        className={`p-3 rounded-full transition-colors ${item.status === "PLANNED" ? "text-yellow-400 bg-yellow-400/10" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        title="Geplant"
                    >
                        <Clock className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => handleUpdate({ status: "WATCHING" })}
                        className={`p-3 rounded-full transition-colors ${item.status === "WATCHING" ? "text-cyan-400 bg-cyan-400/10" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        title="Dabei"
                    >
                        <PlaySquare className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => handleUpdate({ status: "WATCHED" })}
                        className={`p-3 rounded-full transition-colors ${item.status === "WATCHED" ? "text-green-400 bg-green-400/10" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        title="Gesehen"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <button
                        onClick={handleDelete}
                        className="p-3 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Löschen"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
}
