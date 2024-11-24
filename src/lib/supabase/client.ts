import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Utility types for easier access to database types
export type Tables = Database['public']['Tables']
export type EmailRow = Tables['emails']['Row']
export type ClientRow = Tables['clients']['Row']
export type EmailDomainRow = Tables['email_domains']['Row']

// View types
export type EmailView = Database['public']['Views']['email_view']['Row']
export type EmailStats = Database['public']['Views']['email_statistics']['Row']

// Helper function to handle Supabase errors consistently
export const handleSupabaseError = (error: unknown) => {
  console.error('Supabase error:', error)
  throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred')
}

// Typed queries for common operations
export const queries = {
  // Email queries
  emails: {
    getById: async (emailId: string) => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('email_id', emailId)
        .single()
      
      if (error) handleSupabaseError(error)
      return data
    },
    
    getByClientId: async (clientId: string) => {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('client_ref_id', clientId)
        .order('received_at', { ascending: false })
      
      if (error) handleSupabaseError(error)
      return data
    },
    
    updateProcessed: async (emailId: string, processed: boolean) => {
      const { data, error } = await supabase
        .from('emails')
        .update({ processed })
        .eq('email_id', emailId)
        .select()
        .single()
      
      if (error) handleSupabaseError(error)
      return data
    }
  },

  // Client queries
  clients: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('company_name')
      
      if (error) handleSupabaseError(error)
      return data
    },

    getById: async (clientId: string) => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error) handleSupabaseError(error)
      return data
    },

    getDomains: async (clientId: string) => {
      const { data, error } = await supabase
        .from('email_domains')
        .select('*')
        .eq('client_ref_id', clientId)
      
      if (error) handleSupabaseError(error)
      return data
    }
  },

  // Statistics queries
  statistics: {
    getEmailStats: async () => {
      const { data, error } = await supabase
        .from('email_statistics')
        .select('*')
        .order('day', { ascending: false })
      
      if (error) handleSupabaseError(error)
      return data
    }
  }
}
