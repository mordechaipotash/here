export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          client_id: string | null
          client_name: string | null
          company_name: string
          display_color: string
          status: string
          numeric_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          client_name?: string | null
          company_name: string
          display_color?: string
          status?: string
          numeric_id?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          client_name?: string | null
          company_name?: string
          display_color?: string
          status?: string
          numeric_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      emails: {
        Row: {
          email_id: string
          message_id: string | null
          thread_id: string | null
          from_email: string | null
          from_name: string | null
          to_email: string[] | null
          cc_email: string[] | null
          bcc_email: string[] | null
          subject: string | null
          snippet: string | null
          body_text: string | null
          body_html: string | null
          received_at: string | null
          date: string | null
          processed: boolean
          client_ref_id: string | null
          track: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          email_id?: string
          message_id?: string | null
          thread_id?: string | null
          from_email?: string | null
          from_name?: string | null
          to_email?: string[] | null
          cc_email?: string[] | null
          bcc_email?: string[] | null
          subject?: string | null
          snippet?: string | null
          body_text?: string | null
          body_html?: string | null
          received_at?: string | null
          date?: string | null
          processed?: boolean
          client_ref_id?: string | null
          track?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email_id?: string
          message_id?: string | null
          thread_id?: string | null
          from_email?: string | null
          from_name?: string | null
          to_email?: string[] | null
          cc_email?: string[] | null
          bcc_email?: string[] | null
          subject?: string | null
          snippet?: string | null
          body_text?: string | null
          body_html?: string | null
          received_at?: string | null
          date?: string | null
          processed?: boolean
          client_ref_id?: string | null
          track?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_domains: {
        Row: {
          id: string
          domain: string
          client_ref_id: string
          is_primary: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          client_ref_id: string
          is_primary?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          client_ref_id?: string
          is_primary?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      email_view: {
        Row: {
          email_id: string
          message_id: string | null
          from_email: string | null
          from_name: string | null
          subject: string | null
          snippet: string | null
          body_text: string | null
          body_html: string | null
          received_at: string | null
          date: string | null
          processed: boolean
          created_at: string
          updated_at: string
          track: boolean
          client_ref_id: string | null
          client_id: string | null
          client_name: string | null
          company_name: string | null
          display_name: string | null
          label_color: string | null
        }
      }
      email_statistics: {
        Row: {
          day: string | null
          total_emails: number | null
          unique_senders: number | null
          unique_threads: number | null
        }
      }
    }
    Functions: {
      fetch_latest_email: {
        Args: Record<string, never>
        Returns: {
          email_id: string
          message_id: string
          from_email: string
          subject: string
          received_at: string
        }
      }
    }
  }
}
