import { Tv, Film, Clock, CheckCircle2, PlaySquare } from "lucide-react";

interface MediaItem {
    id: string;
    tmdbId: number;
    type: "MOVIE" | "TV";
    title: string;
    posterPath?: string | null;
    status: "PLANNED" | "WATCHING" | "WATCHED" | "DROPPED";
    releaseDate?: string | null;
}

export function MediaCard({ item, onClick }: { item: MediaItem; onClick?: () => void }) {
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
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase border border-white/10">
                    {item.type === "MOVIE" ? "Film" : "Serie"}
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
