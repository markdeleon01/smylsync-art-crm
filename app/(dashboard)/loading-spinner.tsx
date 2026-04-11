'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function LoadingSpinner() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Hide the spinner whenever the pathname changes — this fires after the
  // server component has fully rendered and committed its data to the DOM,
  // which is the correct signal that navigation is complete.
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    // Show spinner on any internal link click
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  useEffect(() => {
    // Show spinner when the browser is about to reload
    const handleBeforeUnload = () => setIsLoading(true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

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
