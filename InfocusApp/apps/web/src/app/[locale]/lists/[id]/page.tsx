"use client";

import { ArrowLeft, Film, Trash2 } from "lucide-react";
import { MediaCard } from "@/components/MediaCard";
import { MediaDetailModal } from "@/components/MediaDetailModal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListPage({ params }: { params: { id: string } }) {
    const [list, setList] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`http://localhost:3001/api/lists/${params.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("List not found");
                return res.json();
            })
            .then(data => setList(data))
            .catch(e => console.error(e));

    }, [params.id]);

    const handleDeleteList = async () => {
        if (!confirm("Liste wirklich löschen?")) return;
        const token = localStorage.getItem("token");
        if (!token) return;

        await fetch(`http://localhost:3001/api/lists/${params.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        window.dispatchEvent(new Event("list-updated"));
        router.push("/");
    };

    if (!list) return <div className="p-12 text-slate-500">Lade Liste...</div>;

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{list.name}</h1>
                        <p className="text-slate-400">{list.items?.length || 0} Einträge</p>
                    </div>
                </div>

                <button
                    onClick={handleDeleteList}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Liste löschen</span>
                </button>
            </div>

            {/* Content */}
            {(!list.items || list.items.length === 0) ? (
                <div className="flex-1 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-12 min-h-[500px]">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-800">
                        <Film className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-500 mb-2">Diese Liste ist leer.</h3>
                    <p className="text-slate-600">Füge Filme über die Detailansicht hinzu.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {list.items.map((item: any) => (
                        <MediaCard
                            key={item.id}
                            item={item}
                            onClick={() => setSelectedItem(item)}
                        />
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
                <MediaDetailModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                />
            )}
        </div>
    );
}
