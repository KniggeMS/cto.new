import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/query-provider';
import { AuthProvider } from '@/lib/context/auth-context';
import { Navigation } from '@/components/layout/Navigation';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InFocus - Media Tracking & Recommendations',
  description:
    'Track your favorite movies and TV shows, get personalized recommendations, and share with family.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <Navigation />
            <main className="min-h-screen bg-gray-50">{children}</main>
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
