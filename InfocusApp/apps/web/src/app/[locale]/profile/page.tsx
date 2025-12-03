"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Upload, Sparkles, Save, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ProfilePage() {
    const router = useRouter();
    const t = useTranslations('Profile');
    const tCommon = useTranslations('Common');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Password Form
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:3001/api/auth/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    // Update local storage to keep it in sync
                    localStorage.setItem("user", JSON.stringify(data));
                } else {
                    router.push("/login");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleGenerateAvatar = async () => {
        setUpdating(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3001/api/auth/generate-avatar", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("auth-change"));
            } else {
                const data = await res.json();
                throw new Error(data.error || "Generation failed");
            }
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Fehler beim Generieren des Avatars.");
        } finally {
            setUpdating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUpdating(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload File
            const uploadRes = await fetch("http://localhost:3001/api/upload", {
                method: "POST",
                body: formData
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            // 2. Update Profile
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3001/api/auth/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ avatarUrl: url })
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("auth-change"));
            }
        } catch (error) {
            console.error(error);
            alert("Fehler beim Hochladen.");
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            alert(t('passwordMismatch'));
            return;
        }

        setUpdating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3001/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwords.oldPassword,
                    newPassword: passwords.newPassword
                })
            });

            if (res.ok) {
                alert(t('passwordChanged'));
                setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const data = await res.json();
                alert(data.error || "Fehler beim Ändern des Passworts.");
            }
        } catch (error) {
            console.error(error);
            alert("Ein Fehler ist aufgetreten.");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-12 text-slate-500 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-xl">
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {updating && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={handleGenerateAvatar}
                                disabled={updating}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>{t('generateAvatar')}</span>
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={updating}
                                />
                                <button
                                    disabled={updating}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition-colors border border-slate-700"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{t('uploadImage')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4">{t('info')}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('username')}</label>
                                <p className="text-slate-300 font-medium">{user.username}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('email')}</label>
                                <p className="text-slate-300 font-medium">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('memberSince')}</label>
                                <p className="text-slate-300 font-medium">Dezember 2024</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-medium text-white">{t('changePassword')}</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('currentPassword')}</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                    value={passwords.oldPassword}
                                    onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('newPassword')}</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                    value={passwords.newPassword}
                                    onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('confirmPassword')}</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                    value={passwords.confirmPassword}
                                    onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors mt-4"
                            >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{tCommon('save')}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
