export interface Email {
  email_id: string;
  subject: string;
  sender: string;
  received_date: string;
  processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  attachment_id: string;
  email_id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface PDFPage {
  page_id: string;
  attachment_id: string;
  page_number: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  applicant_id: string;
  email_id: string;
  first_name: string;
  last_name: string;
  forms: {
    [key: string]: {
      pdf_filename: string;
      page_number: number;
      image_url: string;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  public: {
    Tables: {
      emails: {
        Row: Email;
        Insert: Omit<Email, 'email_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Email, 'email_id' | 'created_at' | 'updated_at'>>;
      };
      email_attachments: {
        Row: EmailAttachment;
        Insert: Omit<EmailAttachment, 'attachment_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EmailAttachment, 'attachment_id' | 'created_at' | 'updated_at'>>;
      };
      pdf_pages: {
        Row: PDFPage;
        Insert: Omit<PDFPage, 'page_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PDFPage, 'page_id' | 'created_at' | 'updated_at'>>;
      };
      applicants: {
        Row: Applicant;
        Insert: Omit<Applicant, 'applicant_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Applicant, 'applicant_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
