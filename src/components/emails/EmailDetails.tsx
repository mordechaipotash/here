'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { LoadingState } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'

interface EmailDetailsProps {
  emailId: string
}

export function EmailDetails({ emailId }: EmailDetailsProps) {
  const { data: email, isLoading, error } = useQuery({
    queryKey: ['email', emailId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_view')
        .select(`
          *,
          attachments:email_attachments(*)
        `)
        .eq('email_id', emailId)
        .single()

      if (error) throw error
      return data
    }
  })

  if (isLoading) return <LoadingState message="Loading email details..." />
  if (error) return <ErrorMessage title="Failed to load email details" message={(error as Error).message} />
  if (!email) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Email Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{email.subject}</h2>
        <div className="text-sm text-gray-600">
          <p>From: {email.from_name} ({email.from_email})</p>
          <p>Date: {new Date(email.date).toLocaleString()}</p>
          {email.client_name && (
            <p>Client: {email.client_name}</p>
          )}
        </div>
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Attachments</h3>
          <div className="space-y-2">
            {email.attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {attachment.file_type === 'application/pdf' ? (
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {(attachment.file_size / 1024).toFixed(1)} KB
                      {attachment.page_count && ` • ${attachment.page_count} pages`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Body */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Email Content</h3>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: email.body_html || email.snippet }}
        />
      </div>
    </div>
  )
}
