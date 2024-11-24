'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'
import EmailCard from '@/components/emails/EmailCard'
import { getEmails } from '@/services/emailViewService'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/sidebar/Sidebar'

function EmailsPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)

  const {
    data: emails = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['emails', selectedTrack],
    queryFn: () => getEmails({ selectedTrack }),
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true
  })

  if (isLoading) return <LoadingState message="Loading emails..." />
  if (error) return <ErrorMessage title="Error" message={(error as Error).message} />

  return (
    <div className="flex h-screen">
      <Sidebar onTrackSelect={setSelectedTrack} selectedTrack={selectedTrack} />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
            <button
              onClick={() => refetch()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Refresh
            </button>
          </div>

          {/* Email List */}
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                className="space-y-4"
              >
                {emails.map(email => (
                  <motion.div
                    key={email.email_id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <EmailCard 
                      email={email} 
                      onTrackChange={async (emailId, newTrack) => {
                        // Optimistically update the UI
                        const updatedEmails = emails.map(e => 
                          e.email_id === emailId ? { ...e, track: newTrack } : e
                        )
                        // Refetch to ensure data consistency
                        await refetch()
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            
            {emails.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No emails found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailsPage
