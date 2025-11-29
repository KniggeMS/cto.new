'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/context/auth-context';
import { useLocaleNavigation } from '@/lib/hooks/use-locale';
import { LocaleSwitcher } from '@/components/i18n/LocaleSwitcher';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const { push, locale } = useLocaleNavigation();
  const t = useTranslations('navigation');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/watchlist', label: t('watchlist') },
    { href: '/search', label: t('search') },
    { href: '/family', label: t('family') },
    { href: '/settings', label: t('settings') },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => push('/')}
              className="flex-shrink-0 text-left"
            >
              <span className="text-xl sm:text-2xl font-bold text-primary-600">
                InFocus
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === `/${locale}${item.href}`;
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <LocaleSwitcher />
            <span className="text-sm text-gray-700 truncate max-w-[150px]">
              {user?.displayName || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              {t('logout')}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 truncate max-w-[80px]">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                <svg
                  className={cn('h-6 w-6', isMobileMenuOpen && 'hidden')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Close icon */}
                <svg
                  className={cn('h-6 w-6', !isMobileMenuOpen && 'hidden')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div className={cn('md:hidden', isMobileMenuOpen ? 'block' : 'hidden')}>
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
          {navItems.map((item) => {
            const isActive = pathname === `/${locale}${item.href}`;
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium transition-colors w-full',
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {item.label}
              </Link>
            );
          })}
          
          {/* Mobile user info and logout */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="px-3 py-2">
              <LocaleSwitcher />
            </div>
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <div className="px-3 py-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="w-full justify-center"
              >
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
