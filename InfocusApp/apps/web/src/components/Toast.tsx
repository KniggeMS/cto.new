"use client";

import { CheckCircle2, X, AlertCircle, Info } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = "success", isVisible, onClose, duration = 3000 }: ToastProps) {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsShowing(true);
            const timer = setTimeout(() => {
                setIsShowing(false);
                setTimeout(onClose, 300); // Wait for animation
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible && !isShowing) return null;

    const bgColors = {
        success: "bg-green-500/10 border-green-500/20 text-green-400",
        error: "bg-red-500/10 border-red-500/20 text-red-400",
        info: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform ${isShowing ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                } ${bgColors[type]}`}
        >
            {icons[type]}
            <span className="text-sm font-medium">{message}</span>
            <button
                onClick={() => setIsShowing(false)}
                className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
