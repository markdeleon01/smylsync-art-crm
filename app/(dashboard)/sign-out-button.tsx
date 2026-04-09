'use client';

import { useState } from 'react';

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSubmit = () => {
    setIsSigningOut(true);
  };

  return (
    <>
      {isSigningOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
            <p className="text-sm font-medium text-foreground">
              Signing out...
            </p>
          </div>
        </div>
      )}
      <form action="/api/auth/logout" method="POST" onSubmit={handleSubmit}>
        <button
          type="submit"
          className="w-full cursor-default bg-transparent p-0 text-left text-sm outline-none"
        >
          Sign Out
        </button>
      </form>
    </>
  );
}
