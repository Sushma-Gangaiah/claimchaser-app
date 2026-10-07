import api from './client';

export interface EntryData {
  client_code?: string;
  patient_name?: string;
  date_of_service?: string;
  provider_name?: string;
  location?: string;
  payer_name?: string;
  insurance_type?: string;
  insurance_payer_type?: string;
  claim_type?: string;
  charges?: string;
  paid_by_payer?: string;
  payer_control_num?: string;
  claims_number?: string;
  claim_due?: string;
  last_submission_date?: string;
  follow_up_date?: string;
  date_worked?: string;
  comments?: string;
  status_code?: string;
  sub_status_code?: string;
  action_code?: string;
  work_status?: string;
  software?: string;
  escalation?: boolean;
  is_draft: boolean;
  user_name: string;
}

export const userAPI = {
  getMyEntries: (draftsOnly: boolean = false) =>
    api.get('/user/entries', { params: { drafts_only: draftsOnly } }),

  createEntry: (data: EntryData) =>
    api.post('/user/entries', data),

  updateEntry: (entryId: string, data: Partial<EntryData>) =>
    api.patch(`/user/entries/${entryId}`, data),

  deleteEntry: (entryId: string) =>
    api.delete(`/user/entries/${entryId}`),

  getDropdowns: () =>
    api.get<{ [key: string]: string[] }>('/user/dropdowns'),

  getDropdown: (fieldKey: string) =>
    api.get<string[]>(`/user/dropdowns/${fieldKey}`),
};
