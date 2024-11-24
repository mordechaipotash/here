const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

// Load environment variables from .env.local.dev
dotenv.config({ path: '.env.local.dev' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PDF_SERVER_URL = 'http://localhost:3000'

async function createBuckets() {
  const buckets = ['pdfs', 'attachments', 'images']
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 52428800 // 50MB
    })
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`Bucket ${bucket} already exists`)
      } else {
        console.error(`Error creating bucket ${bucket}:`, error)
      }
    } else {
      console.log(`Created bucket ${bucket}`)
    }
  }
}

async function processPDF(attachmentId: string, fileName: string, content: Buffer) {
  try {
    // Send PDF to processing server
    const response = await axios.post(`${PDF_SERVER_URL}/process-pdf`, {
      attachment_id: attachmentId,
      file_name: fileName,
      content: content.toString('base64')
    })

    console.log('PDF processed successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('Error processing PDF:', error.response?.data || error.message)
    throw error
  }
}

async function processTestEmails() {
  try {
    // Sample test data
    const testEmails = [
      {
        subject: 'Job Application - Software Engineer',
        sender: 'john.doe@example.com',
        received_date: new Date().toISOString(),
        content: 'Please find attached my resume and cover letter.',
        attachments: [
          {
            name: 'resume.pdf',
            content: fs.readFileSync(path.join(__dirname, '../test-data/sample.pdf')),
            type: 'application/pdf'
          }
        ]
      },
      {
        subject: 'Follow-up Interview',
        sender: 'jane.smith@example.com',
        received_date: new Date().toISOString(),
        content: 'Thank you for the interview opportunity.',
        attachments: []
      },
      {
        subject: 'Technical Assessment Submission',
        sender: 'bob.wilson@example.com',
        received_date: new Date().toISOString(),
        content: 'Here is my completed technical assessment.',
        attachments: [
          {
            name: 'assessment.pdf',
            content: fs.readFileSync(path.join(__dirname, '../test-data/sample2.pdf')),
            type: 'application/pdf'
          }
        ]
      }
    ]

    for (const email of testEmails) {
      // Insert email
      const { data: emailData, error: emailError } = await supabase
        .from('emails')
        .insert({
          subject: email.subject,
          sender: email.sender,
          received_date: email.received_date,
          content: email.content
        })
        .select()
        .single()

      if (emailError) {
        console.error('Error inserting email:', emailError)
        continue
      }

      console.log('Inserted email:', emailData)

      // Process attachments
      for (const attachment of email.attachments) {
        const timestamp = Date.now()
        const fileName = `${timestamp}-${attachment.name}`
        const bucketPath = attachment.type === 'application/pdf' ? 'pdfs' : 'attachments'

        // Insert attachment record
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            email_id: emailData.id,
            file_name: fileName,
            file_type: attachment.type,
            bucket_path: bucketPath
          })
          .select()
          .single()

        if (attachmentError) {
          console.error('Error inserting attachment record:', attachmentError)
          continue
        }

        console.log('Inserted attachment:', attachmentData)

        // If it's a PDF, process it
        if (attachment.type === 'application/pdf') {
          try {
            await processPDF(attachmentData.id, fileName, attachment.content)
          } catch (error) {
            console.error('Error processing PDF:', error)
          }
        }
      }
    }

    console.log('Test data insertion complete!')
  } catch (error) {
    console.error('Error in processTestEmails:', error)
  }
}

async function main() {
  // First check if PDF server is running
  try {
    await axios.get(`${PDF_SERVER_URL}/health`)
    console.log('PDF server is running')
  } catch (error) {
    console.error('PDF server is not running. Please start it first.')
    process.exit(1)
  }

  await createBuckets()
  await processTestEmails()
}

main()
