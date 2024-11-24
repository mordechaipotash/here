'use client';

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface PDFViewerProps {
  pdfUrl: string;
  filename: string;
  onClose: () => void;
}

export function PDFViewer({ pdfUrl, filename, onClose }: PDFViewerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full h-full md:w-4/5 md:h-5/6 rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{filename}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1 p-4">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded border border-gray-200"
            title={filename}
          />
        </div>
      </div>
    </div>
  );
}
