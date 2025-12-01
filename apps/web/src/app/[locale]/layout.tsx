import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/context/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ChatBot } from '@/components/ai/ChatBot';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export async function generateMetadata(_params: LocaleLayoutProps) {
  return {
    title: 'InFocus - Media Tracking & Recommendations',
    description:
      'Track your favorite movies and TV shows, get personalized recommendations, and share with family.',
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <AuthProvider>
              <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col md:flex-row">
                <Sidebar />
                <main className="flex-grow p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
                  <MobileHeader />
                  {children}
                  <ChatBot />
                  <SpeedInsights />
                </main>
              </div>
              <Toaster position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}