'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './ui/button';

interface PdfPage {
  id: string;
  text_content: string;
  ocr_text: string;
  page_number: number;
}

export function FormTypeExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const supabase = createClientComponentClient();

  const extractFormTypes = async () => {
    try {
      setIsExtracting(true);
      
      // Get unprocessed attachments
      const { data: attachments, error: attachmentsError } = await supabase
        .from('attachments')
        .select('id')
        .eq('is_processed', false)
        .eq('content_type', 'application/pdf')
        .limit(10);

      if (attachmentsError) throw attachmentsError;
      
      if (!attachments || attachments.length === 0) {
        alert('No unprocessed PDF attachments to process');
        setIsExtracting(false);
        return;
      }

      // Get form types and their rules
      const { data: formTypes, error: formTypesError } = await supabase
        .from('form_types')
        .select('id, name, identification_rules');

      if (formTypesError) throw formTypesError;

      let totalPagesProcessed = 0;
      let formsIdentified = 0;

      // Process each attachment
      for (const attachment of attachments) {
        // Get all pages for this attachment
        const { data: pages, error: pagesError } = await supabase
          .from('pdf_pages')
          .select('id, text_content, ocr_text, page_number')
          .eq('attachment_id', attachment.id)
          .order('page_number');

        if (pagesError) throw pagesError;
        if (!pages || pages.length === 0) continue;

        totalPagesProcessed += pages.length;

        // Process each page
        for (const page of pages) {
          // Combine text_content and ocr_text for better matching
          const pageText = [page.text_content, page.ocr_text]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!pageText) continue;

          // Find matching form type for this page
          let bestMatch = null;
          let highestScore = 0;

          for (const formType of formTypes) {
            const rules = formType.identification_rules;
            if (!rules?.keywords || !rules?.required_fields) continue;

            // Calculate match score based on keywords and required fields
            let score = 0;
            const keywords = rules.keywords as string[];
            const requiredFields = rules.required_fields as string[];

            // Check keywords (60% weight)
            const keywordMatches = keywords.filter(keyword => 
              pageText.includes(keyword.toLowerCase())
            ).length;
            score += (keywordMatches / keywords.length) * 0.6;

            // Check required fields (40% weight)
            const fieldMatches = requiredFields.filter(field =>
              pageText.includes(field.toLowerCase())
            ).length;
            score += (fieldMatches / requiredFields.length) * 0.4;

            if (score > highestScore) {
              highestScore = score;
              bestMatch = formType;
            }
          }

          // Update page with form type if confidence threshold met
          if (bestMatch && highestScore >= 0.3) {
            const { error: updateError } = await supabase
              .from('pdf_pages')
              .update({ 
                form_type: bestMatch.name,
                confidence: highestScore,
                updated_at: new Date().toISOString()
              })
              .eq('id', page.id);

            if (updateError) throw updateError;
            formsIdentified++;
          }
        }

        // Update attachment status
        const { error: attachmentUpdateError } = await supabase
          .from('attachments')
          .update({ 
            is_processed: true,
            processing_error: null,
            processed_at: new Date().toISOString()
          })
          .eq('id', attachment.id);

        if (attachmentUpdateError) throw attachmentUpdateError;
      }

      alert(`Successfully processed ${totalPagesProcessed} pages from ${attachments.length} PDFs\nIdentified ${formsIdentified} forms`);
    } catch (error: any) {
      console.error('Error extracting form types:', error);
      alert('Failed to extract form types: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Button 
      onClick={extractFormTypes}
      disabled={isExtracting}
      className="w-full"
    >
      {isExtracting ? 'Extracting Form Types...' : 'Extract Form Types'}
    </Button>
  );
}
