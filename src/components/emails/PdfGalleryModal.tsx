import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { updateFormType } from '@/services/emailViewService'

const FORM_TYPES = [
  'unclassified',
  '8850_form',
  '8_question_form',
  'nyyf_1',
  'nyyf_2'
] as const

const formatFormType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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
  onFormTypeChange?: (pageId: string, newFormType: string) => void
}

export function PdfGalleryModal({ isOpen, onClose, pdf, onFormTypeChange }: PdfGalleryModalProps) {
  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null)
  const [pages, setPages] = useState(pdf.pages)

  useEffect(() => {
    setPages(pdf.pages)
  }, [pdf.pages])

  const handleFormTypeChange = async (pageId: string, formType: string) => {
    console.log('Updating form type:', { pageId, formType })
    
    try {
      setUpdatingPageId(pageId)
      await updateFormType(pageId, formType)
      
      // Update local state
      setPages(prevPages => 
        prevPages.map(page => 
          page.id === pageId ? { ...page, form_type: formType } : page
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

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      {pdf.filename}
                    </Dialog.Title>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pages.map((page) => (
                        <div
                          key={page.id}
                          className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100"
                        >
                          <img
                            src={page.image_url}
                            alt={page.form_type || `Page ${page.page_number}`}
                            className="h-full w-full object-contain"
                          />
                          <div className="absolute bottom-2 right-2 w-48">
                            <Listbox
                              value={page.form_type || 'unclassified'}
                              onChange={(newType: typeof FORM_TYPES[number]) => {
                                console.log('Listbox onChange:', { pageId: page.id, newType })
                                handleFormTypeChange(page.id, newType)
                              }}
                            >
                              <div className="relative">
                                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-900 bg-opacity-75 py-2 pl-3 pr-10 text-left text-sm text-white shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2">
                                  <span className="block truncate">
                                    {formatFormType(page.form_type || 'unclassified')}
                                  </span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    {updatingPageId === page.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                      <ChevronUpDownIcon
                                        className="h-4 w-4 text-white"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </span>
                                </Listbox.Button>
                                <Transition
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <Listbox.Options className="absolute bottom-full mb-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    {FORM_TYPES.map((type) => (
                                      <Listbox.Option
                                        key={type}
                                        className={({ active }) =>
                                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                          }`
                                        }
                                        value={type}
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                              {formatFormType(type)}
                                            </span>
                                            {selected && (
                                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </Listbox>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
