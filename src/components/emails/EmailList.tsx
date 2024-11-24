'use client'

import { format } from 'date-fns'

interface Email {
  id: string
  subject: string
  date: string
  snippet: string
  track: string
  client_name: string | null
  display_color: string
  pdfCount: number
  pageCount: number
  from: {
    name: string
    email: string
  }
}

interface EmailListProps {
  emails: Email[]
  selectedEmailId: string | null
  onEmailSelect: (id: string) => void
}

export function EmailList({ emails, selectedEmailId, onEmailSelect }: EmailListProps) {
  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`
            cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-blue-500 transition-colors
            ${selectedEmailId === email.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}
          `}
          onClick={() => onEmailSelect(email.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {email.subject}
              </h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span>{email.from.name}</span>
                <span className="mx-2">•</span>
                <span>{format(new Date(email.date), 'MMM d, yyyy')}</span>
              </div>
            </div>
            {email.track && (
              <span
                className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${email.display_color}20`,
                  color: email.display_color,
                }}
              >
                {email.track.toUpperCase()}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{email.snippet}</p>

          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
            {email.client_name && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span 
                  className="px-2 py-0.5 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: email.display_color || '#E2E8F0',
                    color: '#FFFFFF'
                  }}
                >
                  {email.client_name}
                </span>
              </div>
            )}
            
            {email.pdfCount > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                <span>{email.pdfCount} PDF{email.pdfCount !== 1 ? 's' : ''}</span>
              </div>
            )}

            {email.pageCount > 0 && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>{email.pageCount} page{email.pageCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
