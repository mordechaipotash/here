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
    data: emails,
    isLoading,
    error
  } = useQuery({
    queryKey: ['emails', trackFilter],
    queryFn: () => getEmails({ selectedTrack: trackFilter === 'all' ? 'all' : trackFilter.toString() })
  })

  if (isLoading) return <LoadingState message="Loading emails..." />
  if (error) return <ErrorMessage error={error} />
  if (!emails?.length) return <div>No emails found.</div>

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {emails.map((email) => (
        <EmailCard key={email.id} email={email} />
      ))}
    </div>
  )
}
