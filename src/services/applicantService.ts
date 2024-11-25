import { createSupabaseClient } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

const supabase = createSupabaseClient()

interface CreateApplicantData {
  firstName: string
  lastName: string
  ssn?: string
  dob?: string
  emailId: string
}

interface Applicant {
  id: string
  first_name: string
  last_name: string
  ssn: string | null
  dob: string | null
  email_id: string
  created_at: string
  assigned_forms: {
    id: string
    page_id: string
    form_type: string
    page: {
      id: string
      page_number: number
      image_url: string
    }
  }[]
}

export async function createApplicant(data: CreateApplicantData) {
  console.log('Creating applicant with data:', data)
  
  try {
    const { data: applicant, error } = await supabase
      .from('applicants')
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        ssn: data.ssn ? data.ssn.replace(/\D/g, '') : null,
        dob: data.dob || null,
        email_id: data.emailId
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating applicant:', error)
      throw error
    }

    return applicant
  } catch (error) {
    console.error('Error in createApplicant:', error)
    throw error
  }
}

export async function getApplicantsByEmail(emailId: string): Promise<Applicant[]> {
  if (!emailId) {
    throw new Error('Email ID is required')
  }

  try {
    const { data, error } = await supabase
      .from('applicants')
      .select(`
        *,
        assigned_forms:applicant_forms(
          id,
          page_id,
          form_type,
          page:pdf_pages(
            id,
            page_number,
            image_url
          )
        )
      `)
      .eq('email_id', emailId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applicants:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getApplicantsByEmail:', error)
    throw error
  }
}

export async function assignFormToApplicant(applicantId: string, pageId: string) {
  if (!applicantId || !pageId) {
    throw new Error('Applicant ID and Page ID are required')
  }

  try {
    const { error } = await supabase
      .from('applicant_forms')
      .insert({
        applicant_id: applicantId,
        page_id: pageId
      })

    if (error) {
      console.error('Error assigning form:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in assignFormToApplicant:', error)
    throw error
  }
}

export async function removeFormFromApplicant(applicantId: string, pageId: string) {
  if (!applicantId || !pageId) {
    throw new Error('Applicant ID and Page ID are required')
  }

  try {
    const { error } = await supabase
      .from('applicant_forms')
      .delete()
      .match({ 
        applicant_id: applicantId,
        page_id: pageId 
      })

    if (error) {
      console.error('Error removing form:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in removeFormFromApplicant:', error)
    throw error
  }
}

export async function getApplicantCountForPage(pageId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('applicant_forms')
      .select('applicant_id')
      .eq('page_id', pageId)

    if (error) {
      console.error('Error getting applicant count:', error)
      throw error
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in getApplicantCountForPage:', error)
    throw error
  }
}
