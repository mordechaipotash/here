'use client';

import { ClientProvider } from '@/components/providers/ClientProvider';

export default function EmailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
      {children}
    </ClientProvider>
  );
}
