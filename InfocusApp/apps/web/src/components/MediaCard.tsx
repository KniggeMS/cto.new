import { Tv, Film, Clock, CheckCircle2, PlaySquare, MoreVertical, PlusCircle, Heart, Bookmark, Star } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface MediaItem {
    id: string;
    tmdbId: number;
    type: "MOVIE" | "TV";
    title: string;
    posterPath?: string | null;
    status: "PLANNED" | "WATCHING" | "WATCHED" | "DROPPED";
    releaseDate?: string | null;
    isFavorite?: boolean;
    rating?: number | null;
}

export function MediaCard({ item, onClick }: { item: MediaItem; onClick?: () => void }) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [lists, setLists] = useState<any[]>([]);
    const [updating, setUpdating] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const statusColors = {
        PLANNED: "text-slate-400 bg-slate-800/50",
        WATCHING: "text-cyan-400 bg-cyan-500/10",
        WATCHED: "text-green-400 bg-green-500/10",
        DROPPED: "text-red-400 bg-red-500/10",
    };

    const statusIcons = {
        PLANNED: PlaySquare,
        WATCHING: Clock,
        WATCHED: CheckCircle2,
        DROPPED: Tv, // Fallback
    };

    const statusLabels = {
        PLANNED: "Geplant",
        WATCHING: "Dabei",
        WATCHED: "Gesehen",
        DROPPED: "Abgebrochen",
    };

    const StatusIcon = statusIcons[item.status];

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

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPopoverOpen(!isPopoverOpen);
        if (!isPopoverOpen) {
            fetchLists();
        }
    };

    const fetchLists = () => {
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
    };

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
            window.dispatchEvent(new Event("media-updated"));
        } catch (e) {
            console.error("Failed to update", e);
        } finally {
            setUpdating(false);
        }
    };

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

    return (
        <div
            onClick={onClick}
            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-cyan-900/10 hover:-translate-y-1 cursor-pointer"
        >
            {/* Poster */}
            <div className="aspect-[2/3] bg-slate-800 relative">
                {item.posterPath ? (
                    <img
                        src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Film className="w-12 h-12" />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase border border-white/10">
                    {item.type === "MOVIE" ? "Film" : "Serie"}
                </div>

                {/* Menu Button */}
                <div className="absolute top-2 right-2 z-20" ref={popoverRef}>
                    <button
                        onClick={handleMenuClick}
                        className="p-1.5 bg-black/60 hover:bg-cyan-500 text-white rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover */}
                    {isPopoverOpen && (
                        <div
                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-30"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-slate-900 text-white px-3 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                <PlusCircle className="w-3 h-3 text-cyan-400" />
                                <span>Optionen</span>
                            </div>
                            <div className="p-1 space-y-0.5">
                                <button
                                    onClick={() => handleUpdate({ isFavorite: !item.isFavorite })}
                                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors text-sm"
                                >
                                    <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                                    <span className="font-medium">Favorit</span>
                                </button>
                                <button
                                    onClick={() => {/* TODO: Watchlist logic */ }}
                                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors text-sm"
                                >
                                    <Bookmark className="w-4 h-4 text-cyan-500 fill-cyan-500" />
                                    <span className="font-medium">Watchlist</span>
                                </button>

                                {/* Rating */}
                                <div className="px-2 py-1.5">
                                    <div className="flex items-center gap-2 text-slate-700 mb-1 text-xs">
                                        <Star className="w-3 h-3 text-slate-400" />
                                        <span className="font-medium">Bewertung</span>
                                    </div>
                                    <div className="flex gap-0.5 pl-5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => handleUpdate({ rating: star })}
                                                className={`w-5 h-5 flex items-center justify-center transition-colors ${(item.rating || 0) >= star ? "text-yellow-400" : "text-slate-300 hover:text-yellow-400"
                                                    }`}
                                            >
                                                <Star className={`w-3.5 h-3.5 ${(item.rating || 0) >= star ? "fill-current" : ""}`} />
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
                                        className="w-full flex items-center gap-2 px-2 py-2 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors text-sm"
                                    >
                                        <PlusCircle className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium truncate">{list.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-white font-medium truncate mb-2" title={item.title}>
                    {item.title}
                </h3>

                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${statusColors[item.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusLabels[item.status]}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
