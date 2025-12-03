"use client";

import { ArrowUpDown, Film, MessageCircle } from "lucide-react";
import { MediaCard } from "@/components/MediaCard";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChatModal } from "@/components/ChatModal";

export default function Home() {
    const searchParams = useSearchParams();
    const [media, setMedia] = useState([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const status = searchParams.get("status");
    const isFavorite = searchParams.get("favorite") === "true";
    const t = useTranslations('Home');

    useEffect(() => {
        const fetchMedia = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            let url = "http://localhost:3001/api/media";
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            if (isFavorite) params.append("favorite", "true");

            if (params.toString()) url += `?${params.toString()}`;

            try {
                const res = await fetch(url, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMedia(data);
                }
            } catch (error) {
                console.error("Failed to fetch media:", error);
            }
        };

        fetchMedia();

        const handleUpdate = () => fetchMedia();
        window.addEventListener("media-updated", handleUpdate);
        return () => window.removeEventListener("media-updated", handleUpdate);
    }, [status, isFavorite]);

    const getTitle = () => {
        if (isFavorite) return t('favorites');
        if (status === "PLANNED") return t('planned');
        if (status === "WATCHING") return t('watching');
        if (status === "WATCHED") return t('watched');
        return t('collection');
    };

    const getSubtitle = () => {
        if (isFavorite) return "Deine liebsten Filme und Serien.";
        if (status === "PLANNED") return "Was du noch sehen möchtest.";
        if (status === "WATCHING") return "Was du gerade schaust.";
        if (status === "WATCHED") return "Was du bereits gesehen hast.";
        return t('subtitle');
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col relative">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{getTitle()}</h1>
                    <p className="text-slate-400">{getSubtitle()}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                    <ArrowUpDown className="w-4 h-4" />
                    <span>{t('newest')}</span>
                </button>
            </div>

            {media.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <Film className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('emptyTitle')}</h3>
                    <p className="text-slate-400">
                        <button onClick={() => document.dispatchEvent(new CustomEvent('open-search'))} className="text-cyan-400 hover:underline">
                            {t('emptyLink')}
                        </button>
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
                    {media.map((item: any) => (
                        <MediaCard
                            key={item.id}
                            item={item}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            )}

            {/* Chat Bubble (Fixed) */}
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105 z-50"
            >
                <MessageCircle className="w-7 h-7 text-white" />
            </button>

            {/* Detail Modal */}
            {selectedItem && (
                <MediaDetailModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                />
            )}

            {/* Chat Modal */}
            <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}
