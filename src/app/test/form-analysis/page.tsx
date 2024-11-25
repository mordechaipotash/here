import { Suspense } from 'react';
import { FormAnalysisTest } from '@/components/test/FormAnalysisTest';
import { Toaster } from 'sonner';

export default function FormAnalysisTestPage() {
  return (
    <>
      <Toaster />
      <Suspense fallback={<div>Loading...</div>}>
        <FormAnalysisTest />
      </Suspense>
    </>
  );
}
