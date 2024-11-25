import { TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import { formatFormType } from '@/lib/utils'
import type { WotcFormType } from '@/types/wotc'

interface AssignedForm {
  id: string
  form_type: WotcFormType
  page_number: number
}

interface ApplicantFormListProps {
  forms: AssignedForm[]
  onRemoveForm?: (formId: string) => Promise<void>
}

export function ApplicantFormList({ forms, onRemoveForm }: ApplicantFormListProps) {
  const formsByType = forms.reduce((acc, form) => {
    const type = form.form_type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(form)
    return acc
  }, {} as Record<WotcFormType, AssignedForm[]>)

  return (
    <div className="space-y-3">
      {Object.entries(formsByType).map(([type, forms]) => (
        <div key={type} className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              {formatFormType(type)}
            </h4>
            <Badge variant="secondary">
              {forms.length} {forms.length === 1 ? 'page' : 'pages'}
            </Badge>
          </div>
          <div className="space-y-2">
            {forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center justify-between bg-white rounded-md p-2 text-sm"
              >
                <span>Page {form.page_number}</span>
                {onRemoveForm && (
                  <button
                    onClick={() => onRemoveForm(form.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
