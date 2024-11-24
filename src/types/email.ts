export interface Attachment {
  id: string;
  email_id: string;
  filename: string;
  content_type: string;
  preview_url?: string;
  pdf_pages?: PDFPage[];
}

export interface GeminiField {
  text: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  field_type: string;  // e.g., 'first_name', 'last_name', 'dob', etc.
  page_number: number;
}

export interface PDFPage {
  id: string;
  attachment_id: string;
  pdf_filename: string;
  page_number: number;
  image_url: string;
  text_content?: string;
  ocr_text?: string;
  form_type?: string;
  form_data?: any;
  created_at: string;
  updated_at: string;
  gemini_fields?: GeminiField[];
}

export interface ApplicantForm {
  '8850'?: PDFPage;
  '8QF'?: PDFPage;
  'NYYF_1'?: PDFPage;
  'NYYF_2'?: PDFPage;
}

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  forms: ApplicantForm;
  status?: {
    eligible?: 'yes' | 'no' | 'flag';
    signed?: boolean;
    dateSigned?: string;
  };
}

export interface Email {
  id: string;
  email_id?: string;
  date: string | null;
  subject: string | null;
  snippet: string | null;
  source: string;
  client_name: string | null;
  label_color: string;
  pdfCount: number;
  pageCount: number;
  processing_status?: 'unprocessed' | 'processed' | 'followup';
  attachments?: Attachment[];
  pdf_pages?: PDFPage[];
}

export interface EmailFilter {
  status?: Email['status'];
  clientId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EmailsResponse {
  emails: Email[];
  total: number;
}
