"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    role: "user" | "model";
    content: string;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", content: "Hi! Ich bin dein Film-Assistent. Frag mich etwas über deine Sammlung oder lass dir etwas empfehlen!" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:3001/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Fehler beim Senden");
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: "model", content: data.response }]);
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", content: `Fehler: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md h-[600px] rounded-2xl border border-slate-800 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Bot className="w-5 h-5" />
                        <span className="font-bold">CineLog AI</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                ? "bg-cyan-500 text-slate-950 rounded-tr-none"
                                : "bg-slate-800 text-slate-200 rounded-tl-none"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
                                Tippt...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Frag mich etwas..."
                            className="flex-1 bg-slate-800 text-white text-sm px-4 py-2 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
