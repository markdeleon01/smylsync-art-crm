import ArtBot from '@/components/art';
import { Analytics } from '@vercel/analytics/react';
import { User } from './user';
import Providers from './providers';
// import { SearchInput } from './search';
import { DashboardBreadcrumb } from './breadcrumb';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';
import ChatShell from './chat-shell';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <main className="flex min-h-screen w-full flex-col bg-muted/40">
        <DesktopNav />
        <ChatShell>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <MobileNav />
            <DashboardBreadcrumb />
            {/* <SearchInput /> */}
            <div className="ml-auto">
              <User />
            </div>
          </header>
          <main className="grid flex-1 items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">
            {children}
          </main>
          <ArtBot />
        </ChatShell>
        <Analytics />
      </main>
    </Providers>
  );
}
