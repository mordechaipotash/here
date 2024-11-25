'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { motion, AnimatePresence } from 'framer-motion'
import { DocumentIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import type { EmailWithMetadata } from '@/types/email-view'
import PdfGalleryModal from './PdfGalleryModal'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { updateTrack } from '@/services/emailViewService'

// Form types we want to count
const FORM_TYPES = ['8850_form', '8_question_form', 'nyyf_1', 'nyyf_2'] as const
type FormType = typeof FORM_TYPES[number]

// Helper to format form type for display
function formatFormType(type: string): string {
  return type
    .split('_')
    .map(word => word === 'nyyf' ? 'NYYF' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper to count form types in a PDF
function countFormTypes(pages: Array<{ form_type: string | null }>) {
  if (!Array.isArray(pages)) {
    console.warn('Pages is not an array:', pages)
    return FORM_TYPES.reduce((acc, type) => {
      acc[type] = 0
      return acc
    }, {} as Record<FormType, number>)
  }

  // Initialize counts
  const counts = FORM_TYPES.reduce((acc, type) => {
    acc[type] = 0
    return acc
  }, {} as Record<FormType, number>)
  
  // Count each page's form type
  pages.forEach(page => {
    if (page?.form_type && FORM_TYPES.includes(page.form_type as FormType)) {
      counts[page.form_type as FormType]++
    }
  })
  
  return counts
}

interface EmailCardProps {
  email: EmailWithMetadata
  onTrackChange?: (emailId: string, newTrack: string) => void
}

export default function EmailCard({ email, onTrackChange }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState<EmailWithMetadata['pdfs'][0] | null>(null)
  const [pdfs, setPdfs] = useState(email.pdfs)
  const [isUpdatingTrack, setIsUpdatingTrack] = useState(false)

  // Keep pdfs in sync with email prop
  useEffect(() => {
    setPdfs(email.pdfs)
  }, [email.pdfs])

  // Calculate total 8850 forms across all PDFs
  const total8850Forms = pdfs.reduce((total, pdf) => {
    const pages = Array.isArray(pdf.pages) ? pdf.pages : []
    return total + pages.filter(page => page.form_type === '8850_form').length
  }, 0)

  const handleFormTypeChange = (pageId: string, newFormType: string) => {
    setPdfs(prevPdfs => 
      prevPdfs.map(pdf => ({
        ...pdf,
        pages: pdf.pages.map(page => 
          page.id === pageId ? { ...page, form_type: newFormType } : page
        )
      }))
    )
  }

  const handleTrackToggle = async () => {
    try {
      setIsUpdatingTrack(true)
      const newTrack = email.track === 'wotc_machine' ? 'forms_admin' : 'wotc_machine'
      await updateTrack(email.email_id, newTrack)
      onTrackChange?.(email.email_id, newTrack)
    } catch (error) {
      console.error('Failed to update track:', error)
    } finally {
      setIsUpdatingTrack(false)
    }
  }

  const { from, subject, date, client, pdf_count, total_pages, form_type } = email

  return (
    <motion.div
      layout
      className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-white shadow rounded-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              {/* Client Info and Date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: email.client.color }} 
                  />
                  <span className="block text-sm font-medium text-gray-900 truncate">
                    {email.client.name}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatInTimeZone(new Date(email.date), 'America/New_York', 'MMM d, yyyy h:mm a zzz')}
                </div>
              </div>
              
              {/* Email Subject and From */}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-900">
                  {email.subject || '(no subject)'}
                </p>
                <div className="mt-1 text-sm text-gray-500">
                  From: {email.from.name || email.from.email}
                </div>
              </div>
            </div>
            
            {/* Right Side Stats */}
            <div className="ml-4 flex items-center space-x-3">
              {/* PDF Count */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
              </span>
              
              {/* Form Count */}
              {total8850Forms > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                  {total8850Forms} 8850 Form{total8850Forms !== 1 ? 's' : ''}
                </span>
              )}
              
              <ChevronDownIcon
                className={clsx(
                  'h-5 w-5 text-gray-400 transform transition-transform duration-200',
                  isExpanded ? 'rotate-180' : ''
                )}
              />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200"
            >
              <div className="p-4 space-y-4">
                {/* PDF Links */}
                {pdfs.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments ({pdfs.length})</h4>
                    <div className="grid gap-2">
                      {pdfs.map((pdf, index) => {
                        // Ensure pages is always an array and has the correct structure
                        const pages = Array.isArray(pdf.pages) ? pdf.pages : []
                        const formCounts = countFormTypes(pages)
                        
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-white rounded-md p-2 hover:bg-gray-50 transition-colors group"
                          >
                            <DocumentIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            <button 
                              className="flex-1 truncate text-left text-sm text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPdf(pdf)
                              }}
                            >
                              {pdf.filename}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {pages.length} page{pages.length !== 1 ? 's' : ''}
                              </span>
                              <div className="w-px h-4 bg-gray-200" />
                              <div className="flex gap-2 flex-wrap justify-end min-w-[200px] items-center">
                                {FORM_TYPES.map(type => {
                                  const count = formCounts[type]
                                  return count > 0 ? (
                                    <span 
                                      key={type}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap"
                                    >
                                      {formatFormType(type)}: {count}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Email Body */}
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{email.from.name || email.from.email}</span>
                        {email.from.name && <span className="text-gray-500">&lt;{email.from.email}&gt;</span>}
                      </div>
                      <button
                        onClick={handleTrackToggle}
                        disabled={isUpdatingTrack}
                        className={clsx(
                          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          email.track === 'wotc_machine' 
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200',
                          isUpdatingTrack && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isUpdatingTrack && (
                          <ArrowPathIcon className="h-3 w-3 animate-spin" />
                        )}
                        {email.track === 'wotc_machine' 
                          ? 'Switch to Forms Admin' 
                          : 'Switch to WOTC Machine'}
                      </button>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-a:text-blue-600" 
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(email.body_html || '') }} 
                    />
                  </div>
                </div>

                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 text-xs text-gray-500">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify({ 
                        subject: email.subject,
                        bodyLength: email.body_html?.length,
                        sanitizedLength: email.body_html ? sanitizeHtml(email.body_html).length : 0
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Gallery Modal */}
        {selectedPdf && (
          <PdfGalleryModal
            isOpen={!!selectedPdf}
            onClose={() => setSelectedPdf(null)}
            pdf={selectedPdf}
            emailId={email.email_id || email.id}
            onFormTypeChange={handleFormTypeChange}
          />
        )}
      </div>
    </motion.div>
  )
}
