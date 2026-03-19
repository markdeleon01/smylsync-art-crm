import Link from 'next/link';
import { DashboardBreadcrumb } from './breadcrumb';
import { SearchInput } from './search';
import { User } from './user';
import { MobileNav } from './nav-item';
import { DesktopNav } from './nav-item';
import { LoadingSpinner } from './loading-spinner';

export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <DashboardBreadcrumb />
        <SearchInput />
        <User />
      </header>
      <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 flex-1">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-3xl font-semibold text-gray-700 mt-4">Not Found</h2>
          <p className="text-gray-600 mt-2">This page could not be found</p>
        </div>
        <Link
          href="/"
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
