export type WotcFormType = 'unclassified' | '8850_form' | '8_question_form' | 'nyyf_1' | 'nyyf_2'

export interface WotcFormStatus {
  pageId: string
  status: 'pending' | 'complete'
  assignedAt?: string
}

export interface WotcPackage {
  id: string
  form_8850?: WotcFormStatus
  form_8_question?: WotcFormStatus
  nyyf_1?: WotcFormStatus
  nyyf_2?: WotcFormStatus
  
  status: 'incomplete' | 'ready_for_review' | 'complete'
  applicantId?: string
  emailId: string
  createdAt: string
  updatedAt: string
}

export interface FormTypeSummary {
  form_8850: number
  form_8_question: number
  nyyf_1: number
  nyyf_2: number
  unclassified: number
}
