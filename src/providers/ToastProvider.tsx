'use client'

import { createContext, useContext } from 'react'
import {
  Toast,
  ToastProvider as RadixToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const ToastContext = createContext<ReturnType<typeof useToast> | undefined>(
  undefined
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      <RadixToastProvider>
        {children}
        <div className="relative">
          {toast.toasts.map(({ id, type, title, message }) => (
            <Toast
              key={id}
              className={cn(
                type === 'error' && 'border-red-500 bg-red-50',
                type === 'success' && 'border-green-500 bg-green-50',
                type === 'warning' && 'border-yellow-500 bg-yellow-50',
                type === 'info' && 'border-blue-500 bg-blue-50'
              )}
            >
              <div className="grid gap-1">
                <ToastTitle>{title}</ToastTitle>
                {message && <ToastDescription>{message}</ToastDescription>}
              </div>
              <ToastClose onClick={() => toast.removeToast(id)} />
            </Toast>
          ))}
        </div>
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  )
}

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
