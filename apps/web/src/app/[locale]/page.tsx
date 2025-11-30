'use client';

import { useTranslations } from 'next-intl';
import { useLocaleNavigation } from '@/lib/hooks/use-locale';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const t = useTranslations('common');
  const { push } = useLocaleNavigation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to InFocus
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Track your favorite movies and TV shows, get personalized recommendations, and share with family.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Personal Tracking</h2>
              <p className="text-gray-600 mb-4">
                Keep track of what you've watched, what you're planning to watch, and your personal ratings.
              </p>
              <Button
                variant="outline"
                onClick={() => push('/watchlist')}
              >
                {t('watchlist')}
              </Button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">Family Sharing</h2>
              <p className="text-gray-600 mb-4">
                Create families and share recommendations with your loved ones.
              </p>
              <Button
                variant="outline"
                onClick={() => push('/family')}
              >
                {t('family')}
              </Button>
            </div>
          </div>

          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => push('/search')}
            >
              {t('search')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => push('/login')}
            >
              {t('login')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}