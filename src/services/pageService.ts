import { createSupabaseClient } from '@/lib/supabase'

const supabase = createSupabaseClient()

interface CreatePageData {
  pdf_page_id: string
  form_type: string
  page_number: number
  image_url: string
  email_id: string
}

export async function createPage(data: CreatePageData) {
  try {
    const { data: page, error } = await supabase
      .from('pdf_pages')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      throw error
    }

    return page
  } catch (error) {
    console.error('Error in createPage:', error)
    throw error
  }
}

export async function getPagesByEmailId(emailId: string) {
  try {
    const { data: pages, error } = await supabase
      .from('pdf_pages')
      .select('*')
      .eq('email_id', emailId)
      .order('page_number')

    if (error) {
      console.error('Error fetching pages:', error)
      throw error
    }

    return pages || []
  } catch (error) {
    console.error('Error in getPagesByEmailId:', error)
    throw error
  }
}

export async function updatePageFormType(pdfPageId: string, formType: string) {
  try {
    const { error } = await supabase
      .from('pdf_pages')
      .update({ form_type: formType })
      .eq('pdf_page_id', pdfPageId)

    if (error) {
      console.error('Error updating page form type:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in updatePageFormType:', error)
    throw error
  }
}
