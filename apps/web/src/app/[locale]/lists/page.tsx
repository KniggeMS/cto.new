'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { listsApi, CustomList } from '@/lib/api/lists';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader2, Plus, Trash2, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ListsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [lists, setLists] = useState<CustomList[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');

    useEffect(() => {
        fetchLists();
    }, []);

    const fetchLists = async () => {
        try {
            const data = await listsApi.getLists();
            setLists(data);
        } catch (error) {
            console.error('Failed to fetch lists:', error);
            toast.error('Failed to load lists');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        try {
            setIsCreating(true);
            await listsApi.createList({ name: newListName });
            setNewListName('');
            toast.success('List created successfully');
            fetchLists();
        } catch (error) {
            console.error('Failed to create list:', error);
            toast.error('Failed to create list');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteList = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        if (!confirm('Are you sure you want to delete this list?')) return;

        try {
            await listsApi.deleteList(id);
            setLists(lists.filter((l) => l.id !== id));
            toast.success('List deleted');
        } catch (error) {
            console.error('Failed to delete list:', error);
            toast.error('Failed to delete list');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Container className="py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Lists</h1>
                    <p className="text-muted-foreground">Organize your movies and TV shows</p>
                </div>
            </div>

            {/* Create List Form */}
            <Card className="mb-8 p-4">
                <form onSubmit={handleCreateList} className="flex gap-4">
                    <Input
                        placeholder="Create a new list..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isCreating || !newListName.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border-0"
                    >
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Create
                    </Button>
                </form>
            </Card>

            {/* Lists Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {lists.map((list) => (
                    <Link key={list.id} href={`/lists/${list.id}`}>
                        <Card className="group relative h-full p-6 transition-colors hover:bg-accent/50">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold group-hover:text-primary">{list.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {list._count?.items || 0} items • {new Date(list.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {list.isPublic ? (
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute bottom-4 right-4 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                                onClick={(e) => handleDeleteList(list.id, e)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </Card>
                    </Link>
                ))}

                {lists.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No lists yet. Create one above!
                    </div>
                )}
            </div>
        </Container>
    );
}
