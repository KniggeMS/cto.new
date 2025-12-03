"use client";

import { X, Film, Tv, Star, Plus } from "lucide-react";
import { useState } from "react";

interface RecommendationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    recommendations: any[];
    isLoading: boolean;
    onAdd: (item: any) => void;
}

export function RecommendationsModal({ isOpen, onClose, recommendations, isLoading, onAdd }: RecommendationsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border border-slate-800 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Empfehlungen</h2>
                        <p className="text-slate-400 text-sm">Basierend auf deinem Geschmack</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 animate-pulse">Analysiere deine Sammlung...</p>
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="space-y-4">
                            {recommendations.map((item, idx) => (
                                <div key={idx} className="bg-slate-800/50 rounded-xl p-4 border border-slate-800 flex gap-4 hover:border-slate-700 transition-colors">
                                    <div className="w-16 h-24 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.type === "MOVIE" ? <Film className="w-6 h-6 text-slate-600" /> : <Tv className="w-6 h-6 text-slate-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-white truncate">{item.title}</h3>
                                                <p className="text-sm text-slate-400">{item.year} • {item.genre?.join(", ")}</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-bold text-yellow-500">{item.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">{item.plot}</p>
                                    </div>
                                    <button
                                        onClick={() => onAdd(item)}
                                        className="self-center p-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded-lg transition-colors"
                                        title="Zur Liste hinzufügen"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 py-12">
                            Keine Empfehlungen gefunden.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
