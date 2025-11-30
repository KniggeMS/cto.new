import { ChatInterface } from '@/components/ai/ChatInterface';
import { useTranslations } from 'next-intl';

export default function ChatPage() {
    const t = useTranslations('Chat');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant</h1>
                <p className="text-gray-600">
                    Ask me anything about movies, series, or get personalized recommendations.
                </p>
            </div>
            <ChatInterface />
        </div>
    );
}
