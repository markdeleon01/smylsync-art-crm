'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoadingSpinner() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect clicks on navigation links
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link) {
        const href = link.getAttribute('href');
        // Check if it's an internal navigation link (not external or hash-only)
        if (
          href &&
          !href.startsWith('http') &&
          !href.startsWith('#') &&
          href !== '/'
        ) {
          setIsLoading(true);
        } else if (href === '/') {
          // Home link
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  useEffect(() => {
    // Check if page was just reloaded
    const isPageReloading = sessionStorage.getItem('page-reloading');
    if (isPageReloading) {
      setIsLoading(true);
      sessionStorage.removeItem('page-reloading');
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Set flag before page unloads/reloads
    const handleBeforeUnload = () => {
      sessionStorage.setItem('page-reloading', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    // Detect navigation via router.push/replace
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    // Override push to show loader
    (router as any).push = function (href: string, options?: any) {
      setIsLoading(true);
      return originalPush(href, options);
    };

    // Override replace to show loader
    (router as any).replace = function (href: string, options?: any) {
      setIsLoading(true);
      return originalReplace(href, options);
    };

    return () => {
      (router as any).push = originalPush;
      (router as any).replace = originalReplace;
    };
  }, [router]);

  // Hide spinner after navigation completes (set a timeout as fallback)
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-auto">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"
            style={{ borderTopColor: '#FFA500' }}
          ></div>
        </div>

        {/* Loading text */}
        <p className="text-lg font-semibold text-gray-800">Loading...</p>
      </div>
    </div>
  );
}
