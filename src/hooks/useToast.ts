import { useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export function useToast(): ToastContextValue {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    ({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const toast: Toast = { id, type, title, message, duration }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

// Utility functions for common toast types
export const useToastActions = () => {
  const { addToast } = useToast()

  const success = (title: string, message?: string) =>
    addToast({ type: 'success', title, message })

  const error = (title: string, message?: string) =>
    addToast({ type: 'error', title, message })

  const info = (title: string, message?: string) =>
    addToast({ type: 'info', title, message })

  const warning = (title: string, message?: string) =>
    addToast({ type: 'warning', title, message })

  return { success, error, info, warning }
}
