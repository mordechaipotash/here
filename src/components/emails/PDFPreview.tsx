'use client';

import { useState } from 'react';
import { Attachment, PDFPage } from '../../types/email';

interface PDFPreviewProps {
  attachment: Attachment;
  pdfPages: PDFPage[];
}

export const PDFPreview = ({ attachment, pdfPages }: PDFPreviewProps) => {
  console.log('PDFPreview props:', {
    attachment,
    pdfPages,
    pdfPagesLength: pdfPages?.length
  });

  const [startPage, setStartPage] = useState(1);
  
  // Debug logging
  console.log('=== PDFPreview Debug ===');
  console.log('Attachment:', {
    id: attachment.id,
    filename: attachment.filename
  });
  console.log('PDF Pages:', pdfPages);

  const formTypes = [
    { value: 'unclassified', label: 'Unclassified' },
    { value: '8850', label: '8850 Form' },
    { value: '8QF', label: '8 Question Form' },
    { value: 'NYYF_1', label: 'NYYF 1' },
    { value: 'NYYF_2', label: 'NYYF 2' }
  ];

  const handleFormTypeChange = async (id: string, formType: string) => {
    try {
      const response = await fetch('/api/update-form-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId: id, formType }),
      });
      if (!response.ok) {
        throw new Error('Failed to update form type');
      }
      window.location.reload();
    } catch (error) {
      console.error('Error updating form type:', error);
    }
  };

  if (!pdfPages || pdfPages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No pages available</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filename Header */}
      <div className="mb-4 text-lg font-medium">{attachment.filename}</div>
      
      {/* PDF Pages Grid */}
      <div className="grid grid-cols-4 gap-4">
        {pdfPages.map((page) => (
          <div key={page.id} className="relative flex flex-col">
            {/* Form Type Dropdown */}
            <select
              value={page.form_type || 'unclassified'}
              onChange={(e) => handleFormTypeChange(page.id, e.target.value)}
              className="absolute top-2 left-2 right-2 z-10 bg-white/90 border rounded px-2 py-1 text-sm"
            >
              {formTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            
            {/* Page Image */}
            <div className="relative bg-white rounded-lg shadow overflow-hidden">
              <img
                src={page.image_url}
                alt={`Page ${page.page_number}`}
                className="w-full aspect-[8.5/11] object-contain"
              />
              {/* Page Number Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 text-center py-1 text-sm">
                Page {page.page_number}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
