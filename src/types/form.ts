export interface FormType {
  id: string;
  name: string;
  description?: string;
  identification_rules: {
    keywords: string[];
    patterns: string[];
    required_fields: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface FormClassification {
  id: string;
  attachment_id: string;
  form_type_id: string;
  confidence_score: number;
  ocr_text: string;
  extracted_data: Record<string, any>;
  manual_override: boolean;
  last_modified_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  progress?: number;
  result?: FormClassification;
}
