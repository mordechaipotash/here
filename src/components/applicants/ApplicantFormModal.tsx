import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface ApplicantFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    firstName: string
    lastName: string
    ssn: string
    dob: string
  }) => void
  selectedForms: Array<{
    id: string
    image_url: string
    form_type: string
    page_number: number
  }>
}

export function ApplicantFormModal({ isOpen, onClose, onSubmit, selectedForms }: ApplicantFormModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ssn: '',
    dob: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeFormIndex, setActiveFormIndex] = useState(0)
  const activeForm = selectedForms[activeFormIndex]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create applicant')
      setIsSubmitting(false)
      return
    }

    // Only reset form data and close modal after successful submission
    setFormData({
      firstName: '',
      lastName: '',
      ssn: '',
      dob: '',
    })
    setIsSubmitting(false)
  }

  return (
    <Dialog as="div" className="relative z-50" open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-[95vw] h-[90vh] transform overflow-hidden bg-white shadow-xl transition-all">
            <div className="flex h-full">
              {/* Left side: Form preview */}
              <div className="flex-1 flex flex-col p-6">
                <div className="flex-1 overflow-hidden">
                  {activeForm && (
                    <div className="h-full relative">
                      <img
                        src={activeForm.image_url}
                        alt={`Form ${activeForm.form_type}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
                
                {/* Thumbnails */}
                {selectedForms.length > 1 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto py-2">
                    {selectedForms.map((form, index) => (
                      <button
                        key={form.id}
                        onClick={() => setActiveFormIndex(index)}
                        className={`flex-shrink-0 w-20 h-28 border-2 rounded-lg overflow-hidden transition-all ${
                          index === activeFormIndex ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={form.image_url}
                          alt={`Form ${form.form_type}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: Simple form */}
              <div className="w-96 p-6 border-l border-gray-200 overflow-y-auto">
                <Dialog.Title as="h3" className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5 text-blue-600" />
                  Save New Applicant
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SSN
                    </label>
                    <input
                      type="text"
                      value={formData.ssn}
                      onChange={(e) => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Optional"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Optional"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full relative flex items-center justify-center gap-2" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="opacity-0">Save Applicant</span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-5 h-5" />
                          Save Applicant
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
