"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { API_URL } from "@/config";

export default function LoginPage() {
    const router = useRouter();
    const t = useTranslations('Login');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('error_generic'));
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
            const res = await fetch(`${API_URL}/api/auth/login`, {
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
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {t('email_label')}
                    </label>
                    <input
                        required
                        type="text"
                        placeholder={t('email_placeholder')}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t('password_label')}
                        </label>
                        <Link href="#" className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors font-medium">
                            {t('forgot_password')}
                        </Link>
                    </div>
                    <input
                        required
                        type="password"
                        placeholder={t('password_placeholder')}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800 transition-all"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div className="pt-2 space-y-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('submit')}
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-wider border border-slate-700"
                    >
                        <User className="w-3.5 h-3.5" />
                        <span>{t('demo_login')}</span>
                    </button>
                </div>
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-500 text-xs">
                    {t('no_account')}{" "}
                    <Link href="/register" className="text-slate-400 hover:text-white transition-colors font-medium">
                        {t('register_link')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
