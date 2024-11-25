import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { FormTypeSummary } from '@/types/wotc'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface FormSummaryProps {
  summary: FormTypeSummary
}

const formatFormType = (type: keyof FormTypeSummary) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function FormSummary({ summary }: FormSummaryProps) {
  const requiredForms = ['form_8850', 'form_8_question'] as const
  const optionalForms = ['nyyf_1', 'nyyf_2'] as const

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Form Summary</h3>
      
      <div className="space-y-4">
        {/* Required Forms */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Required Forms</h4>
          <div className="grid grid-cols-2 gap-4">
            {requiredForms.map(formType => (
              <div key={formType} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">{formatFormType(formType)}</span>
                  <Badge variant={summary[formType] > 0 ? "success" : "destructive"} className="ml-2">
                    {summary[formType]}
                  </Badge>
                </div>
                {summary[formType] > 0 ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optional Forms */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Optional Forms</h4>
          <div className="grid grid-cols-2 gap-4">
            {optionalForms.map(formType => (
              <div key={formType} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">{formatFormType(formType)}</span>
                  <Badge variant="secondary" className="ml-2">
                    {summary[formType]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unclassified Forms */}
        {summary.unclassified > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Unclassified Forms</h4>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unclassified</span>
                <Badge variant="outline" className="ml-2">
                  {summary.unclassified}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
