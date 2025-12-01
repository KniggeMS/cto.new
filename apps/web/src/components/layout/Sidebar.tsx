'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MonitorPlay,
    Tv,
    CheckCircle,
    Heart,
    List,
    Share2,
    PlusCircle,
    Settings,
    Clapperboard,
    Sparkles,
    Plus,
    Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { aiApi, Recommendation } from '@/lib/api/ai';
import { useAddToWatchlist, useWatchlist } from '@/lib/hooks/use-watchlist';
import { toast } from 'react-hot-toast';

export function Sidebar() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // AI Recommendation State
    const { data: watchlist } = useWatchlist();
    const addToWatchlist = useAddToWatchlist();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(false);
    const [isAddingRec, setIsAddingRec] = useState(false);

    const handleRecommendation = async () => {
        setIsLoadingRecs(true);
        try {
            // Prepare context from watchlist
            const context = watchlist?.map((entry) => ({
                title: entry.mediaItem.title,
                year: entry.mediaItem.year,
                status: entry.status,
                userRating: entry.rating,
                isFavorite: entry.isFavorite,
                userNotes: entry.notes
            })) || [];

            const recs = await aiApi.getRecommendations(context);
            setRecommendations(recs);
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            toast.error(t('rec_error'));
        } finally {
            setIsLoadingRecs(false);
        }
    };

    const handleAddRecommendation = async (rec: Recommendation) => {
        setIsAddingRec(true);
        try {
            // We need to search for the movie first to get the TMDB ID
            // Since the recommendation only gives us title/year, this is a simplified approach
            // Ideally, the AI would return the TMDB ID if possible, or we search here.
            // For now, we will assume we need to search or use a placeholder if not found.
            // BUT, the `addToWatchlist` hook expects a `tmdbId`.
            // So we must search for it.

            // Let's use a quick search via existing search API if possible, or just fail gracefully for now
            // and tell the user to search manually. 
            // WAIT: The reference implementation does `addItem(rec)`. Let's see how `addItem` works in reference.
            // In reference `App.tsx`: `addItem` calls `getMediaDetails(result, tmdbApiKey)`.
            // `result` comes from `getRecommendations` which returns `SearchResult`.

            // Our `addToWatchlist` needs `tmdbId`.
            // I will implement a quick search helper here or just notify user for now.
            // Actually, let's try to search for it using the search API.

            // Importing searchApi to find the movie
            const { searchApi } = await import('@/lib/api/search');
            const searchResults = await searchApi.search(rec.title);

            const match = searchResults.results.find(
                r => r.title.toLowerCase() === rec.title.toLowerCase() &&
                    (rec.year ? r.release_date?.startsWith(rec.year.toString()) : true)
            );

            if (match) {
                await addToWatchlist.mutateAsync({
                    tmdbId: match.id,
                    mediaType: match.media_type,
                    status: 'not_watched',
                    notes: rec.plot // Add AI reason as note
                });
                toast.success(t('rec_added'));
                setRecommendations([]); // Clear after adding
            } else {
                toast.error(t('rec_not_found'));
            }
        } catch (error) {
            console.error('Failed to add recommendation:', error);
            toast.error(t('add_error'));
        } finally {
            setIsAddingRec(false);
        }
    };

    // Helper for active link styling
    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        const isActive = pathname === href;
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-cyan-500/10 text-cyan-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
            >
                <Icon size={20} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col sticky top-0 h-screen z-20">
            {/* Header */}
            <div className="p-6 flex items-center justify-between text-cyan-400">
                <div className="flex items-center gap-2">
                    <Clapperboard size={28} />
                    <h1 className="text-2xl font-bold tracking-tight text-white">CineLog</h1>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="text-slate-500 hover:text-white transition-colors"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow px-4 space-y-1 overflow-y-auto pb-4 custom-scrollbar">
                <NavItem href="/" icon={LayoutDashboard} label={t('overview')} />

                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {t('my_lists')}
                </div>
                <NavItem href="/watchlist" icon={MonitorPlay} label={t('planned')} />
                <NavItem href="/watching" icon={Tv} label={t('watching')} />
                <NavItem href="/watched" icon={CheckCircle} label={t('seen')} />
                <NavItem href="/favorites" icon={Heart} label={t('favorites')} />

                {/* Custom Lists Placeholder */}
                <div className="pt-4 pb-2 px-4 flex items-center justify-between group cursor-pointer">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Lists</span>
                    <button className="text-slate-500 hover:text-cyan-400 transition-colors">
                        <PlusCircle size={14} />
                    </button>
                </div>

                {/* Add Button */}
                <div className="pt-6">
                    <button
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-900/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={20} />
                        <span>Add Movie</span>
                    </button>
                </div>
            </nav>

            {/* AI Widget */}
            <div className="p-4 border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            {t('ai_tip')}
                        </h4>
                        <button
                            onClick={handleRecommendation}
                            disabled={isLoadingRecs}
                            className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
                        >
                            {isLoadingRecs ? <Loader2 size={12} className="animate-spin" /> : t('new_rec')}
                        </button>
                    </div>

                    {recommendations.length > 0 ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            {recommendations.slice(0, 1).map((rec, i) => (
                                <div key={i} className="text-xs">
                                    <div className="font-medium text-slate-200 line-clamp-1" title={rec.title}>{rec.title} ({rec.year})</div>
                                    <div className="text-slate-500 mt-1 line-clamp-2" title={rec.plot}>{rec.plot}</div>
                                    <button
                                        onClick={() => handleAddRecommendation(rec)}
                                        disabled={isAddingRec}
                                        className="mt-2 w-full py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors flex items-center justify-center gap-1"
                                    >
                                        {isAddingRec ? <Loader2 size={10} className="animate-spin" /> : <Plus size={12} />}
                                        {t('add_button')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">
                            {t('ai_tip_desc')}
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
