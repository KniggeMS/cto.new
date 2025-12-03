"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Anmeldung fehlgeschlagen");
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

    const handleDemoLogin = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "BigDaddy", password: "password123" }), // Assuming this demo user exists
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Demo Login fehlgeschlagen");
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            window.dispatchEvent(new Event("auth-change"));
            window.dispatchEvent(new Event("list-updated"));
            router.push("/");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Benutzername / E-Mail Adresse
                    </label>
                    <input
                        required
                        type="text"
                        placeholder="Benutzername"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Passwort
                        </label>
                        <Link href="#" className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">
                            Passwort vergessen?
                        </Link>
                    </div>
                    <input
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 mt-2 flex items-center justify-center"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Anmelden"}
                </button>

                <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border border-slate-600"
                >
                    <User className="w-4 h-4" />
                    <span>Demo Login (BigDaddy)</span>
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-slate-400 text-sm">
                    Noch kein Konto?{" "}
                    <Link href="/register" className="text-slate-300 hover:text-white transition-colors font-medium">
                        Hier registrieren
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
