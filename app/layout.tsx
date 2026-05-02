import './globals.css';

import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { LoadingSpinner } from './(dashboard)/loading-spinner';

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
  // Read the server-side env variable
  const serverTz = process.env.CLINIC_TIMEZONE || 'Asia/Manila';

  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        {/* Inject the server timezone as a global variable */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CLINIC_TIMEZONE__ = ${JSON.stringify(serverTz)};`
          }}
        />
        {children}
        <LoadingSpinner />
      </body>
      <Analytics />
    </html>
  );
}
