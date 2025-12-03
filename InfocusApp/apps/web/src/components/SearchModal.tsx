"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

interface SearchResult {
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    poster_path?: string;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
}

export function SearchModal({ isOpen, onClose, initialQuery = "" }: SearchModalProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<number | null>(null);
    const router = useRouter();

    // Reset query when modal opens with a new initialQuery
    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            // Auto-search if initialQuery is provided
            handleSearch(null, initialQuery);
        } else if (isOpen && !initialQuery) {
            setQuery("");
            setResults([]);
        }
    }, [isOpen, initialQuery]);

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent | null, searchQuery?: string) => {
        if (e) e.preventDefault();
        const q = searchQuery || query;
        if (!q.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (item: SearchResult) => {
        setAddingId(item.id);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bitte melde dich an, um Titel hinzuzufügen.");
                return;
            }

            const res = await fetch(`${API_URL}/api/media`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    tmdbId: item.id,
                    type: item.media_type.toUpperCase(),
                    title: item.title || item.name,
                    poster_path: item.poster_path, // Note: API expects posterPath, but let's check if I should map it here or if API handles it. 
                    // Wait, previous code sent `posterPath: item.poster_path`. I should keep that.
                    posterPath: item.poster_path,
                    status: "PLANNED",
                }),
            });

            if (!res.ok) throw new Error("Failed to add media");

            router.refresh();
            onClose(); // Close modal on success
        } catch (error) {
            console.error("Add failed", error);
            alert("Fehler beim Hinzufügen. Läuft die API auf Port 3001?");
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    <Search className="w-5 h-5 text-slate-400" />
                    <form onSubmit={handleSearch} className="flex-1">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Suche nach Filmen oder Serien..."
                            className="w-full bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-lg"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </form>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="text-center text-slate-500 p-8">Keine Ergebnisse gefunden.</div>
                    )}

                    {results.map((item) => (
                        <div key={item.id} className="flex gap-4 p-3 hover:bg-slate-800/50 rounded-xl transition-colors group">
                            <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                {item.poster_path && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{item.title || item.name}</h4>
                                <p className="text-sm text-slate-400">
                                    {item.media_type === "movie" ? "Film" : "Serie"} • {(item.release_date || item.first_air_date || "").split("-")[0]}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-1">{item.overview}</p>
                            </div>
                            <button
                                onClick={() => handleAdd(item)}
                                disabled={addingId === item.id}
                                className="self-center p-2 bg-slate-800 text-cyan-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-500/10 disabled:opacity-50"
                            >
                                {addingId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
