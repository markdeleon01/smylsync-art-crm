'use client';

import Link from 'next/link';
import {
  Home,
  LineChart,
  FileText,
  Calendar,
  Settings,
  Users2,
  Award
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { NavItem } from './nav-item';
import { Logo } from '@/components/logo';

export function DesktopNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Logo />

        <NavItem href="/" label="Home">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/patients" label="Patients">
          <Users2 className="h-5 w-5" />
        </NavItem>

        <NavItem href="/schedules" label="Schedules">
          <Calendar className="h-5 w-5" />
        </NavItem>

        <NavItem href="/claims" label="Claims">
          <FileText className="h-5 w-5" />
        </NavItem>

        <NavItem href="/credentialing" label="Credentialing">
          <Award className="h-5 w-5" />
        </NavItem>

        <NavItem href="/analytics" label="Analytics">
          <LineChart className="h-5 w-5" />
        </NavItem>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </aside>
  );
}
