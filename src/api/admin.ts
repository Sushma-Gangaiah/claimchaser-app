import api from './client';

export interface Claim {
  id: string;
  entry_id: string;
  claims_number: string;
  account_number: string;
  service_date: string | null;
  provider_name: string | null;
  payer_name: string | null;
  category: string | null;
  billed_amount: string | null;
  balance_amount: string | null;
  comments: string | null;
  claim_status: string;
  action_task: string | null;
  worked_date: string | null;
  escalation: boolean;
  assigned_user: string | null;
  work_status: string;
  software: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  user_name: string;
  client_code: string | null;
  patient_name: string | null;
  date_of_service: string | null;
  provider_name: string | null;
  location: string | null;
  payer_name: string | null;
  insurance_type: string | null;
  insurance_payer_type: string | null;
  claim_type: string | null;
  charges: string | null;
  paid_by_payer: string | null;
  claim_due: string | null;
  payer_control_num: string | null;
  claims_number: string | null;
  last_submission_date: string | null;
  follow_up_date: string | null;
  date_worked: string | null;
  comments: string | null;
  status_code: string;
  sub_status_code: string | null;
  action_code: string | null;
  work_status: string;
  software: string | null;
  escalation: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface DropdownConfig {
  id: string;
  field_key: string;
  label: string;
  options: string[];
  is_required: boolean;
  created_by: string;
  updated_at: string;
}

export interface DropdownCreate {
  field_key: string;
  label: string;
  options: string[];
  is_required?: boolean;
}

export interface DropdownUpdate {
  label?: string;
  options?: string[];
  is_required?: boolean;
}

export interface UserInvite {
  email: string;
  full_name: string;
  role: 'user' | 'admin';
}

export const adminAPI = {
  // Users
  getUsers: () =>
    api.get('/admin/users'),

  createUser: (userData: any) =>
    api.post('/admin/users', userData),

  inviteUser: (userData: UserInvite) =>
    api.post('/invitations/invite', userData),

  updateUser: (userId: string, userData: any) =>
    api.patch(`/admin/users/${userId}`, userData),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),

  // Claims
  getAllClaims: (params?: any) =>
    api.get<Claim[]>('/admin/claims', { params }),

  getClaim: (claimId: string) =>
    api.get<Claim>(`/admin/claims/${claimId}`),

  getClaimsSummary: () =>
    api.get('/admin/reports/claims-summary'),

  // User Entries
  getAllEntries: (params?: any) =>
    api.get<Entry[]>('/admin/entries', { params }),

  getEntriesReport: (params?: any) =>
    api.get<{ items: Entry[]; total: number; users: string[] }>('/admin/entries/report', { params }),

  getEntriesSummary: () =>
    api.get('/admin/entries/summary'),

  getDailySummary: (dateFrom?: string, dateTo?: string) =>
    api.get('/admin/entries/daily-summary', {
      params: { date_from: dateFrom, date_to: dateTo }
    }),

  getClientSummary: (dateFrom?: string, dateTo?: string) =>
    api.get('/admin/entries/client-summary', {
      params: { date_from: dateFrom, date_to: dateTo }
    }),

  // Dropdown Configurations
  getAllDropdowns: () =>
    api.get<DropdownConfig[]>('/admin/dropdowns'),

  getDropdown: (fieldKey: string) =>
    api.get<DropdownConfig>(`/admin/dropdowns/${fieldKey}`),

  createDropdown: (data: DropdownCreate) =>
    api.post<DropdownConfig>('/admin/dropdowns', data),

  updateDropdown: (fieldKey: string, data: DropdownUpdate) =>
    api.patch<DropdownConfig>(`/admin/dropdowns/${fieldKey}`, data),

  deleteDropdown: (fieldKey: string) =>
    api.delete(`/admin/dropdowns/${fieldKey}`),

  addDropdownOption: (fieldKey: string, optionValue: string) =>
    api.post<DropdownConfig>(`/admin/dropdowns/${fieldKey}/options`, null, {
      params: { option_value: optionValue }
    }),

  updateDropdownOption: (fieldKey: string, oldValue: string, newValue: string) =>
    api.put<DropdownConfig>(`/admin/dropdowns/${fieldKey}/options/${oldValue}`, null, {
      params: { new_value: newValue }
    }),

  removeDropdownOption: (fieldKey: string, optionValue: string) =>
    api.delete<DropdownConfig>(`/admin/dropdowns/${fieldKey}/options/${optionValue}`),

  // Admin Dropdown Configurations (Insurance Type, Payer Type, Claim Type, Action Code)
  getAllAdminDropdowns: () =>
    api.get('/admin/admin-dropdowns'),

  getAdminDropdown: (fieldKey: string) =>
    api.get(`/admin/admin-dropdowns/${fieldKey}`),

  createAdminDropdown: (data: any) =>
    api.post('/admin/admin-dropdowns', data),

  updateAdminDropdown: (fieldKey: string, data: any) =>
    api.patch(`/admin/admin-dropdowns/${fieldKey}`, data),

  deleteAdminDropdown: (fieldKey: string) =>
    api.delete(`/admin/admin-dropdowns/${fieldKey}`),

  addAdminDropdownOption: (fieldKey: string, optionValue: string) =>
    api.post(`/admin/admin-dropdowns/${fieldKey}/options`, null, {
      params: { option_value: optionValue }
    }),

  updateAdminDropdownOption: (fieldKey: string, oldValue: string, newValue: string) =>
    api.put(`/admin/admin-dropdowns/${fieldKey}/options/${oldValue}`, null, {
      params: { new_value: newValue }
    }),

  removeAdminDropdownOption: (fieldKey: string, optionValue: string) =>
    api.delete(`/admin/admin-dropdowns/${fieldKey}/options/${optionValue}`),
};
