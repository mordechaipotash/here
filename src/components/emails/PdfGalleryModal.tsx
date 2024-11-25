import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DraggableForm } from './DraggableForm'
import { GroupedForms } from './GroupedForms'
import { Button } from '@/components/ui/button'
import { updateFormType } from '@/services/emailViewService'
import { getApplicantsByEmail, assignFormToApplicant, createApplicant, removeFormFromApplicant } from '@/services/applicantService'
import { ApplicantFormModal } from '@/components/applicants/ApplicantFormModal'
import type { Applicant } from '@/types/applicant'
import type { WotcFormType } from '@/types/wotc'

interface PdfGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  pdf: {
    filename: string
    pages: Array<{
      id: string
      page_number: number
      image_url: string
      form_type: string
    }>
  }
  emailId: string
  onFormTypeChange?: (pageId: string, newFormType: string) => void
}

function PdfGalleryModal({ isOpen, onClose, pdf, emailId, onFormTypeChange }: PdfGalleryModalProps) {
  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null)
  const [pages, setPages] = useState(pdf.pages)
  const [showApplicantForm, setShowApplicantForm] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false)
  const [groupedFormIds, setGroupedFormIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setPages(pdf.pages)
  }, [pdf.pages])

  useEffect(() => {
    if (emailId) {
      loadApplicants()
    }
  }, [emailId])

  const loadApplicants = async () => {
    setIsLoadingApplicants(true)
    try {
      const applicants = await getApplicantsByEmail(emailId)
      setApplicants(applicants)
    } catch (error) {
      console.error('Failed to load applicants:', error)
    } finally {
      setIsLoadingApplicants(false)
    }
  }

  const handleFormTypeChange = async (pageId: string, formType: string) => {
    setUpdatingPageId(pageId)
    try {
      await updateFormType(pageId, formType)
      setPages(prev =>
        prev.map(p =>
          p.id === pageId ? { ...p, form_type: formType } : p
        )
      )
      if (onFormTypeChange) {
        onFormTypeChange(pageId, formType)
      }
    } catch (error) {
      console.error('Failed to update form type:', error)
    } finally {
      setUpdatingPageId(null)
    }
  }

  const handleAssignForm = async (applicantId: string, pageId: string) => {
    try {
      await assignFormToApplicant(applicantId, pageId)
      await loadApplicants()
    } catch (error) {
      console.error('Failed to assign form:', error)
    }
  }

  const handleRemoveForm = async (applicantId: string, formId: string) => {
    try {
      await removeFormFromApplicant(applicantId, formId)
      await loadApplicants()
    } catch (error) {
      console.error('Failed to remove form:', error)
    }
  }

  const handleCreateApplicant = async (data: {
    firstName: string
    lastName: string
    ssn: string
    dob: string
  }) => {
    try {
      console.log('Creating applicant with emailId:', emailId)
      // Create the applicant first
      const newApplicant = await createApplicant({
        firstName: data.firstName,
        lastName: data.lastName,
        ssn: data.ssn,
        dob: data.dob,
        emailId: emailId
      })

      if (!newApplicant) {
        throw new Error('Failed to create applicant')
      }

      // If we have grouped forms, assign them all to the new applicant
      if (groupedFormIds.size > 0) {
        await Promise.all(
          Array.from(groupedFormIds).map(async (pageId) => {
            try {
              await assignFormToApplicant(newApplicant.applicant_id, pageId)
            } catch (error) {
              console.error(`Failed to assign form ${pageId} to applicant:`, error)
              throw new Error('Failed to assign form to applicant')
            }
          })
        )
      }

      // Reload applicants and close modal only after everything succeeds
      await loadApplicants()
      setGroupedFormIds(new Set())
      setShowApplicantForm(false)
    } catch (error) {
      console.error('Failed to create applicant:', error)
      throw error // Re-throw to be caught by the modal
    }
  }

  const handleFormGrouped = async (sourceId: string, targetId: string) => {
    setGroupedFormIds(prev => {
      const newSet = new Set(prev)
      newSet.add(sourceId)
      newSet.add(targetId)
      return newSet
    })
  }

  const handleUngroupForm = (formId: string) => {
    setGroupedFormIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(formId)
      return newSet
    })
  }

  // Get the grouped forms
  const groupedForms = pages.filter(p => groupedFormIds.has(p.id))
  
  // Find the 8850 form for preview
  const form8850 = pages.find(p => p.form_type === '8850')

  return (
    <DndProvider backend={HTML5Backend}>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {pdf.filename}
                    </Dialog.Title>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {pages.map((page) => (
                          <DraggableForm
                            key={page.id}
                            page={page}
                            onFormTypeChange={handleFormTypeChange}
                            updatingPageId={updatingPageId}
                            onFormGrouped={handleFormGrouped}
                            isGrouped={groupedFormIds.has(page.id)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Show grouped forms UI */}
                  <GroupedForms
                    forms={groupedForms}
                    onCreateApplicant={() => setShowApplicantForm(true)}
                    onUngroup={handleUngroupForm}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>

          {/* Applicant Form Modal */}
          <ApplicantFormModal
            isOpen={showApplicantForm}
            onClose={() => setShowApplicantForm(false)}
            onSubmit={handleCreateApplicant}
            selectedForms={groupedForms}
          />
        </Dialog>
      </Transition>
    </DndProvider>
  )
}

export default PdfGalleryModal