import type { EmailWithMetadata, EmailFilter, PdfAttachment } from '@/types/email-view'
import { createSupabaseClient } from '@/lib/supabase'

const supabase = createSupabaseClient()

export async function getEmails({ selectedTrack }: { selectedTrack?: string | null }): Promise<EmailWithMetadata[]> {
  let query = supabase
    .from('email_view')
    .select(`
      *,
      pdf_pages(
        id,
        pdf_filename,
        page_number,
        image_url,
        form_type
      )
    `)
    .order('date', { ascending: false })

  if (selectedTrack !== 'all' && selectedTrack !== undefined) {
    query = query.eq('track', selectedTrack)
  }

  const { data: rawData, error } = await query

  if (error) {
    console.error('Error fetching emails:', error)
    throw error
  }

  // Process the raw data to group PDFs and their pages
  const emailsMap = new Map<string, EmailWithMetadata>()

  rawData?.forEach(row => {
    if (!emailsMap.has(row.email_id)) {
      // Initialize email object
      emailsMap.set(row.email_id, {
        email_id: row.email_id,
        message_id: row.message_id,
        date: row.date,
        subject: row.subject,
        snippet: row.snippet,
        body_html: row.body_html,
        from: {
          name: row.from_name,
          email: row.from_email
        },
        client: {
          name: row.client_name,
          company: row.company_name,
          color: row.label_color
        },
        track: row.track,
        pdfs: [],
        pdf_count: 0,
        total_pages: 0
      })
    }

    const email = emailsMap.get(row.email_id)!

    // Group pages by PDF filename
    if (Array.isArray(row.pdf_pages)) {
      row.pdf_pages.forEach((page: any) => {
        const filename = page.pdf_filename
        let pdf = email.pdfs.find(p => p.filename === filename)
        
        if (!pdf) {
          pdf = {
            filename: filename,
            public_url: '', // We'll get this from the filename
            pages: []
          }
          email.pdfs.push(pdf)
          email.pdf_count++
        }

        if (!pdf.pages.some(p => p.page_number === page.page_number)) {
          pdf.pages.push({
            id: page.id,
            page_number: page.page_number,
            image_url: page.image_url,
            form_type: page.form_type
          })
          email.total_pages++
        }
      })
    }
  })

  // Sort PDFs by filename and pages by page number
  const result = Array.from(emailsMap.values()).map(email => ({
    ...email,
    pdfs: email.pdfs
      .sort((a, b) => a.filename.localeCompare(b.filename))
      .map(pdf => ({
        ...pdf,
        pages: pdf.pages.sort((a, b) => a.page_number - b.page_number)
      }))
  }))

  // Log some debug information
  console.log('Processed emails with PDF counts:', 
    result.map(e => ({
      id: e.email_id,
      subject: e.subject,
      pdfs: e.pdf_count,
      pages: e.total_pages,
      pdfDetails: e.pdfs.map(p => ({
        name: p.filename,
        pages: p.pages.length
      }))
    }))
  )

  return result
}

export async function getTrackCounts(): Promise<{ track: string; count: number }[]> {
  const { data, error } = await supabase
    .from('email_view')
    .select('track')
    .not('track', 'is', null)

  if (error) {
    console.error('Error fetching track counts:', error)
    throw error
  }

  const counts = data.reduce((acc, { track }) => {
    acc[track] = (acc[track] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(counts).map(([track, count]) => ({
    track,
    count
  }))
}

export async function updateFormType(pageId: string, formType: string): Promise<void> {
  console.log('Calling updateFormType with:', { pageId, formType })
  
  const { error } = await supabase
    .from('pdf_pages')
    .update({ form_type: formType })
    .eq('id', pageId)

  if (error) {
    console.error('Error updating form type:', error)
    throw error
  }
  
  console.log('Successfully updated form type')
}

export async function updateTrack(emailId: string, track: string): Promise<void> {
  const { error } = await supabase
    .from('emails')
    .update({ track })  // The column is just called 'track'
    .eq('email_id', emailId)  // The column is email_id in both tables

  if (error) {
    console.error('Error updating track:', error)
    throw error
  }
}
