import { useDrop } from 'react-dnd'
import { UserIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { ApplicantFormList } from './ApplicantFormList'
import type { WotcFormType } from '@/types/wotc'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface AssignedForm {
  id: string
  form_type: WotcFormType
  page_number: number
}

interface Applicant {
  id: string
  first_name: string
  last_name: string
  assigned_forms: AssignedForm[]
}

interface DroppableApplicantListProps {
  applicants: Applicant[]
  onAssignForm: (applicantId: string, pageId: string) => Promise<void>
  onRemoveForm: (applicantId: string, formId: string) => Promise<void>
  onCreateNew: () => void
  isLoadingApplicants: boolean
}

export function DroppableApplicantList({ 
  applicants, 
  onAssignForm,
  onRemoveForm,
  onCreateNew,
  isLoadingApplicants 
}: DroppableApplicantListProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'form',
    drop: () => ({ name: 'ApplicantList' }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  return (
    <div
      ref={drop}
      className={`w-full max-h-[600px] overflow-y-auto rounded-lg border-2 ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      } p-4`}
    >
      <h3 className="text-lg font-semibold mb-4">Assign to Applicant</h3>
      
      {isLoadingApplicants ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 text-gray-400 mr-3" />
            <span className="text-sm font-medium">Create New Applicant</span>
          </button>
          
          <div className="space-y-4">
            {applicants.map((applicant) => (
              <ApplicantDropTarget
                key={applicant.id}
                applicant={applicant}
                onAssignForm={onAssignForm}
                onRemoveForm={onRemoveForm}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface ApplicantDropTargetProps {
  applicant: Applicant
  onAssignForm: (applicantId: string, pageId: string) => Promise<void>
  onRemoveForm: (applicantId: string, formId: string) => Promise<void>
}

function ApplicantDropTarget({ applicant, onAssignForm, onRemoveForm }: ApplicantDropTargetProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'form',
    drop: (item: { id: string, formType: WotcFormType }) => {
      // Check if form is already assigned
      const isAlreadyAssigned = applicant.assigned_forms.some(
        form => form.id === item.id
      )

      if (isAlreadyAssigned) {
        alert('This form is already assigned to this applicant')
        return
      }

      // Check if applicant already has this form type
      const hasFormType = applicant.assigned_forms.some(
        form => form.form_type === item.formType
      )

      if (hasFormType) {
        const confirmAssign = window.confirm(
          `This applicant already has a ${item.formType} form. Do you want to assign another one?`
        )
        if (!confirmAssign) return
      }

      onAssignForm(applicant.id, item.id)
      return { name: `Applicant ${applicant.id}` }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="space-y-2">
      <div
        ref={drop}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center px-4 py-2 rounded-lg ${
          isOver ? 'bg-blue-100' : 'hover:bg-gray-100'
        } transition-colors cursor-pointer`}
      >
        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
        <div className="flex-1">
          <span className="text-sm font-medium">
            {applicant.first_name} {applicant.last_name}
          </span>
          {applicant.assigned_forms.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {applicant.assigned_forms.length} {applicant.assigned_forms.length === 1 ? 'form' : 'forms'}
            </Badge>
          )}
        </div>
      </div>

      {isExpanded && applicant.assigned_forms.length > 0 && (
        <div className="ml-8">
          <ApplicantFormList
            forms={applicant.assigned_forms}
            onRemoveForm={
              onRemoveForm ? (formId) => onRemoveForm(applicant.id, formId) : undefined
            }
          />
        </div>
      )}
    </div>
  )
}
