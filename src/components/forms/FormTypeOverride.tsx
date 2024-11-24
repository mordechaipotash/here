'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FormTypeOverrideProps {
  attachmentId: string;
  currentFormType?: string;
  onOverride?: (formType: string) => void;
}

export const FormTypeOverride = ({
  attachmentId,
  currentFormType,
  onOverride,
}: FormTypeOverrideProps) => {
  const [selectedType, setSelectedType] = useState<string>(currentFormType || 'unclassified');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const formTypes = [
    { value: 'unclassified', label: 'Unclassified' },
    { value: '8850', label: '8850 Form' },
    { value: '8QF', label: '8 Question Form' },
    { value: 'NYYF_1', label: 'NYYF 1' },
    { value: 'NYYF_2', label: 'NYYF 2' }
  ];

  const handleOverride = async (formType: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pdf_pages')
        .update({ form_type: formType })
        .eq('attachment_id', attachmentId);

      if (error) throw error;
      
      setSelectedType(formType);
      if (onOverride) onOverride(formType);
    } catch (error) {
      console.error('Error updating form type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <select
        value={selectedType}
        onChange={(e) => handleOverride(e.target.value)}
        disabled={isLoading}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        {formTypes.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};
