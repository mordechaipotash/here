import { useDrag, useDrop } from 'react-dnd'
import { ChevronUpDownIcon, CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { FORM_TYPES } from '@/lib/constants'
import { formatFormType } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getApplicantCountForPage } from '@/services/applicantService'

interface DraggableFormProps {
  page: {
    id: string
    image_url: string
    form_type: string
    page_number: number
  }
  onFormTypeChange: (pageId: string, formType: string) => Promise<void>
  updatingPageId: string | null
  onFormGrouped?: (sourceId: string, targetId: string) => Promise<void>
  isGrouped?: boolean
}

export function DraggableForm({ 
  page, 
  onFormTypeChange, 
  updatingPageId,
  onFormGrouped,
  isGrouped = false
}: DraggableFormProps) {
  const [applicantCount, setApplicantCount] = useState<number>(0)

  useEffect(() => {
    const loadApplicantCount = async () => {
      try {
        const count = await getApplicantCountForPage(page.id)
        setApplicantCount(count)
      } catch (error) {
        console.error('Failed to load applicant count:', error)
      }
    }
    loadApplicantCount()
  }, [page.id])

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'form',
    item: { 
      id: page.id, 
      formType: page.form_type 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'form',
    drop: (item: { id: string, formType: string }) => {
      if (item.id !== page.id && onFormGrouped) {
        onFormGrouped(item.id, page.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  // Combine drag and drop refs
  const dragDropRef = (el: HTMLDivElement) => {
    drag(el)
    drop(el)
  }

  return (
    <div
      ref={dragDropRef}
      className={`group relative aspect-[3/4] overflow-hidden rounded-lg transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'ring-2 ring-blue-500' : ''} ${
        isGrouped ? 'ring-2 ring-purple-500' : 'bg-gray-100'
      } cursor-move`}
    >
      <img
        src={page.image_url}
        alt={page.form_type || `Page ${page.page_number}`}
        className="h-full w-full object-contain"
      />
      
      {/* Applicant count indicator */}
      {applicantCount > 0 && (
        <Badge
          className="absolute top-2 right-2 bg-blue-100 text-blue-700 group-hover:bg-blue-200 flex items-center gap-1"
        >
          <UserGroupIcon className="w-4 h-4" />
          {applicantCount}
        </Badge>
      )}

      {/* Grouped indicator */}
      {isGrouped && (
        <Badge
          className="absolute top-2 left-2 bg-purple-100 text-purple-700 group-hover:bg-purple-200"
        >
          Grouped
        </Badge>
      )}

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg px-3 py-2 text-sm font-medium text-blue-600">
            Drop to group forms
          </div>
        </div>
      )}

      {/* Form type selector */}
      <div className="absolute bottom-2 right-2 w-48 space-y-2 z-10">
        <div className="relative z-20">
          <Listbox
            value={page.form_type || 'unclassified'}
            onChange={(newType: typeof FORM_TYPES[number]) => {
              onFormTypeChange(page.id, newType)
            }}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                <span className="block truncate">
                  {formatFormType(page.form_type || 'unclassified')}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                          <span
                            className={`block truncate ${
                              selected ? 'font-medium' : 'font-normal'
                            }`}
                          >
                            {formatFormType(type)}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
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
    </div>
  )
}
