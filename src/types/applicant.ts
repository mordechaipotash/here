import type { WotcFormType } from './wotc'

export interface ApplicantFormData {
  firstName: string
  lastName: string
  ssn: string
  dob: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  email?: string
  phone?: string
}

export interface AssignedForm {
  id: string
  form_type: WotcFormType
  page_number: number
  image_url: string
}

export interface Applicant extends Record<string, any> {
  id: string
  email_id: string
  first_name: string
  last_name: string
  ssn: string
  dob: string | null
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  assigned_forms: AssignedForm[]
}

export interface ApplicantForm {
  id: string
  applicant_id: string
  page_id: string
  form_type: WotcFormType
  created_at: string
  page?: {
    id: string
    page_number: number
    image_url: string
    form_type: WotcFormType
  }
}
