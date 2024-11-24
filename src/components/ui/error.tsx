import { cn } from '@/lib/utils'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  title?: string
  message?: string
  className?: string
  retry?: () => void
}

export function ErrorMessage({
  title = 'Error',
  message = 'Something went wrong. Please try again.',
  className,
  retry,
}: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {retry && (
            <button
              onClick={retry}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function FullPageError({
  title,
  message,
  retry,
}: Omit<ErrorMessageProps, 'className'>) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <ErrorMessage
        title={title}
        message={message}
        retry={retry}
        className="max-w-md"
      />
    </div>
  )
}
