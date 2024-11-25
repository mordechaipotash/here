import { Button } from '@/components/ui/button'
import { formatFormType } from '@/lib/utils'
import type { WotcFormType } from '@/types/wotc'
import { UserPlusIcon } from '@heroicons/react/24/outline'

interface GroupedFormsProps {
  forms: Array<{
    id: string
    form_type: string
    page_number: number
    image_url: string
  }>
  onCreateApplicant: (formIds: string[]) => void
  onUngroup: (formId: string) => void
}

export function GroupedForms({ forms, onCreateApplicant, onUngroup }: GroupedFormsProps) {
  if (forms.length < 2) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          {forms.map(form => formatFormType(form.form_type)).join(' + ')}
        </div>
        <Button 
          onClick={() => onCreateApplicant(forms.map(f => f.id))}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <UserPlusIcon className="w-4 h-4" />
          Save New Applicant
        </Button>
        <div className="h-8 w-px bg-gray-200" />
        <Button 
          variant="ghost"
          onClick={() => forms.forEach(f => onUngroup(f.id))}
          className="text-gray-600 hover:text-gray-900"
        >
          Ungroup
        </Button>
      </div>
    </div>
  )
}
