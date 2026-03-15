'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Page mappings for breadcrumb labels
  const pageMap = {
    '/': 'Home',
    '/patients': 'Patients',
    '/schedules': 'Schedules',
    '/claims': 'Claims',
    '/analytics': 'Analytics'
  };

  // Get the current page label
  const currentPageLabel = pageMap[pathname as keyof typeof pageMap] || 'Page';

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathname !== '/' && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
