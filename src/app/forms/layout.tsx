'use client';

import { ClientProvider } from '@/components/providers/ClientProvider';
import { FormTypeExtractor } from '@/components/FormTypeExtractor';

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
      <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 p-4 border-r">
            <h2 className="text-lg font-semibold mb-4">Form Tools</h2>
            <FormTypeExtractor />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-4">
            {children}
          </div>
        </div>
      </div>
    </ClientProvider>
  );
}
