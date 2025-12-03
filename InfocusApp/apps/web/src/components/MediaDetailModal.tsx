"use client";

import { X, Calendar, Star, Clock, Trash2, Check, PlaySquare, Tv, CheckCircle2, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    };
}

export function MediaDetailModal({ isOpen, onClose, item }: MediaDetailModalProps) {
    const [details, setDetails] = useState<any>(null);
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

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

    const handleStatusChange = async (newStatus: string) => {
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
                body: JSON.stringify({ status: newStatus }),
            });
            router.refresh();
            onClose();
        } catch (e) {
            console.error("Failed to update status", e);
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

    const [addedToList, setAddedToList] = useState<string | null>(null);

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
            setAddedToList(listId);
            window.dispatchEvent(new Event("list-updated"));
            setTimeout(() => setAddedToList(null), 2000);
        } catch (e) {
            console.error(e);
            // Silent error or toast if we had one
        } finally {
            setUpdating(false);
        }
    };

    const backdropUrl = details?.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Hero Section (Backdrop) */}
                <div className="h-64 md:h-80 bg-slate-800 relative shrink-0">
                    {backdropUrl && (
                        <>
                            <img src={backdropUrl} alt={item.title} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                        </>
                    )}

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-black drop-shadow-lg">{item.title}</h2>
                        {details && (
                            <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                                {details.release_date && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-cyan-400" />
                                        <span>{details.release_date.split("-")[0]}</span>
                                    </div>
                                )}
                                {details.vote_average > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span>{details.vote_average.toFixed(1)}</span>
                                    </div>
                                )}
                                {details.runtime > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{details.runtime} min</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid md:grid-cols-[1fr_300px] gap-8">

                        {/* Left: Overview & Info */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">Handlung</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {details ? (details.overview || "Keine Beschreibung verfügbar.") : "Lade Details..."}
                                </p>
                            </div>

                            {details?.genres && (
                                <div className="flex flex-wrap gap-2">
                                    {details.genres.map((g: any) => (
                                        <span key={g.id} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">
                                            {g.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-3">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Status ändern</h4>

                                <button
                                    onClick={() => handleStatusChange("PLANNED")}
                                    disabled={updating || item.status === "PLANNED"}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.status === "PLANNED" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "hover:bg-slate-700 text-slate-300"}`}
                                >
                                    <PlaySquare className="w-5 h-5" />
                                    <span className="font-medium">Geplant</span>
                                    {item.status === "PLANNED" && <Check className="w-4 h-4 ml-auto" />}
                                </button>

                                <button
                                    onClick={() => handleStatusChange("WATCHING")}
                                    disabled={updating || item.status === "WATCHING"}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.status === "WATCHING" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "hover:bg-slate-700 text-slate-300"}`}
                                >
                                    <Tv className="w-5 h-5" />
                                    <span className="font-medium">Dabei</span>
                                    {item.status === "WATCHING" && <Check className="w-4 h-4 ml-auto" />}
                                </button>

                                <button
                                    onClick={() => handleStatusChange("WATCHED")}
                                    disabled={updating || item.status === "WATCHED"}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.status === "WATCHED" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" : "hover:bg-slate-700 text-slate-300"}`}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">Gesehen</span>
                                    {item.status === "WATCHED" && <Check className="w-4 h-4 ml-auto" />}
                                </button>
                            </div>

                            <button
                                onClick={handleDelete}
                                disabled={updating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">Entfernen</span>
                            </button>

                            {/* Add to List */}
                            <div className="pt-4 border-t border-slate-800">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Zu Liste hinzufügen</h4>
                                <div className="space-y-2">
                                    {lists.map((list: any) => (
                                        <button
                                            key={list.id}
                                            onClick={() => handleAddToList(list.id)}
                                            disabled={updating}
                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors ${addedToList === list.id
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                                }`}
                                        >
                                            <span>{list.name}</span>
                                            {addedToList === list.id ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <PlusCircle className="w-4 h-4" />
                                            )}
                                        </button>
                                    ))}
                                    {lists.length === 0 && <p className="text-xs text-slate-500">Keine Listen vorhanden.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
