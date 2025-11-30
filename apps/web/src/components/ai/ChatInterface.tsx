
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { aiApi } from '@/lib/api/ai';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatInterface() {
    const { data: watchlist } = useWatchlist();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hallo! Ich bin CineLog AI. Wie kann ich dir heute bei deinen Filmen und Serien helfen?',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Prepare context from watchlist
            const context = watchlist?.map((entry) => ({
                title: entry.mediaItem.title,
                year: entry.mediaItem.year,
                status: entry.status,
                userRating: entry.rating,
                isFavorite: entry.isFavorite,
            })) || [];

            const response = await aiApi.chatWithAI(userMessage.content, context);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
            <Card className="flex-1 flex flex-col overflow-hidden border-indigo-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-full">
                            <Bot className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-indigo-900">CineLog AI Assistant</CardTitle>
                            <p className="text-xs text-indigo-600 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Powered by Gemini 2.0 Flash
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                  max-w-[80%] rounded-2xl px-4 py-3 shadow-sm
                  ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }
                `}
                            >
                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                <p
                                    className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                                        }`}
                                >
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 shadow-sm flex items-center space-x-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                <span className="text-xs text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex space-x-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your movies, recommendations, or trivia..."
                            className="flex-1 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
