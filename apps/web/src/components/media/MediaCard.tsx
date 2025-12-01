'use client';

import React from 'react';
import { Film, Tv, Layers } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface MediaItem {
    id: string;
    tmdbId: number;
    tmdbType: string;
    title: string;
    description?: string | null;
    posterPath?: string | null;
    backdropPath?: string | null;
    releaseDate?: Date | string | null;
    rating?: number | null;
    genres?: string[];
}

export interface MediaCardProps {
    item: MediaItem;
    className?: string;
    onClick?: () => void;
}

export function MediaCard({ item, className, onClick }: MediaCardProps) {
    const posterUrl = item.posterPath ? `${IMAGE_BASE_URL}${item.posterPath}` : null;
    const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'N/A';

    return (
        <div
            className={cn(
                "group relative flex flex-col bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-cyan-500/10 hover:border-slate-500",
                className
            )}
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="aspect-[2/3] w-full relative bg-slate-900">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Film className="text-white/20" size={48} />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mb-1" title={item.title}>
                    {item.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-auto">
                    {item.tmdbType === 'movie' ? (
                        <Film size={12} className="text-cyan-400" />
                    ) : (
                        <Tv size={12} className="text-purple-400" />
                    )}
                    <span>{releaseYear}</span>
                </div>
            </div>
        </div>
    );
}
