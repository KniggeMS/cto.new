
'use client';

import { PageShell } from '@/components/layout/PageShell';
import { ChatInterface } from '@/components/ai/ChatInterface';

export default function ChatPage() {
    return (
        <PageShell
            title="AI Chat Assistant"
            description="Chat with CineLog AI about your movies and get personalized help."
        >
            <div className="max-w-4xl mx-auto">
                <ChatInterface />
            </div>
        </PageShell>
    );
}
