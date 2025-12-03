"use client";

import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/config";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [avatarSeed, setAvatarSeed] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
    });

    // Generate initial avatar seed
    useEffect(() => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    }, []);

    const generateNewAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwörter stimmen nicht überein!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    avatarUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registrierung fehlgeschlagen");
            }

            // Store token
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Notify other components
            window.dispatchEvent(new Event("auth-change"));
            window.dispatchEvent(new Event("list-updated"));

            // Redirect
            router.push("/");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 rounded-full ring-1 ring-white/10 pointer-events-none" />
                </div>

                <div className="flex gap-2 w-full">
                    <button
                        type="button"
                        onClick={generateNewAvatar}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>Avatar generieren (AI)</span>
                    </button>
                    <button
                        type="button"
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 rounded-lg transition-colors border border-slate-700"
                    >
                        <Upload className="w-3 h-3" />
                        <span>Oder hochladen</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Benutzername
                    </label>
                    <input
                        required
                        type="text"
                        placeholder="Benutzername"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        E-Mail Adresse
                    </label>
                    <input
                        required
                        type="email"
                        placeholder="name@example.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Passwort
                        </label>
                        <input
                            required
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Bestätigen
                        </label>
                        <input
                            required
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Vorname
                        </label>
                        <input
                            type="text"
                            placeholder="Optional"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Nachname
                        </label>
                        <input
                            type="text"
                            placeholder="Optional"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 mt-2 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrieren"}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-slate-400 text-sm">
                    Bereits ein Konto?{" "}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        Hier anmelden
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
