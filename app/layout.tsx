import './globals.css';

import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'SMYLSYNC Admin Rescue Tool (ART)',
  description:
    'SMYLSYNC Admin Rescue Tool (ART) is a powerful internal operations assistant designed to streamline administrative tasks and enhance efficiency for healthcare providers. With ART, you can easily manage patient records, schedules, claims, credentialing, and analytics all in one place. ART leverages advanced AI capabilities to provide real-time assistance, automate routine tasks, and deliver actionable insights, allowing you to focus on delivering exceptional care while optimizing your administrative workflows.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
