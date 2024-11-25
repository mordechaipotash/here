import React from 'react'
import { cn } from '@/lib/utils'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  title?: string
  message?: string
  error?: Error
  className?: string
  retry?: () => void
}

export function ErrorMessage({
  title = 'Error',
  message,
  error,
  className,
  retry,
}: ErrorMessageProps) {
  const errorMessage = message || error?.message || 'An unexpected error occurred'
  
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
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
          </div>
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
  error,
  retry,
}: Omit<ErrorMessageProps, 'className'>) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <ErrorMessage
        title={title}
        message={message}
        error={error}
        retry={retry}
        className="max-w-md"
      />
    </div>
  )
}
