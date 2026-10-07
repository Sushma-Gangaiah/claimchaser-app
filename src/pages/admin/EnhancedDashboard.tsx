import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/context/authStore';
import { adminAPI, Entry, DropdownConfig } from '@/api/admin';
import { getCentralDate, formatDate, formatDateTime, formatEntryDateTime } from '@/utils/dates';
import { DateInput } from '@/components/DateInput';
import '../../styles/AdminDashboard.css';
import logo from '../../assets/logo.png';

type MainTabType = 'summary' | 'entries' | 'users' | 'configurations';
type SummaryTabType = 'user' | 'client';
type ConfigTabType = 'clients' | 'software' | 'insurance_type' | 'insurance_payer_type' | 'claim_type' | 'action_code';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  password_set: boolean;
  created_at: string;
}

const ReportIcon = ({ kind }: { kind: 'search' | 'columns' | 'download' }) => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
    {kind === 'search' && <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>}
    {kind === 'columns' && <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>}
    {kind === 'download' && <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>}
  </svg>
);

export const EnhancedAdminDashboard = () => {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('summary');
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTabType>('user');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTabType>('clients');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [reportUsers, setReportUsers] = useState<string[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSize, setReportPageSize] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const reportRequest = useRef(0);
  const [users, setUsers] = useState<User[]>([]);
  const [dropdowns, setDropdowns] = useState<DropdownConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown management state
  const [newClientCode, setNewClientCode] = useState('');
  const [newSoftware, setNewSoftware] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingSoftware, setIsAddingSoftware] = useState(false);
  const [editingClientCode, setEditingClientCode] = useState<string | null>(null);
  const [editingClientValue, setEditingClientValue] = useState('');
  const [editingSoftware, setEditingSoftware] = useState<string | null>(null);
  const [editingSoftwareValue, setEditingSoftwareValue] = useState('');

  // Admin dropdown management state
  const [adminDropdowns, setAdminDropdowns] = useState<any[]>([]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingOptionValue, setEditingOptionValue] = useState('');

  // Filter state for entries - default to today's submissions
  const getTodayDate = () => getCentralDate();
  const [userFilter, setUserFilter] = useState('');
  const [escalationFilter, setEscalationFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState(getTodayDate());
  const [dateToFilter, setDateToFilter] = useState(getTodayDate());
  const [showFilterColumn, setShowFilterColumn] = useState(false);

  // Column visibility for entries table
  const [showEntriesColumnFilter, setShowEntriesColumnFilter] = useState(false);
  const [entriesColumnVisibility, setEntriesColumnVisibility] = useState({
    user: true,
    client_code: true,
    patient_name: true,
    date_of_service: true,
    provider_name: true,
    location: true,
    payer_name: true,
    insurance_type: true,
    insurance_payer_type: true,
    claim_type: true,
    charges: true,
    paid_by_payer: true,
    claim_number: true,
    claim_due: true,
    last_submission_date: true,
    follow_up_date: true,
    date_worked: true,
    submitted_date: true,
    comments: true,
    status_code: true,
    sub_status_code: true,
    action_code: true,
    work_status: true,
    software: true,
    escalation: true,
  });

  // Column visibility for users table
  const [showUsersColumnFilter, setShowUsersColumnFilter] = useState(false);
  const [usersColumnVisibility, setUsersColumnVisibility] = useState({
    full_name: true,
    email: true,
    role: true,
    status: true,
    password_set: true,
    created_at: true,
    actions: true,
  });

  // User management state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserFullName, setEditUserFullName] = useState<string>('');
  const [editUserRole, setEditUserRole] = useState<string>('');
  const [editUserActive, setEditUserActive] = useState<boolean>(true);

  // Daily summary state - default to last 7 days
  const getDefaultDateFrom = () => {
    return getCentralDate(new Date(), -7);
  };
  const getDefaultDateTo = () => {
    return getCentralDate();
  };

  const [dailySummary, setDailySummary] = useState<any>({ date_range: [], summary: [] });
  const [clientSummary, setClientSummary] = useState<any>({ date_range: [], summary: [] });
  const [summaryDateFrom, setSummaryDateFrom] = useState(getDefaultDateFrom());
  const [summaryDateTo, setSummaryDateTo] = useState(getDefaultDateTo());

  const { user, logout } = useAuthStore();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  useEffect(() => {
    if (activeMainTab === 'entries') {
      loadEntriesSummary();
    } else if (activeMainTab === 'summary') {
      loadDailySummary();
    } else if (activeMainTab === 'users') {
      loadUsers();
    } else if (activeMainTab === 'configurations') {
      if (activeConfigTab === 'clients' || activeConfigTab === 'software') {
        loadDropdowns();
      } else if (['insurance_type', 'insurance_payer_type', 'claim_type', 'action_code'].includes(activeConfigTab)) {
        loadAdminDropdowns();
      }
    }
  }, [activeMainTab, activeSummaryTab, activeConfigTab, summaryDateFrom, summaryDateTo, dateFromFilter, dateToFilter]);

  const reportParams = () => ({
    date_from: dateFromFilter || undefined,
    date_to: dateToFilter || undefined,
    user_name: userFilter || undefined,
    escalation: escalationFilter ? escalationFilter === 'escalated' : undefined,
  });

  useEffect(() => {
    if (activeMainTab !== 'entries') return;
    const request = ++reportRequest.current;
    setIsLoading(true);
    setError('');
    adminAPI.getEntriesReport({ ...reportParams(), skip: (reportPage - 1) * reportPageSize, limit: reportPageSize })
      .then(({ data }) => {
        if (request !== reportRequest.current) return;
        const lastPage = Math.max(1, Math.ceil(data.total / reportPageSize));
        if (reportPage > lastPage) { setReportPage(lastPage); return; }
        setEntries(data.items);
        setEntriesTotal(data.total);
        setReportUsers(data.users);
      })
      .catch((err) => {
        if (request !== reportRequest.current) return;
        setEntries([]);
        setEntriesTotal(0);
        setError(err.response?.data?.detail || 'Failed to load entries');
      })
      .finally(() => { if (request === reportRequest.current) setIsLoading(false); });
    return () => { ++reportRequest.current; };
  }, [activeMainTab, reportPage, reportPageSize, dateFromFilter, dateToFilter, userFilter, escalationFilter]);

  const loadEntriesSummary = async () => {
    try {
      await adminAPI.getEntriesSummary();
    } catch (err) {
      console.error('Failed to load summary');
    }
  };

  const loadDailySummary = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [dailyResponse, clientResponse] = await Promise.all([
        adminAPI.getDailySummary(summaryDateFrom || undefined, summaryDateTo || undefined),
        adminAPI.getClientSummary(summaryDateFrom || undefined, summaryDateTo || undefined)
      ]);
      setDailySummary(dailyResponse.data);
      setClientSummary(clientResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load summaries');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdowns = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await adminAPI.getAllDropdowns();
      setDropdowns(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminDropdowns = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await adminAPI.getAllAdminDropdowns();
      setAdminDropdowns(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load admin configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getClientCodesConfig = (): DropdownConfig | null => {
    return dropdowns.find(d => d.field_key === 'client_codes') || null;
  };

  const getSoftwareConfig = (): DropdownConfig | null => {
    return dropdowns.find(d => d.field_key === 'software') || null;
  };

  const handleAddClientCode = async () => {
    if (!newClientCode.trim()) return;

    try {
      const clientConfig = getClientCodesConfig();

      if (clientConfig) {
        // Add to existing
        await adminAPI.addDropdownOption('client_codes', newClientCode.trim());
      } else {
        // Create new
        await adminAPI.createDropdown({
          field_key: 'client_codes',
          label: 'Client Codes',
          options: [newClientCode.trim()],
          is_required: false
        });
      }

      setNewClientCode('');
      setIsAddingClient(false);
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add client code');
    }
  };

  const handleEditClientCode = (code: string) => {
    setEditingClientCode(code);
    setEditingClientValue(code);
  };

  const handleSaveClientCode = async (oldValue: string) => {
    if (!editingClientValue.trim()) return;

    try {
      await adminAPI.updateDropdownOption('client_codes', oldValue, editingClientValue.trim());
      setEditingClientCode(null);
      setEditingClientValue('');
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update client code');
    }
  };

  const handleCancelEditClientCode = () => {
    setEditingClientCode(null);
    setEditingClientValue('');
  };

  const handleRemoveClientCode = async (code: string) => {
    if (!confirm(`Are you sure you want to remove "${code}"?`)) return;

    try {
      await adminAPI.removeDropdownOption('client_codes', code);
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove client code');
    }
  };

  const handleAddSoftware = async () => {
    if (!newSoftware.trim()) return;

    try {
      const softwareConfig = getSoftwareConfig();

      if (softwareConfig) {
        await adminAPI.addDropdownOption('software', newSoftware.trim());
      } else {
        await adminAPI.createDropdown({
          field_key: 'software',
          label: 'Software',
          options: [newSoftware.trim()],
          is_required: false
        });
      }

      setNewSoftware('');
      setIsAddingSoftware(false);
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add software');
    }
  };

  const handleEditSoftware = (software: string) => {
    setEditingSoftware(software);
    setEditingSoftwareValue(software);
  };

  const handleSaveSoftware = async (oldValue: string) => {
    if (!editingSoftwareValue.trim()) return;

    try {
      await adminAPI.updateDropdownOption('software', oldValue, editingSoftwareValue.trim());
      setEditingSoftware(null);
      setEditingSoftwareValue('');
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update software');
    }
  };

  const handleCancelEditSoftware = () => {
    setEditingSoftware(null);
    setEditingSoftwareValue('');
  };

  const handleRemoveSoftware = async (software: string) => {
    if (!confirm(`Are you sure you want to remove "${software}"?`)) return;

    try {
      await adminAPI.removeDropdownOption('software', software);
      await loadDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove software');
    }
  };

  // Admin Dropdown Handlers
  const getCurrentAdminDropdown = () => {
    return adminDropdowns.find(d => d.field_key === activeConfigTab) || null;
  };

  const getDropdownLabel = (fieldKey: string) => {
    const labels: Record<string, string> = {
      insurance_type: 'Insurance Type',
      insurance_payer_type: 'Insurance Payer Type',
      claim_type: 'Claim Type',
      action_code: 'Action Code'
    };
    return labels[fieldKey] || fieldKey;
  };

  const handleAddAdminOption = async () => {
    if (!newOptionValue.trim()) return;

    try {
      const currentConfig = getCurrentAdminDropdown();

      if (currentConfig) {
        // Add to existing
        await adminAPI.addAdminDropdownOption(activeConfigTab, newOptionValue.trim());
      } else {
        // Create new
        await adminAPI.createAdminDropdown({
          field_key: activeConfigTab,
          label: getDropdownLabel(activeConfigTab),
          options: [newOptionValue.trim()],
          is_active: true
        });
      }

      setNewOptionValue('');
      setIsAddingOption(false);
      await loadAdminDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add option');
    }
  };

  const handleEditAdminOption = (optionValue: string) => {
    setEditingOption(optionValue);
    setEditingOptionValue(optionValue);
  };

  const handleSaveAdminOption = async (oldValue: string) => {
    if (!editingOptionValue.trim()) return;

    try {
      await adminAPI.updateAdminDropdownOption(activeConfigTab, oldValue, editingOptionValue.trim());
      setEditingOption(null);
      setEditingOptionValue('');
      await loadAdminDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update option');
    }
  };

  const handleCancelEditAdminOption = () => {
    setEditingOption(null);
    setEditingOptionValue('');
  };

  const handleRemoveAdminOption = async (optionValue: string) => {
    if (!confirm(`Are you sure you want to remove "${optionValue}"?`)) return;

    try {
      await adminAPI.removeAdminDropdownOption(activeConfigTab, optionValue);
      await loadAdminDropdowns();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove option');
    }
  };

  // User Management Handlers
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteFullName.trim()) {
      alert('Email and Full Name are required');
      return;
    }

    try {
      await adminAPI.inviteUser({
        email: inviteEmail.trim(),
        full_name: inviteFullName.trim(),
        role: inviteRole
      });

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFullName('');
      setInviteRole('user');
      await loadUsers();
      alert('User invited successfully! An invitation email has been sent.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to invite user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserFullName(user.full_name);
    setEditUserRole(user.role);
    setEditUserActive(user.is_active);
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      await adminAPI.updateUser(userId, {
        full_name: editUserFullName,
        role: editUserRole,
        is_active: editUserActive
      });

      setEditingUserId(null);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditUserFullName('');
    setEditUserRole('');
    setEditUserActive(true);
  };

  const handleToggleUserAccess = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user's access?`)) return;

    try {
      await adminAPI.updateUser(userId, { is_active: !currentStatus });
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${email}"? This action cannot be undone.`)) return;

    try {
      await adminAPI.deleteUser(userId);
      await loadUsers();
      alert('User deleted successfully');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };

  const clearFilters = () => {
    setReportPage(1);
    setUserFilter('');
    setEscalationFilter('');
    setDateFromFilter(getTodayDate());
    setDateToFilter(getTodayDate());
    // Reset entries column visibility to default
    setEntriesColumnVisibility({
      user: true,
      client_code: true,
      patient_name: true,
      date_of_service: true,
      provider_name: true,
      location: true,
      payer_name: true,
      insurance_type: true,
      insurance_payer_type: true,
      claim_type: true,
      charges: true,
      paid_by_payer: true,
      claim_number: true,
      claim_due: true,
      last_submission_date: true,
      follow_up_date: true,
      date_worked: true,
      submitted_date: true,
      comments: true,
      status_code: true,
      sub_status_code: true,
      action_code: true,
      work_status: true,
      software: true,
      escalation: true,
    });
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setError('');
    try {
    const params = reportParams();
    const filteredData: Entry[] = [];
    let total = 0;
    do {
      const { data } = await adminAPI.getEntriesReport({ ...params, skip: filteredData.length, limit: 500 });
      total = data.total;
      filteredData.push(...data.items);
      setExportProgress(filteredData.length);
      if (data.items.length === 0 && filteredData.length < total) {
        throw new Error('Report changed during export. Please retry.');
      }
    } while (filteredData.length < total);

    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for export - only include visible columns
    const exportData = filteredData.map((entry) => {
      const row: Record<string, any> = {};

      if (entriesColumnVisibility.user) row['User'] = entry.user_name;
      if (entriesColumnVisibility.client_code) row['Client Code'] = entry.client_code || '';
      if (entriesColumnVisibility.patient_name) row['Patient Name'] = entry.patient_name || '';
      if (entriesColumnVisibility.date_of_service) row['Date of Service'] = formatDate(entry.date_of_service);
      if (entriesColumnVisibility.provider_name) row['Provider Name'] = entry.provider_name || '';
      if (entriesColumnVisibility.location) row['Location'] = entry.location || '';
      if (entriesColumnVisibility.payer_name) row['Payer Name'] = entry.payer_name || '';
      if (entriesColumnVisibility.insurance_type) row['Insurance Type'] = entry.insurance_type || '';
      if (entriesColumnVisibility.insurance_payer_type) row['Insurance Payer Type'] = entry.insurance_payer_type || '';
      if (entriesColumnVisibility.claim_type) row['Claim Type'] = entry.claim_type || '';
      if (entriesColumnVisibility.charges) row['Charges'] = entry.charges || '';
      if (entriesColumnVisibility.paid_by_payer) row['Paid by Payer'] = entry.paid_by_payer || '';
      if (entriesColumnVisibility.claim_number) row['Claims#'] = entry.claims_number || '';
      if (entriesColumnVisibility.claim_due) row['Claim Due'] = entry.claim_due ?? '';
      if (entriesColumnVisibility.last_submission_date) row['Last Submission Date'] = formatDate(entry.last_submission_date);
      if (entriesColumnVisibility.follow_up_date) row['Follow-up Date'] = formatDate(entry.follow_up_date);
      if (entriesColumnVisibility.date_worked) row['Date Worked'] = formatDate(entry.date_worked);
      if (entriesColumnVisibility.submitted_date) row['Submitted'] = formatEntryDateTime(entry);
      if (entriesColumnVisibility.comments) row['Comments'] = entry.comments || '';
      if (entriesColumnVisibility.status_code) row['Status Code'] = entry.status_code;
      if (entriesColumnVisibility.sub_status_code) row['Sub Status Code'] = entry.sub_status_code || '';
      if (entriesColumnVisibility.action_code) row['Action Code'] = entry.action_code || '';
      if (entriesColumnVisibility.work_status) row['Work Status'] = entry.work_status;
      if (entriesColumnVisibility.software) row['Software'] = entry.software || '';
      if (entriesColumnVisibility.escalation) row['Escalation'] = entry.escalation ? 'Yes' : 'No';

      return row;
    });

    const { createReportWorkbook } = await import('@/utils/reportWorkbook');
    const buffer = await createReportWorkbook(exportData);
    const fileName = `User_Entries_${dateFromFilter}_to_${dateToFilter}.xlsx`;
    const blob = new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to export entries');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleEntriesColumn = (columnKey: string) => {
    setEntriesColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const handleToggleUsersColumn = (columnKey: string) => {
    setUsersColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const entriesColumns = [
    { key: 'user', label: 'User' },
    { key: 'client_code', label: 'Client Code' },
    { key: 'patient_name', label: 'Patient Name' },
    { key: 'date_of_service', label: 'Date of Service' },
    { key: 'provider_name', label: 'Provider Name' },
    { key: 'location', label: 'Location' },
    { key: 'payer_name', label: 'Payer Name' },
    { key: 'insurance_type', label: 'Insurance Type' },
    { key: 'insurance_payer_type', label: 'Insurance Payer Type' },
    { key: 'claim_type', label: 'Claim Type' },
    { key: 'charges', label: 'Charges' },
    { key: 'paid_by_payer', label: 'Paid by Payer' },
    { key: 'claim_number', label: 'Claims#' },
    { key: 'claim_due', label: 'Claim Due' },
    { key: 'last_submission_date', label: 'Last Submission Date' },
    { key: 'follow_up_date', label: 'Follow-up Date' },
    { key: 'date_worked', label: 'Date Worked' },
    { key: 'submitted_date', label: 'Submitted' },
    { key: 'comments', label: 'Comments' },
    { key: 'status_code', label: 'Status Code' },
    { key: 'sub_status_code', label: 'Sub Status Code' },
    { key: 'action_code', label: 'Action Code' },
    { key: 'work_status', label: 'Work Status' },
    { key: 'software', label: 'Software' },
    { key: 'escalation', label: 'Escalation' },
  ];

  const reportColumnWidths: Record<string, number> = {
    user: 115, client_code: 85, patient_name: 155, date_of_service: 105,
    provider_name: 155, location: 105, payer_name: 170,
    insurance_type: 105, insurance_payer_type: 135, claim_type: 115,
    charges: 95, paid_by_payer: 100, claim_number: 135, claim_due: 95,
    last_submission_date: 115, follow_up_date: 110, date_worked: 105,
    submitted_date: 145, comments: 250, status_code: 125,
    sub_status_code: 140, action_code: 135, work_status: 120,
    software: 120, escalation: 95,
  };
  const visibleReportColumns = entriesColumns.filter(column =>
    entriesColumnVisibility[column.key as keyof typeof entriesColumnVisibility]
  );
  const reportTableWidth = visibleReportColumns.reduce((width, column) => width + reportColumnWidths[column.key], 0);

  const usersColumns = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'password_set', label: 'Password Set' },
    { key: 'created_at', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  const clientCodesConfig = getClientCodesConfig();
  const softwareConfig = getSoftwareConfig();
  const filteredEntries = entries;
  const uniqueUsers = reportUsers;

  // Check if column visibility changed from default
  const defaultColumnVisibility = {
    user: true,
    client_code: true,
    patient_name: true,
    date_of_service: true,
    provider_name: true,
    location: true,
    payer_name: true,
    insurance_type: true,
    insurance_payer_type: true,
    claim_type: true,
    charges: true,
    paid_by_payer: true,
    claim_number: true,
    claim_due: true,
    last_submission_date: true,
    follow_up_date: true,
    date_worked: true,
    submitted_date: true,
    comments: true,
    status_code: true,
    sub_status_code: true,
    action_code: true,
    work_status: true,
    software: true,
    escalation: true,
  };
  const hasColumnChanges = JSON.stringify(entriesColumnVisibility) !== JSON.stringify(defaultColumnVisibility);

  // Check if any filter is applied
  const hasActiveFilters = userFilter || escalationFilter || dateFromFilter !== getTodayDate() || dateToFilter !== getTodayDate() || hasColumnChanges;

  return (
    <div className="excel-dashboard">
      {/* Top Header */}
      <header className="excel-header">
        <div className="excel-header-left">
          <div className="excel-logo">
            <img src={logo} alt="Practice Management" />
          </div>
          <div className="excel-logo-divider"></div>
          <div className="excel-claims-logo">Claim Chaser</div>
        </div>
        <div className="excel-header-right" ref={profileDropdownRef}>
          <button
            className="excel-profile-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <span className="excel-profile-icon">👤</span>
            <span className="excel-profile-name">{user?.email?.split('@')[0] || 'User'}</span>
            <span className="excel-profile-role">{user?.role === 'admin' ? 'Admin' : 'User'}</span>
            <span className="excel-dropdown-arrow">▼</span>
          </button>
          {showProfileDropdown && (
            <div className="excel-profile-dropdown">
              <button onClick={handleLogout} className="excel-profile-dropdown-item">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="excel-container">
        {/* Left Sidebar Navigation */}
        <aside className="excel-sidebar">
          <nav className="excel-nav">
            <button
              className={`excel-nav-item ${activeMainTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('summary')}
            >
              <span className="excel-nav-icon">📊</span>
              <span className="excel-nav-label">Dashboard</span>
            </button>
            <button
              className={`excel-nav-item ${activeMainTab === 'entries' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('entries')}
            >
              <span className="excel-nav-icon">📈</span>
              <span className="excel-nav-label">Reports</span>
            </button>
            <button
              className={`excel-nav-item ${activeMainTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('users')}
            >
              <span className="excel-nav-icon">👥</span>
              <span className="excel-nav-label">User Management</span>
            </button>
            <button
              className={`excel-nav-item ${activeMainTab === 'configurations' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('configurations')}
            >
              <span className="excel-nav-icon">⚙️</span>
              <span className="excel-nav-label">Configuration Management</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="excel-main">
          {/* Sub-tabs for Summary */}
          {activeMainTab === 'summary' && (
            <div className="excel-subtabs">
              <button
                className={`excel-subtab ${activeSummaryTab === 'user' ? 'active' : ''}`}
                onClick={() => setActiveSummaryTab('user')}
              >
                By User
              </button>
              <button
                className={`excel-subtab ${activeSummaryTab === 'client' ? 'active' : ''}`}
                onClick={() => setActiveSummaryTab('client')}
              >
                By Client Code
              </button>
            </div>
          )}

          {/* Sub-tabs for Configurations */}
          {activeMainTab === 'configurations' && (
            <div className="excel-subtabs">
              <button
                className={`excel-subtab ${activeConfigTab === 'clients' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('clients')}
              >
                Client Codes
              </button>
              <button
                className={`excel-subtab ${activeConfigTab === 'software' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('software')}
              >
                Software
              </button>
              <button
                className={`excel-subtab ${activeConfigTab === 'insurance_type' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('insurance_type')}
              >
                Insurance Type
              </button>
              <button
                className={`excel-subtab ${activeConfigTab === 'insurance_payer_type' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('insurance_payer_type')}
              >
                Payer Type
              </button>
              <button
                className={`excel-subtab ${activeConfigTab === 'claim_type' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('claim_type')}
              >
                Claim Type
              </button>
              <button
                className={`excel-subtab ${activeConfigTab === 'action_code' ? 'active' : ''}`}
                onClick={() => setActiveConfigTab('action_code')}
              >
                Action Code
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

        {/* Entries Tab */}
        {activeMainTab === 'entries' && (
          <div className="tab-content">
            {/* Entries Table */}
            <section className="entries-section">
              <div className="entries-header">
                <h2>All User Entries</h2>
                <div className="entries-actions">
                  <button
                    className="filter-button"
                    onClick={() => setShowFilterColumn(!showFilterColumn)}
                  >
                    <ReportIcon kind="search" /> {showFilterColumn ? 'Hide Filters' : 'Filters'}
                  </button>
                  <button
                    className="filter-button"
                    onClick={() => setShowEntriesColumnFilter(true)}
                  >
                    <ReportIcon kind="columns" /> Show/Hide Columns
                  </button>
                  <button
                    className="filter-button"
                    onClick={handleExportToExcel}
                    disabled={isExporting || isLoading}
                    style={{ backgroundColor: '#28a745', color: 'white' }}
                  >
                    <ReportIcon kind="download" /> {isExporting ? `Exporting ${exportProgress} entries...` : 'Export All Matches'}
                  </button>
                  {hasActiveFilters && (
                    <button className="clear-filters-button" onClick={clearFilters}>
                      ✕ Clear All Filters
                    </button>
                  )}
                  <span className="entries-count">
                    {isLoading ? 'Loading...' : `Showing ${entriesTotal ? (reportPage - 1) * reportPageSize + 1 : 0}–${(reportPage - 1) * reportPageSize + entries.length} of ${entriesTotal}`}
                  </span>
                </div>
              </div>

              {showFilterColumn && (
                <div className="filters-panel">
                  <div className="filter-group">
                    <label>User:</label>
                    <select value={userFilter} onChange={(e) => { setReportPage(1); setUserFilter(e.target.value); }}>
                      <option value="">All Users</option>
                      {uniqueUsers.map(user => (
                        <option key={user} value={user}>{user}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Escalation:</label>
                    <select value={escalationFilter} onChange={(e) => { setReportPage(1); setEscalationFilter(e.target.value); }}>
                      <option value="">All</option>
                      <option value="escalated">Escalated</option>
                      <option value="not_escalated">Not Escalated</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Date From:</label>
                    <DateInput label="Date From"
                      value={dateFromFilter}
                      onChange={(value) => { setReportPage(1); setDateFromFilter(value); }}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Date To:</label>
                    <DateInput label="Date To"
                      value={dateToFilter}
                      onChange={(value) => { setReportPage(1); setDateToFilter(value); }}
                    />
                  </div>

                </div>
              )}

              {isLoading ? (
                <div className="loading">Loading entries...</div>
              ) : (
                <div className="entries-table-container" role="region" aria-label="All user entries" tabIndex={0}>
                  <table className="entries-table" style={{ width: reportTableWidth }}>
                    <colgroup>
                      {visibleReportColumns.map(column => (
                        <col key={column.key} style={{ width: reportColumnWidths[column.key] }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr>
                        {entriesColumnVisibility.user && <th>User</th>}
                        {entriesColumnVisibility.client_code && <th>Client Code</th>}
                        {entriesColumnVisibility.patient_name && <th>Patient Name</th>}
                        {entriesColumnVisibility.date_of_service && <th>Date of Service</th>}
                        {entriesColumnVisibility.provider_name && <th>Provider Name</th>}
                        {entriesColumnVisibility.location && <th>Location</th>}
                        {entriesColumnVisibility.payer_name && <th>Payer Name</th>}
                        {entriesColumnVisibility.insurance_type && <th>Insurance Type</th>}
                        {entriesColumnVisibility.insurance_payer_type && <th>Insurance Payer Type</th>}
                        {entriesColumnVisibility.claim_type && <th>Claim Type</th>}
                        {entriesColumnVisibility.charges && <th>Charges</th>}
                        {entriesColumnVisibility.paid_by_payer && <th>Paid by Payer</th>}
                        {entriesColumnVisibility.claim_number && <th>Claims#</th>}
                        {entriesColumnVisibility.claim_due && <th>Claim Due</th>}
                        {entriesColumnVisibility.last_submission_date && <th>Last Submission Date</th>}
                        {entriesColumnVisibility.follow_up_date && <th>Follow-up Date</th>}
                        {entriesColumnVisibility.date_worked && <th>Date Worked</th>}
                        {entriesColumnVisibility.submitted_date && <th>Submitted</th>}
                        {entriesColumnVisibility.comments && <th>Comments</th>}
                        {entriesColumnVisibility.status_code && <th>Status Code</th>}
                        {entriesColumnVisibility.sub_status_code && <th>Sub Status Code</th>}
                        {entriesColumnVisibility.action_code && <th>Action Code</th>}
                        {entriesColumnVisibility.work_status && <th>Work Status</th>}
                        {entriesColumnVisibility.software && <th>Software</th>}
                        {entriesColumnVisibility.escalation && <th>Escalation</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="entry-row">
                          {entriesColumnVisibility.user && <td>{entry.user_name}</td>}
                          {entriesColumnVisibility.client_code && <td>{entry.client_code || '-'}</td>}
                          {entriesColumnVisibility.patient_name && <td>{entry.patient_name || '-'}</td>}
                          {entriesColumnVisibility.date_of_service && <td>{formatDate(entry.date_of_service)}</td>}
                          {entriesColumnVisibility.provider_name && <td>{entry.provider_name || '-'}</td>}
                          {entriesColumnVisibility.location && <td>{entry.location || '-'}</td>}
                          {entriesColumnVisibility.payer_name && <td>{entry.payer_name || '-'}</td>}
                          {entriesColumnVisibility.insurance_type && <td>{entry.insurance_type || '-'}</td>}
                          {entriesColumnVisibility.insurance_payer_type && <td>{entry.insurance_payer_type || '-'}</td>}
                          {entriesColumnVisibility.claim_type && <td>{entry.claim_type || '-'}</td>}
                          {entriesColumnVisibility.charges && <td className="amount">{formatCurrency(entry.charges)}</td>}
                          {entriesColumnVisibility.paid_by_payer && <td className="amount">{formatCurrency(entry.paid_by_payer)}</td>}
                          {entriesColumnVisibility.claim_number && <td>{entry.claims_number || '-'}</td>}
                          {entriesColumnVisibility.claim_due && <td className="amount">{formatCurrency(entry.claim_due)}</td>}
                          {entriesColumnVisibility.last_submission_date && <td>{formatDate(entry.last_submission_date)}</td>}
                          {entriesColumnVisibility.follow_up_date && <td>{formatDate(entry.follow_up_date)}</td>}
                          {entriesColumnVisibility.date_worked && <td>{formatDate(entry.date_worked)}</td>}
                          {entriesColumnVisibility.submitted_date && <td className="date">{formatEntryDateTime(entry)}</td>}
                          {entriesColumnVisibility.comments && <td className="comments"><div className="report-comment" tabIndex={entry.comments ? 0 : undefined} aria-label="Comments">{entry.comments || '-'}</div></td>}
                          {entriesColumnVisibility.status_code && <td>
                            <span className={`badge badge-${entry.status_code.toLowerCase().replace(/[\s/]/g, '-')}`}>
                              {entry.status_code}
                            </span>
                          </td>}
                          {entriesColumnVisibility.sub_status_code && <td>{entry.sub_status_code || '-'}</td>}
                          {entriesColumnVisibility.action_code && <td>{entry.action_code || '-'}</td>}
                          {entriesColumnVisibility.work_status && <td>
                            <span className={`badge badge-${entry.work_status}`}>
                              {entry.work_status}
                            </span>
                          </td>}
                          {entriesColumnVisibility.software && <td>{entry.software || '-'}</td>}
                          {entriesColumnVisibility.escalation && <td className="center" style={entry.escalation ? { backgroundColor: '#fff3cd', fontWeight: 'bold' } : {}}>{entry.escalation ? '⚠️' : ''}</td>}
                        </tr>
                      ))}

                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={Object.values(entriesColumnVisibility).filter(Boolean).length} className="no-data">
                            {entries.length === 0 ? 'No entries found' : 'No entries match the current filters'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="report-pagination" aria-label="Report pagination">
                <label>Entries per page: <select value={reportPageSize} disabled={isLoading} onChange={(e) => { setReportPage(1); setReportPageSize(Number(e.target.value)); }}>
                  {[50, 100, 250, 500].map(size => <option key={size} value={size}>{size}</option>)}
                </select></label>
                <button className="filter-button" disabled={isLoading || reportPage === 1} onClick={() => setReportPage(p => p - 1)}>Previous</button>
                <span>Page {reportPage} of {Math.max(1, Math.ceil(entriesTotal / reportPageSize))}</span>
                <button className="filter-button" disabled={isLoading || reportPage * reportPageSize >= entriesTotal} onClick={() => setReportPage(p => p + 1)}>Next</button>
              </div>

            </section>
          </div>
        )}

        {/* User Management Tab */}
        {activeMainTab === 'users' && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>User Management</h2>
                <div className="header-actions">
                  <button
                    className="filter-button"
                    onClick={() => setShowUsersColumnFilter(true)}
                  >
                    <ReportIcon kind="columns" /> Show/Hide Columns
                  </button>
                  <button
                    className="add-button"
                    onClick={() => setShowInviteModal(true)}
                  >
                    ➕ Invite New User
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="loading">Loading users...</div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        {usersColumnVisibility.full_name && <th>Full Name</th>}
                        {usersColumnVisibility.email && <th>Email</th>}
                        {usersColumnVisibility.role && <th>Role</th>}
                        {usersColumnVisibility.status && <th>Status</th>}
                        {usersColumnVisibility.password_set && <th>Password Set</th>}
                        {usersColumnVisibility.created_at && <th>Created At</th>}
                        {usersColumnVisibility.actions && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userItem) => (
                        editingUserId === userItem.id ? (
                          <tr key={userItem.id} className="user-row editing-row">
                            {usersColumnVisibility.full_name && <td>
                              <input
                                type="text"
                                value={editUserFullName}
                                onChange={(e) => setEditUserFullName(e.target.value)}
                                placeholder="Full Name"
                              />
                            </td>}
                            {usersColumnVisibility.email && <td>{userItem.email}</td>}
                            {usersColumnVisibility.role && <td>
                              <select value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>}
                            {usersColumnVisibility.status && <td>
                              <select value={editUserActive ? 'active' : 'inactive'} onChange={(e) => setEditUserActive(e.target.value === 'active')}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>}
                            {usersColumnVisibility.password_set && <td>{userItem.password_set ? '✓' : '✗'}</td>}
                            {usersColumnVisibility.created_at && <td>{formatDateTime(userItem.created_at, 'UTC')}</td>}
                            {usersColumnVisibility.actions && <td>
                              <div className="action-buttons">
                                <button className="save-btn-small" onClick={() => handleUpdateUser(userItem.id)}>Save</button>
                                <button className="cancel-btn-small" onClick={handleCancelEdit}>Cancel</button>
                              </div>
                            </td>}
                          </tr>
                        ) : (
                          <tr key={userItem.id} className="user-row">
                            {usersColumnVisibility.full_name && <td>{userItem.full_name}</td>}
                            {usersColumnVisibility.email && <td>{userItem.email}</td>}
                            {usersColumnVisibility.role && <td>
                              <span className={`role-badge role-${userItem.role}`}>
                                {userItem.role}
                              </span>
                            </td>}
                            {usersColumnVisibility.status && <td>
                              <span className={`status-badge ${userItem.is_active ? 'status-active' : 'status-inactive'}`}>
                                {userItem.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>}
                            {usersColumnVisibility.password_set && <td className="center">{userItem.password_set ? '✓' : '✗'}</td>}
                            {usersColumnVisibility.created_at && <td className="date">{formatDateTime(userItem.created_at, 'UTC')}</td>}
                            {usersColumnVisibility.actions && <td>
                              <div className="action-buttons">
                                <button className="edit-btn-small" onClick={() => handleEditUser(userItem)}>
                                  Edit
                                </button>
                                <button
                                  className={userItem.is_active ? "deactivate-btn-small" : "activate-btn-small"}
                                  onClick={() => handleToggleUserAccess(userItem.id, userItem.is_active)}
                                >
                                  {userItem.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  className="delete-btn-small"
                                  onClick={() => handleDeleteUser(userItem.id, userItem.email)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>}
                          </tr>
                        )
                      ))}

                      {users.length === 0 && (
                        <tr>
                          <td colSpan={Object.values(usersColumnVisibility).filter(Boolean).length} className="no-data">
                            No users found. Click "Invite New User" to add users.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Client Codes Tab */}
        {activeMainTab === 'configurations' && activeConfigTab === 'clients' && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>Client Codes Management</h2>
                <button
                  className="add-button"
                  onClick={() => setIsAddingClient(!isAddingClient)}
                >
                  + Add Client Code
                </button>
              </div>

              {isAddingClient && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newClientCode}
                    onChange={(e) => setNewClientCode(e.target.value)}
                    placeholder="Enter client code"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddClientCode()}
                  />
                  <button className="save-btn" onClick={handleAddClientCode}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={() => setIsAddingClient(false)}>
                    Cancel
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <div className="options-grid">
                  {clientCodesConfig?.options.map((code) => (
                    <div key={code} className="option-item">
                      {editingClientCode === code ? (
                        <>
                          <input
                            type="text"
                            value={editingClientValue}
                            onChange={(e) => setEditingClientValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveClientCode(code)}
                            className="edit-input"
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button
                              className="save-icon-btn"
                              onClick={() => handleSaveClientCode(code)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-icon-btn"
                              onClick={handleCancelEditClientCode}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{code}</span>
                          <div className="option-actions">
                            <button
                              className="edit-icon-btn"
                              onClick={() => handleEditClientCode(code)}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              className="remove-btn"
                              onClick={() => handleRemoveClientCode(code)}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {(!clientCodesConfig || clientCodesConfig.options.length === 0) && (
                    <div className="no-data">No client codes configured</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Software Tab */}
        {activeMainTab === 'configurations' && activeConfigTab === 'software' && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>Software Management</h2>
                <button
                  className="add-button"
                  onClick={() => setIsAddingSoftware(!isAddingSoftware)}
                >
                  + Add Software
                </button>
              </div>

              {isAddingSoftware && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newSoftware}
                    onChange={(e) => setNewSoftware(e.target.value)}
                    placeholder="Enter software name"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSoftware()}
                  />
                  <button className="save-btn" onClick={handleAddSoftware}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={() => setIsAddingSoftware(false)}>
                    Cancel
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <div className="options-grid">
                  {softwareConfig?.options.map((software) => (
                    <div key={software} className="option-item">
                      {editingSoftware === software ? (
                        <>
                          <input
                            type="text"
                            value={editingSoftwareValue}
                            onChange={(e) => setEditingSoftwareValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSoftware(software)}
                            className="edit-input"
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button
                              className="save-icon-btn"
                              onClick={() => handleSaveSoftware(software)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-icon-btn"
                              onClick={handleCancelEditSoftware}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{software}</span>
                          <div className="option-actions">
                            <button
                              className="edit-icon-btn"
                              onClick={() => handleEditSoftware(software)}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              className="remove-btn"
                              onClick={() => handleRemoveSoftware(software)}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {(!softwareConfig || softwareConfig.options.length === 0) && (
                    <div className="no-data">No software configured</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Admin Dropdown Tabs (Insurance Type, Payer Type, Claim Type, Action Code) */}
        {activeMainTab === 'configurations' && ['insurance_type', 'insurance_payer_type', 'claim_type', 'action_code'].includes(activeConfigTab) && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>{getDropdownLabel(activeConfigTab)} Management</h2>
                <button
                  className="add-button"
                  onClick={() => setIsAddingOption(!isAddingOption)}
                >
                  + Add Option
                </button>
              </div>

              {isAddingOption && (
                <div className="add-form">
                  <input
                    type="text"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    placeholder={`Enter ${getDropdownLabel(activeConfigTab).toLowerCase()} option`}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAdminOption()}
                  />
                  <button className="save-btn" onClick={handleAddAdminOption}>
                    Save
                  </button>
                  <button className="cancel-btn" onClick={() => setIsAddingOption(false)}>
                    Cancel
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="loading">Loading...</div>
              ) : (
                <div className="options-grid">
                  {getCurrentAdminDropdown()?.options.map((option: string) => (
                    <div key={option} className="option-item">
                      {editingOption === option ? (
                        <>
                          <input
                            type="text"
                            value={editingOptionValue}
                            onChange={(e) => setEditingOptionValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveAdminOption(option)}
                            className="edit-input"
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button
                              className="save-icon-btn"
                              onClick={() => handleSaveAdminOption(option)}
                              title="Save"
                            >
                              ✓
                            </button>
                            <button
                              className="cancel-icon-btn"
                              onClick={handleCancelEditAdminOption}
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{option}</span>
                          <div className="option-actions">
                            <button
                              className="edit-icon-btn"
                              onClick={() => handleEditAdminOption(option)}
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              className="remove-btn"
                              onClick={() => handleRemoveAdminOption(option)}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {(!getCurrentAdminDropdown() || getCurrentAdminDropdown()?.options.length === 0) && (
                    <div className="no-data">No options configured</div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Summary Tab - User Summary */}
        {activeMainTab === 'summary' && activeSummaryTab === 'user' && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>Entries by User</h2>
                <div className="header-actions">
                  <DateInput label="Summary Date From"
                    value={summaryDateFrom}
                    onChange={(value) => setSummaryDateFrom(value)}
                    style={{ marginRight: '8px', padding: '8px' }}
                  />
                  <DateInput label="Summary Date To"
                    value={summaryDateTo}
                    onChange={(value) => setSummaryDateTo(value)}
                    style={{ padding: '8px' }}
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              {isLoading ? (
                <div className="loading">Loading user summary...</div>
              ) : (
                <div className="summary-table-container" style={{ overflowX: 'auto' }}>
                  <table className="excel-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        {dailySummary.date_range?.map((dateStr: string) => (
                          <th key={dateStr}>{formatDate(dateStr)}</th>
                        ))}
                        <th><strong>Total</strong></th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.summary?.map((row: any) => (
                        <tr key={row.user}>
                          <td><strong>{row.user}</strong></td>
                          {dailySummary.date_range?.map((dateStr: string) => (
                            <td key={dateStr} className="center">{row[dateStr] || 0}</td>
                          ))}
                          <td className="center"><strong>{row.total}</strong></td>
                        </tr>
                      ))}
                      {dailySummary.summary?.length === 0 && (
                        <tr>
                          <td colSpan={(dailySummary.date_range?.length || 0) + 2} className="no-data">
                            No entries found in selected date range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Summary Tab - Client Summary */}
        {activeMainTab === 'summary' && activeSummaryTab === 'client' && (
          <div className="tab-content">
            <section className="config-section">
              <div className="config-header">
                <h2>Entries by Client Code</h2>
                <div className="header-actions">
                  <DateInput label="Summary Date From"
                    value={summaryDateFrom}
                    onChange={(value) => setSummaryDateFrom(value)}
                    style={{ marginRight: '8px', padding: '8px' }}
                  />
                  <DateInput label="Summary Date To"
                    value={summaryDateTo}
                    onChange={(value) => setSummaryDateTo(value)}
                    style={{ padding: '8px' }}
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              {isLoading ? (
                <div className="loading">Loading client summary...</div>
              ) : (
                <div className="summary-table-container" style={{ overflowX: 'auto' }}>
                  <table className="excel-table">
                    <thead>
                      <tr>
                        <th>Client Code</th>
                        {clientSummary.date_range?.map((dateStr: string) => (
                          <th key={dateStr}>{formatDate(dateStr)}</th>
                        ))}
                        <th><strong>Total</strong></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientSummary.summary?.map((row: any) => (
                        <tr key={row.client_code} className={row.client_code === 'Total' ? 'total-row' : ''} style={row.client_code === 'Total' ? { fontWeight: 'bold', backgroundColor: '#f0f0f0' } : {}}>
                          <td><strong>{row.client_code}</strong></td>
                          {clientSummary.date_range?.map((dateStr: string) => (
                            <td key={dateStr} className="center">{row[dateStr] || 0}</td>
                          ))}
                          <td className="center"><strong>{row.total}</strong></td>
                        </tr>
                      ))}
                      {clientSummary.summary?.length === 0 && (
                        <tr>
                          <td colSpan={(clientSummary.date_range?.length || 0) + 2} className="no-data">
                            No entries found in selected date range
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
        </main>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="invite-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite New User</h2>
              <button className="close-button" onClick={() => setShowInviteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="info-box">
                <p>ℹ️ An invitation email will be sent to the user with a link to set their password.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowInviteModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleInviteUser}>
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Column Filter Modal */}
      {showEntriesColumnFilter && (
        <div className="modal-overlay" onClick={() => setShowEntriesColumnFilter(false)}>
          <div className="column-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customize Visible Columns</h2>
              <button className="close-button" onClick={() => setShowEntriesColumnFilter(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#7f8c8d', fontSize: '14px' }}>
                Select which columns you want to display in the entries table
              </p>
              <div className="column-filter-list">
                {entriesColumns.map((col) => (
                  <label key={col.key} className="column-filter-item">
                    <input
                      type="checkbox"
                      checked={entriesColumnVisibility[col.key as keyof typeof entriesColumnVisibility]}
                      onChange={() => handleToggleEntriesColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={() => setShowEntriesColumnFilter(false)}>
                ✓ Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Column Filter Modal */}
      {showUsersColumnFilter && (
        <div className="modal-overlay" onClick={() => setShowUsersColumnFilter(false)}>
          <div className="column-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customize Visible Columns</h2>
              <button className="close-button" onClick={() => setShowUsersColumnFilter(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#7f8c8d', fontSize: '14px' }}>
                Select which columns you want to display in the users table
              </p>
              <div className="column-filter-list">
                {usersColumns.map((col) => (
                  <label key={col.key} className="column-filter-item">
                    <input
                      type="checkbox"
                      checked={usersColumnVisibility[col.key as keyof typeof usersColumnVisibility]}
                      onChange={() => handleToggleUsersColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="save-btn" onClick={() => setShowUsersColumnFilter(false)}>
                ✓ Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

