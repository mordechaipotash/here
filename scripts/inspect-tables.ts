import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function inspectTables() {
  console.log('Inspecting email_view table:')
  const { data: emailView, error: emailError } = await supabase
    .from('email_view')
    .select('*')
    .limit(1)
  
  if (emailError) console.error('Error fetching email_view:', emailError)
  else console.log(JSON.stringify(emailView, null, 2))

  console.log('\nInspecting attachments table:')
  const { data: attachments, error: attachError } = await supabase
    .from('attachments')
    .select('*')
    .limit(1)
  
  if (attachError) console.error('Error fetching attachments:', attachError)
  else console.log(JSON.stringify(attachments, null, 2))

  console.log('\nInspecting pdf_pages table:')
  const { data: pdfPages, error: pdfError } = await supabase
    .from('pdf_pages')
    .select('*')
    .limit(1)
  
  if (pdfError) console.error('Error fetching pdf_pages:', pdfError)
  else console.log(JSON.stringify(pdfPages, null, 2))
}

inspectTables().catch(console.error)
