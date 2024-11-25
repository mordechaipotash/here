import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmails } from '@/services/emailViewService'
import EmailCard from '@/components/emails/EmailCard'
import { LoadingState } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'

interface EmailListProps {
  trackFilter: 'all' | boolean
}

export function EmailList({ trackFilter }: EmailListProps) {
  const {
    data: emails = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['emails', trackFilter],
    queryFn: () => getEmails({ track: trackFilter })
  })

  if (isLoading) return <LoadingState message="Loading emails..." />
  if (error) return <ErrorMessage title="Error" message={(error as Error).message} />

  return (
    <div className="grid gap-4">
      {emails.map(email => (
        <EmailCard key={email.email_id} email={email} />
      ))}
      
      {emails.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No emails found</p>
        </div>
      )}
    </div>
  )
}
