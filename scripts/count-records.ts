const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getTableCounts() {
  // Get emails count
  const { count: emailCount, error: emailError } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })

  if (emailError) {
    console.error('Error counting emails:', emailError)
    return
  }

  // Get attachments count
  const { count: attachmentCount, error: attachmentError } = await supabase
    .from('attachments')
    .select('*', { count: 'exact', head: true })

  if (attachmentError) {
    console.error('Error counting attachments:', attachmentError)
    return
  }

  // Get pdf_pages count
  const { count: pdfCount, error: pdfError } = await supabase
    .from('pdf_pages')
    .select('*', { count: 'exact', head: true })

  if (pdfError) {
    console.error('Error counting PDF pages:', pdfError)
    return
  }

  console.log('Record counts:')
  console.log('Emails:', emailCount)
  console.log('Attachments:', attachmentCount)
  console.log('PDF Pages:', pdfCount)
}

getTableCounts()
