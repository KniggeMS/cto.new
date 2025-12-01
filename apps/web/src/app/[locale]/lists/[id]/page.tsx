'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listsApi, CustomList } from '@/lib/api/lists';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Loader2, ArrowLeft, Trash2, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MediaCard } from '@/components/media/MediaCard';

export default function ListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [list, setList] = useState<CustomList | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchList(params.id as string);
        }
    }, [params.id]);

    const fetchList = async (id: string) => {
        try {
            const data = await listsApi.getList(id);
            setList(data);
        } catch (error) {
            console.error('Failed to fetch list:', error);
            toast.error('Failed to load list');
            router.push('/lists');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveItem = async (mediaItemId: string) => {
        if (!list) return;
        try {
            await listsApi.removeItem(list.id, mediaItemId);
            setList((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    items: prev.items?.filter((item) => item.mediaItemId !== mediaItemId),
                };
            });
            toast.success('Item removed');
        } catch (error) {
            console.error('Failed to remove item:', error);
            toast.error('Failed to remove item');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!list) return null;

    return (
        <Container className="py-8">
            <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lists
            </Button>

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{list.name}</h1>
                    {list.description && <p className="text-muted-foreground">{list.description}</p>}
                    <p className="text-sm text-muted-foreground mt-2">
                        {list.items?.length || 0} items • Created {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Future: Share button */}
                    <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {list.items?.map((entry) => (
                    <div key={entry.id} className="relative group">
                        <MediaCard item={entry.mediaItem} />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                                e.preventDefault();
                                handleRemoveItem(entry.mediaItemId);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                {list.items?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        This list is empty. Add some movies or TV shows!
                    </div>
                )}
            </div>
        </Container>
    );
}
