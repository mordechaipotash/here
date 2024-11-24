export interface EmailClient {
  name: string
  company: string
  color: string
}

export interface PdfAttachment {
  filename: string
  public_url: string
  pages: {
    id: string
    page_number: number
    image_url: string
    form_type: string | null
  }[]
}

export interface EmailWithMetadata {
  email_id: string
  message_id: string
  date: string
  subject: string
  snippet: string
  body_html: string
  from: {
    name: string | null
    email: string
  }
  client_id: string
  track: string
  client: EmailClient
  pdf_count: number
  total_pages: number
  pdfs: PdfAttachment[]
}

export interface EmailFilter {
  selectedTrack?: string | null
}
