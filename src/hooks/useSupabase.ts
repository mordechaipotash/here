import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries, EmailRow, ClientRow, EmailDomainRow, EmailStats } from '@/lib/supabase/client'

// Email hooks
export const useEmail = (emailId: string) => {
  return useQuery({
    queryKey: ['email', emailId],
    queryFn: () => queries.emails.getById(emailId),
  })
}

export const useClientEmails = (clientId: string) => {
  return useQuery({
    queryKey: ['emails', clientId],
    queryFn: () => queries.emails.getByClientId(clientId),
  })
}

export const useUpdateEmailProcessed = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ emailId, processed }: { emailId: string; processed: boolean }) =>
      queries.emails.updateProcessed(emailId, processed),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email', variables.emailId] })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

// Client hooks
export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => queries.clients.getAll(),
  })
}

export const useClient = (clientId: string) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => queries.clients.getById(clientId),
    enabled: !!clientId,
  })
}

export const useClientDomains = (clientId: string) => {
  return useQuery({
    queryKey: ['client-domains', clientId],
    queryFn: () => queries.clients.getDomains(clientId),
    enabled: !!clientId,
  })
}

// Statistics hooks
export const useEmailStats = () => {
  return useQuery({
    queryKey: ['email-stats'],
    queryFn: () => queries.statistics.getEmailStats(),
  })
}

// Type guards for better type safety
export const isEmailRow = (data: unknown): data is EmailRow => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email_id' in data &&
    typeof (data as EmailRow).email_id === 'string'
  )
}

export const isClientRow = (data: unknown): data is ClientRow => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as ClientRow).id === 'string'
  )
}

export const isEmailDomainRow = (data: unknown): data is EmailDomainRow => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'domain' in data &&
    typeof (data as EmailDomainRow).domain === 'string'
  )
}
