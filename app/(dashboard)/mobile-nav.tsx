'use client';

import Link from 'next/link';
import {
  Home,
  LineChart,
  FileText,
  Calendar,
  PanelLeft,
  Users2,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle
} from '@/components/ui/sheet';
import { Logo } from '@/components/logo';

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <SheetTitle>
          <Logo />
        </SheetTitle>
        <nav className="grid gap-6 text-lg font-medium pt-[20px]">
          <SheetClose asChild>
            <Link
              href="/"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/patients"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users2 className="h-5 w-5" />
              Patients
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/schedules"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
              Schedules
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/claims"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-5 w-5" />
              Claims
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/credentialing"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Award className="h-5 w-5" />
              Credentialing
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/analytics"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LineChart className="h-5 w-5" />
              Analytics
            </Link>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
