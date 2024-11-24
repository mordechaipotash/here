import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a singleton instance of the Supabase client
export const db = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Database error handler
export const handleDbError = (error: unknown) => {
  console.error('Database error:', error)
  throw error
}

// Typed database operations
export const dbOperations = {
  // Email operations
  emails: {
    async getAll() {
      const { data, error } = await db
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) handleDbError(error)
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await db
        .from('emails')
        .select('*')
        .eq('email_id', id)
        .single()
      
      if (error) handleDbError(error)
      return data
    },
  },
  
  // Client operations
  clients: {
    async getAll() {
      const { data, error } = await db
        .from('clients')
        .select('*')
        .order('company_name')
      
      if (error) handleDbError(error)
      return data
    },
    
    async getById(id: string) {
      const { data, error } = await db
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) handleDbError(error)
      return data
    },
  },
  
  // Form operations
  forms: {
    async getTypes() {
      const { data, error } = await db
        .from('form_types')
        .select('*')
        .order('name')
      
      if (error) handleDbError(error)
      return data
    },
  },
}
