'use client';

import { useState } from 'react';
import { Email, Attachment, PDFPage } from '../../types/email';
import { format } from 'date-fns';
import { PDFPreview } from './PDFPreview';
import { FormTypeOverride } from '../forms/FormTypeOverride';
import { FormClassification } from '@/types/form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EmailViewProps {
  email: Email;
  onClose: () => void;
  onOpenWorkspace: (email: Email) => void;
}

export const EmailView = ({ email, onClose, onOpenWorkspace }: EmailViewProps) => {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const hasPDFs = email.attachments?.some(a => a.content_type === 'application/pdf') ?? false;
  const hasOtherAttachments = email.attachments?.some(a => a.content_type !== 'application/pdf') ?? false;

  const handleAttachmentClick = async (attachment: Attachment) => {
    console.log('Clicked attachment:', {
      id: attachment.id,
      filename: attachment.filename,
      contentType: attachment.content_type
    });

    if (attachment.content_type === 'application/pdf') {
      // Load PDF pages for this attachment
      const { data: pdfPages, error: pagesError } = await supabase
        .from('pdf_pages')
        .select('*')
        .eq('attachment_id', attachment.id);
      
      console.log('PDF Pages from DB:', pdfPages);

      if (pagesError) {
        console.error('Error loading PDF pages:', pagesError);
        return;
      }

      console.log('Loaded PDF pages:', pdfPages);
      
      // Update selected attachment with its pages
      setSelectedAttachment({
        ...attachment,
        pdf_pages: pdfPages
      });

      // Load form type if exists
      const { data, error } = await supabase
        .from('pdf_pages')
        .select('form_type')
        .eq('attachment_id', attachment.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading form type:', error);
      }
      
      setClassification(data?.form_type || 'unclassified');
    } else {
      setSelectedAttachment(attachment);
    }
  };

  const handleFormTypeUpdate = (formType: string) => {
    setClassification(formType);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Email content section */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-4">
          {/* Email header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <h2 className="text-xl font-semibold mb-2">{email.subject}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">From:</span>{' '}
                {email.from_name} &lt;{email.from_email}&gt;
              </div>
              <div>
                <span className="font-medium">Date:</span>{' '}
                {format(new Date(email.date), 'PPpp')}
              </div>
              <div>
                <span className="font-medium">Track:</span>{' '}
                <span className="capitalize">{email.track.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Email body */}
          <div 
            className="prose max-w-none bg-white rounded-lg shadow-sm p-6 mb-4" 
            dangerouslySetInnerHTML={{ __html: email.body_html ?? '' }} 
          />
        </div>
      </div>

      {/* PDF preview section */}
      {hasPDFs && (
        <div className="h-1/2 border-t">
          <div className="p-4 bg-white border-b">
            <h3 className="font-medium">PDF Attachments</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {email.attachments
                ?.filter(a => a.content_type === 'application/pdf')
                .map((attachment) => (
                  <div
                    key={attachment.id}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate flex-1">
                        {attachment.filename}
                      </div>
                    </div>
                    {attachment.preview_url && (
                      <img
                        src={attachment.preview_url}
                        alt="PDF preview"
                        className="w-full h-32 object-cover rounded"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {selectedAttachment && (
        <div className="p-4 bg-white border-b">
          <h3 className="font-medium">Form Type Classification</h3>
          <FormTypeOverride
            attachmentId={selectedAttachment.id}
            currentFormType={classification}
            onOverride={handleFormTypeUpdate}
          />
        </div>
      )}
      {selectedAttachment && (
        <div className="p-4">
          <PDFPreview
            attachment={selectedAttachment}
            pdfPages={selectedAttachment.pdf_pages ?? []}
          />
          {console.log('Rendering PDFPreview with:', {
            selectedAttachment,
            filteredPages: selectedAttachment.pdf_pages
          })}
        </div>
      )}
    </div>
  );
};
