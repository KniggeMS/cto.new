
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { aiApi, Recommendation } from '@/lib/api/ai';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { Sparkles, Plus, Film, Tv } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AIRecommendations() {
    const { data: watchlist } = useWatchlist();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!watchlist || watchlist.length === 0) {
            toast.error('Add some items to your watchlist first!');
            return;
        }

        setIsLoading(true);
        try {
            // Prepare history for AI
            const history = watchlist.slice(0, 20).map((entry) => ({
                title: entry.mediaItem.title,
                year: entry.mediaItem.year,
                userRating: entry.rating,
                isFavorite: entry.isFavorite,
                userNotes: entry.notes,
            }));

            const results = await aiApi.getRecommendations(history);
            setRecommendations(results);
            if (results.length === 0) {
                toast('No recommendations found. Try adding more varied content.');
            }
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            toast.error('Failed to generate recommendations. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-8">
                <div className="p-3 bg-indigo-100 rounded-full">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Smart Recommendations</h2>
                    <p className="text-gray-600 max-w-md mx-auto mt-2">
                        Get personalized movie and TV show suggestions based on your watchlist, ratings, and notes.
                    </p>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !watchlist || watchlist.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    {isLoading ? 'Analyzing your taste...' : 'Generate Recommendations'}
                </Button>
            </div>

            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec, index) => (
                        <Card key={index} className="overflow-hidden border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-indigo-900">{rec.title}</CardTitle>
                                        <CardDescription className="flex items-center mt-1">
                                            {rec.type === 'MOVIE' ? <Film className="w-3 h-3 mr-1" /> : <Tv className="w-3 h-3 mr-1" />}
                                            {rec.year} • {rec.rating}/10
                                        </CardDescription>
                                    </div>
                                    <div className="bg-white px-2 py-1 rounded text-xs font-semibold text-indigo-600 border border-indigo-100">
                                        {rec.genre?.[0]}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{rec.plot}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {rec.genre?.slice(1).map((g, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                                <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(rec.title + ' ' + rec.year)}`, '_blank')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Search on Google
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
