import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/context/authStore';
import { userAPI } from '@/api/user';
import api from '@/api/client';
import { getCentralDate, getEntryDate, formatDate, formatDateTime, formatEntryDateTime } from '@/utils/dates';
import { DateInput } from '@/components/DateInput';
import '../styles/AdminDashboard.css';
import '../styles/UserDashboard.css';
import logo from '../assets/logo.png';

interface Entry {
  id: string;
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
  worked_date: string;
  escalation: boolean;
  work_status: string;
  software: string | null;
  is_draft: boolean;
  user_name: string;
  created_at: string;
  submitted_at: string | null;
}

interface EntryFormData {
  client_code: string;
  patient_name: string;
  date_of_service: string;
  provider_name: string;
  location: string;
  payer_name: string;
  insurance_type: string;
  insurance_payer_type: string;
  claim_type: string;
  charges: string;
  paid_by_payer: string;
  payer_control_num: string;
  claims_number: string;
  claim_due: string;
  last_submission_date: string;
  follow_up_date: string;
  date_worked: string;
  comments: string;
  status_code: string;
  sub_status_code: string;
  action_code: string;
  work_status: string;
  software: string;
  escalation: boolean;
}

interface DropdownOptions {
  client_codes?: string[];
  software?: string[];
  insurance_type?: string[];
  insurance_payer_type?: string[];
  claim_type?: string[];
  action_code?: string[];
}

const STATUS_OPTIONS = [
  'Denied',
  'In_Process',
  'Not_Received',
  'Paid',
  'Pending',
  'Rejection',
  'Status_Not_Provided'
];

const STATUS_SUB_STATUS_MAP: { [key: string]: string[] } = {
  'Denied': [
    'Additional Information - From Patient',
    'Additional Information - From Provider',
    'Adjustment Required - Non-Payable Procedure',
    'Appeal not on file',
    'Appeal Upheld',
    'Authorization - Missing/ Invalid',
    'Benefits Exhausted',
    'Bill PT - Lapse in Coverage',
    'Inclusive/Bundle/Global',
    'Coordination of Benefits',
    'Denied - OON',
    'Denied as Duplicate',
    'Denied for DME',
    'Need Qualifying Service code',
    'Documentation Required - Implant Invoice',
    'Documentation Required - Itemized Bill',
    'Documentation Required - Medical Records',
    'Documentation Required - W-9 Form',
    'Experimental and Investigation Service',
    'Frequency Limitation',
    'Incorrect/Invalid Diagnosis',
    'Incorrect/Invalid Procedure',
    'Incorrect/Invalid/Missing Modifier',
    'Missing Info in Claim Form'
  ],
  'In_Process': [
    'Appeal In Process',
    'Claim In Process'
  ],
  'Paid': [
    'Adjustment Required - Sent to posting',
    'Paid to Patient',
    'Payment Correction',
    'Primary paid more than secondary',
    'PT responsibility',
    'Small Balance Adj',
    'Underpaid - Contracted',
    'Underpaid - Non-Contracted',
    'Zero Balance'
  ],
  'Not_Received': [
    'Claim Not on File- Primary',
    'Claim Not on File-Secondary',
    'Corrected Claim',
    'Correction - Insurance Info',
    'Correction - Registration Info',
    'Rejections',
    'Sent to Wrong Payer',
    'Subscriber Not Found',
    'Unbilled'
  ],
  'Pending': [
    'Claim status Request via Fax or E-mail',
    'Left Voice mail'
  ],
  'Rejection': [
    'Add New Insurance',
    'Correction - Insurance Info',
    'Correction-Provider Data',
    'Incorrect/Invalid Diagnosis',
    'Incorrect/Invalid Procedure',
    'Incorrect/Invalid/Missing Modifier',
    'Missing Info in Claim Form',
    'Missing or Invalid POS',
    'Missing or invalid provider NPI',
    'Missing or invalid provider Signature',
    'Missing or invalid provider Tax ID',
    'Provider not enrolled/ credentialed',
    'Rejected for NDC',
    'Subscriber Not Found',
    'COB Line item issue'
  ],
  'Status_Not_Provided': [
    'Online statuses only',
    'Status provided only to listed contacts'
  ]
};

export const UserDashboard = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const entryDialogRef = useRef<HTMLDivElement>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({});

  // Filter state - default to today only
  const getTodayDate = () => getCentralDate();

  const [showFilters, setShowFilters] = useState(false);
  const [dateFromFilter, setDateFromFilter] = useState(getTodayDate());
  const [dateToFilter, setDateToFilter] = useState(getTodayDate());

  // Column visibility state
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
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
    date_worked: false,
    submitted_date: true,
    comments: true,
    status_code: true,
    sub_status_code: true,
    action_code: true,
    work_status: true,
    software: true,
    is_draft: true,
    actions: true,
  });

  const [formData, setFormData] = useState<EntryFormData>({
    client_code: '',
    patient_name: '',
    date_of_service: '',
    provider_name: '',
    location: '',
    payer_name: '',
    insurance_type: '',
    insurance_payer_type: '',
    claim_type: '',
    charges: '',
    paid_by_payer: '',
    payer_control_num: '',
    claims_number: '',
    claim_due: '',
    last_submission_date: '',
    follow_up_date: '',
    date_worked: '',
    comments: '',
    status_code: '',
    sub_status_code: '',
    action_code: '',
    work_status: 'not_started',
    software: '',
    escalation: false,
  });

  const { user, logout } = useAuthStore();

  // Helper functions
  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      // Exclude drafts in submitted entries tab
      if (entry.is_draft) {
        return false;
      }

      // Date range filter (using submitted_at date in CST - compare dates only)
      const dateToCompare = getEntryDate(entry);
      if (dateFromFilter && dateToCompare) {
        const entryDateStr = dateToCompare;
        if (entryDateStr < dateFromFilter) {
          return false;
        }
      }

      if (dateToFilter && dateToCompare) {
        const entryDateStr = dateToCompare;
        if (entryDateStr > dateToFilter) {
          return false;
        }
      }

      return true;
    });
  };

  const handleToggleColumn = (columnKey: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const tableColumns = [
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
    { key: 'is_draft', label: 'Draft?' },
    { key: 'actions', label: 'Actions' },
  ];

  useEffect(() => {
    loadEntries();
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const [basicDropdowns, adminDropdowns] = await Promise.all([
        userAPI.getDropdowns(),
        api.get('/user/admin-dropdowns')
      ]);

      setDropdownOptions({
        client_codes: basicDropdowns.data.client_codes || [],
        software: basicDropdowns.data.software || [],
        insurance_type: adminDropdowns.data.insurance_type || [],
        insurance_payer_type: adminDropdowns.data.insurance_payer_type || [],
        claim_type: adminDropdowns.data.claim_type || [],
        action_code: adminDropdowns.data.action_code || [],
      });
    } catch (err) {
      console.error('Failed to load dropdowns:', err);
    }
  };

  const loadEntries = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load all entries, filter client-side
      const response = await userAPI.getMyEntries(false);
      setEntries(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleAddEntry = () => {
    const currentDate = getCentralDate();

    setEditingEntry(null);
    setFormData({
      client_code: '',
      patient_name: '',
      date_of_service: '',
      provider_name: '',
      location: '',
      payer_name: '',
      insurance_type: '',
      insurance_payer_type: '',
      claim_type: '',
      charges: '',
      paid_by_payer: '',
      payer_control_num: '',
      claims_number: '',
      claim_due: '',
      last_submission_date: '',
      follow_up_date: '',
      date_worked: currentDate,
      comments: '',
      status_code: '',
      sub_status_code: '',
      action_code: '',
      work_status: 'not_started',
      software: '',
      escalation: false,
    });
    setShowDialog(true);
  };

  const handleEditEntry = (entry: Entry) => {
    if (!entry.is_draft) {
      alert('Submitted entries cannot be edited');
      return;
    }
    setEditingEntry(entry);
    setFormData({
      client_code: entry.client_code || '',
      patient_name: entry.patient_name || '',
      date_of_service: entry.date_of_service || '',
      provider_name: entry.provider_name || '',
      location: entry.location || '',
      payer_name: entry.payer_name || '',
      insurance_type: entry.insurance_type || '',
      insurance_payer_type: entry.insurance_payer_type || '',
      claim_type: entry.claim_type || '',
      charges: entry.charges || '',
      paid_by_payer: entry.paid_by_payer || '',
      payer_control_num: entry.payer_control_num || '',
      claims_number: entry.claims_number || '',
      claim_due: entry.claim_due ?? '',
      last_submission_date: entry.last_submission_date || '',
      follow_up_date: entry.follow_up_date || '',
      date_worked: entry.date_worked || getTodayDate(),
      comments: entry.comments || '',
      status_code: entry.status_code,
      sub_status_code: entry.sub_status_code || '',
      action_code: entry.action_code || '',
      work_status: entry.work_status,
      software: entry.software || '',
      escalation: entry.escalation,
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingEntry(null);
  };

  const validateEntryDates = () => {
    const invalidDate = entryDialogRef.current?.querySelector<HTMLInputElement>('.us-date-field input[aria-invalid="true"]');
    if (!invalidDate) return true;
    invalidDate.reportValidity();
    return false;
  };

  const validateRequiredFields = () => {
    // Validate all required fields are filled
    const requiredFields = [
      'client_code',
      'patient_name',
      'date_of_service',
      'provider_name',
      'location',
      'payer_name',
      'insurance_type',
      'insurance_payer_type',
      'claim_type',
      'charges',
      'paid_by_payer',
      'payer_control_num',
      'claims_number',
      'claim_due',
      'date_worked',
      'last_submission_date',
      'follow_up_date',
      'comments',
      'status_code',
      'sub_status_code',
      'action_code',
      'software'
    ];

    const emptyFields = requiredFields.filter(field => !String(formData[field as keyof EntryFormData] ?? '').trim());

    if (emptyFields.length > 0) {
      alert('Please fill in all mandatory fields before saving:\n' + emptyFields.join(', '));
      return false;
    }

    for (const field of ['charges', 'paid_by_payer', 'claim_due'] as const) {
      if (!Number.isFinite(Number(formData[field]))) {
        alert('Please enter a valid amount for ' + field.replace(/_/g, ' ') + '.');
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateEntryDates() || !validateRequiredFields()) return;
    try {
      const payload = {
        ...formData,
        is_draft: true,
        user_name: user?.email?.split('@')[0] || user?.email || 'User',
      };

      if (editingEntry) {
        await userAPI.updateEntry(editingEntry.id, payload);
      } else {
        await userAPI.createEntry(payload);
      }

      setShowDialog(false);
      setEditingEntry(null);
      loadEntries();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to save draft';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleSubmitEntry = async () => {
    if (!validateEntryDates() || !validateRequiredFields()) return;

    try {
      const payload = {
        ...formData,
        is_draft: false,
        user_name: user?.email?.split('@')[0] || user?.email || 'User',
      };

      if (editingEntry) {
        await userAPI.updateEntry(editingEntry.id, payload);
      } else {
        await userAPI.createEntry(payload);
      }

      setShowDialog(false);
      setEditingEntry(null);
      loadEntries();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to submit entry';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await userAPI.deleteEntry(entryId);
      loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete entry');
      alert('Failed to delete entry: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '';
    return parseFloat(value).toFixed(2);
  };

  const getSubStatusOptions = (statusCode: string): string[] => {
    return STATUS_SUB_STATUS_MAP[statusCode] || [];
  };

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'drafts'>('dashboard');

  // Calculate summary stats based on submitted date filter (use same filter as entries tab)
  const getDashboardFilteredEntries = () => {
    return entries.filter((entry) => {
      // Use submitted_at for filtering (same as entries tab)
      const dateToCompare = getEntryDate(entry);

      if (dateFromFilter && dateToCompare) {
        const entryDateStr = dateToCompare;
        if (entryDateStr < dateFromFilter) return false;
      }

      if (dateToFilter && dateToCompare) {
        const entryDateStr = dateToCompare;
        if (entryDateStr > dateToFilter) return false;
      }

      return true;
    });
  };

  const dashboardEntries = getDashboardFilteredEntries();
  // Filter by date range for submitted only
  const submittedInRange = dashboardEntries.filter(e => !e.is_draft);
  const allDrafts = entries.filter(e => e.is_draft); // All drafts regardless of date

  const totalEntries = submittedInRange.length + allDrafts.length; // Submitted in range + all drafts
  const submittedCount = submittedInRange.length; // Submitted in date range
  const draftsCount = allDrafts.length; // All drafts (any date)

  const today = getTodayDate();
  const pendingFollowUpCount = submittedInRange.filter(e => {
    if (!e.follow_up_date) return false;
    return e.follow_up_date >= today;
  }).length;

  return (
    <div className="excel-dashboard user-excel-dashboard">
      {/* Top Header */}
      <header className="excel-header">
        <div className="excel-header-left">
          <div className="excel-logo">
            <img src={logo} alt="Practice Management" />
          </div>
          <div className="excel-logo-divider"></div>
          <div className="excel-claims-logo">Claim Chaser</div>
        </div>
        <div className="excel-header-right">
          <button
            className="excel-profile-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <span className="excel-profile-icon">👤</span>
            <span className="excel-profile-name">{user?.email?.split('@')[0] || 'User'}</span>
            <span className="excel-profile-role">User</span>
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
        {/* Left Sidebar */}
        <aside className="excel-sidebar">
          <nav className="excel-nav">
            <button
              className={`excel-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="excel-nav-icon">📊</span>
              <span className="excel-nav-label">Dashboard</span>
            </button>
            <button
              className={`excel-nav-item ${activeTab === 'entries' ? 'active' : ''}`}
              onClick={() => setActiveTab('entries')}
            >
              <span className="excel-nav-icon">📝</span>
              <span className="excel-nav-label">Submitted Entries</span>
            </button>
            <button
              className={`excel-nav-item ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >
              <span className="excel-nav-icon">📄</span>
              <span className="excel-nav-label">Draft Entries</span>
            </button>
            <button
              className={`excel-nav-item`}
              onClick={handleAddEntry}
            >
              <span className="excel-nav-icon">➕</span>
              <span className="excel-nav-label">Add Entry</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="excel-main">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="user-dashboard-content">
              <div className="dashboard-welcome">
                <h1>Dashboard</h1>
                <p>Welcome back, {user?.email?.split('@')[0]}!</p>
              </div>

              <div className="user-dashboard-filters">
                <DateInput label="Date From"
                  className="date-input"
                  value={dateFromFilter}
                  onChange={(value) => setDateFromFilter(value)}
                />
                <span>-</span>
                <DateInput label="Date To"
                  className="date-input"
                  value={dateToFilter}
                  onChange={(value) => setDateToFilter(value)}
                />
              </div>

              <div className="user-summary-cards">
                <div className="user-summary-card">
                  <div className="card-icon green">📄</div>
                  <div className="card-content">
                    <div className="card-label">Total Entries</div>
                    <div className="card-value">{totalEntries}</div>
                    <div className="card-subtitle">In date range</div>
                  </div>
                </div>
                <div className="user-summary-card">
                  <div className="card-icon blue">✈️</div>
                  <div className="card-content">
                    <div className="card-label">Submitted</div>
                    <div className="card-value">{submittedCount}</div>
                    <div className="card-subtitle">{totalEntries > 0 ? ((submittedCount/totalEntries)*100).toFixed(2) : 0}% of total</div>
                  </div>
                </div>
                <div className="user-summary-card">
                  <div className="card-icon orange">🕐</div>
                  <div className="card-content">
                    <div className="card-label">Pending Follow-up</div>
                    <div className="card-value">{pendingFollowUpCount}</div>
                    <div className="card-subtitle">{totalEntries > 0 ? ((pendingFollowUpCount/totalEntries)*100).toFixed(2) : 0}% of total</div>
                  </div>
                </div>
                <div className="user-summary-card">
                  <div className="card-icon purple">📋</div>
                  <div className="card-content">
                    <div className="card-label">Drafts</div>
                    <div className="card-value">{draftsCount}</div>
                    <div className="card-subtitle">{totalEntries > 0 ? ((draftsCount/totalEntries)*100).toFixed(2) : 0}% of total</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Entries Tab */}
          {activeTab === 'entries' && (
            <div className="tab-content">
              <section className="entries-section">
                <div className="entries-header">
                  <h2>My Entries</h2>
                  <div className="header-actions">
              <button
                className="filter-button"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="filter-icon">🔍</span> {showFilters ? 'Hide Filters' : 'Filters'}
              </button>
              <button
                className="filter-button"
                onClick={() => setShowColumnFilter(true)}
              >
                <span className="filter-icon">👁️</span> Show/Hide Columns
              </button>
              {(dateFromFilter !== getTodayDate() || dateToFilter !== getTodayDate()) && (
                <button className="clear-filters-button" onClick={() => {
                  setDateFromFilter(getTodayDate());
                  setDateToFilter(getTodayDate());
                }}>
                  🔄 Reset to Today
                </button>
              )}
              <span className="entries-count">
                Showing {getFilteredEntries().length} of {entries.length}
              </span>
              <button className="add-entry-button" onClick={handleAddEntry}>
                ➕ Add Entry
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Date From:</label>
                <DateInput label="Date From"
                  value={dateFromFilter}
                  max={dateToFilter || undefined}
                  onChange={(value) => setDateFromFilter(value)}
                />
              </div>

              <div className="filter-group">
                <label>Date To:</label>
                <DateInput label="Date To"
                  value={dateToFilter}
                  min={dateFromFilter || undefined}
                  onChange={(value) => setDateToFilter(value)}
                />
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {isLoading ? (
            <div className="loading">Loading entries...</div>
          ) : (
            <div className="excel-table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    {columnVisibility.client_code && <th>Client Code</th>}
                    {columnVisibility.patient_name && <th>Patient Name</th>}
                    {columnVisibility.date_of_service && <th>Date of Service</th>}
                    {columnVisibility.provider_name && <th>Provider Name</th>}
                    {columnVisibility.location && <th>Location</th>}
                    {columnVisibility.payer_name && <th>Payer Name</th>}
                    {columnVisibility.insurance_type && <th>Insurance Type</th>}
                    {columnVisibility.insurance_payer_type && <th>Insurance Payer Type</th>}
                    {columnVisibility.claim_type && <th>Claim Type</th>}
                    {columnVisibility.charges && <th>Charges</th>}
                    {columnVisibility.paid_by_payer && <th>Paid by Payer</th>}
                    {columnVisibility.claim_number && <th>Claims#</th>}
                    {columnVisibility.claim_due && <th>Claim Due</th>}
                    {columnVisibility.last_submission_date && <th>Last Submission Date</th>}
                    {columnVisibility.follow_up_date && <th>Follow-up Date</th>}
                    {columnVisibility.date_worked && <th>Date Worked</th>}
                    {columnVisibility.submitted_date && <th>Submitted</th>}
                    {columnVisibility.comments && <th>Comments</th>}
                    {columnVisibility.status_code && <th>Status Code</th>}
                    {columnVisibility.sub_status_code && <th>Sub Status Code</th>}
                    {columnVisibility.action_code && <th>Action Code</th>}
                    {columnVisibility.work_status && <th>Work Status</th>}
                    {columnVisibility.software && <th>Software</th>}
                    {columnVisibility.is_draft && <th>Draft?</th>}
                    {columnVisibility.actions && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredEntries().map((entry) => (
                    <tr key={entry.id} className={entry.is_draft ? 'draft-row' : 'submitted-row'}>
                      {columnVisibility.client_code && <td>{entry.client_code || ''}</td>}
                      {columnVisibility.patient_name && <td>{entry.patient_name || ''}</td>}
                      {columnVisibility.date_of_service && <td>{formatDate(entry.date_of_service)}</td>}
                      {columnVisibility.provider_name && <td>{entry.provider_name || ''}</td>}
                      {columnVisibility.location && <td>{entry.location || ''}</td>}
                      {columnVisibility.payer_name && <td>{entry.payer_name || ''}</td>}
                      {columnVisibility.insurance_type && <td>{entry.insurance_type || ''}</td>}
                      {columnVisibility.insurance_payer_type && <td>{entry.insurance_payer_type || ''}</td>}
                      {columnVisibility.claim_type && <td>{entry.claim_type || ''}</td>}
                      {columnVisibility.charges && <td className="amount">{formatCurrency(entry.charges)}</td>}
                      {columnVisibility.paid_by_payer && <td className="amount">{formatCurrency(entry.paid_by_payer)}</td>}
                      {columnVisibility.claim_number && <td>{entry.claims_number || '-'}</td>}
                      {columnVisibility.claim_due && <td className="amount">{formatCurrency(entry.claim_due)}</td>}
                      {columnVisibility.last_submission_date && <td>{formatDate(entry.last_submission_date)}</td>}
                      {columnVisibility.follow_up_date && <td>{formatDate(entry.follow_up_date)}</td>}
                      {columnVisibility.date_worked && <td>{formatDate(entry.date_worked)}</td>}
                      {columnVisibility.submitted_date && <td>{formatEntryDateTime(entry)}</td>}
                      {columnVisibility.comments && <td className="comments">{entry.comments || ''}</td>}
                      {columnVisibility.status_code && <td>
                        <span className={`status-badge status-${entry.status_code.toLowerCase().replace(/[\s/]/g, '-')}`}>
                          {entry.status_code}
                        </span>
                      </td>}
                      {columnVisibility.sub_status_code && <td>{entry.sub_status_code || ''}</td>}
                      {columnVisibility.action_code && <td>{entry.action_code || ''}</td>}
                      {columnVisibility.work_status && <td>{entry.work_status || ''}</td>}
                      {columnVisibility.software && <td>{entry.software || ''}</td>}
                      {columnVisibility.is_draft && <td className="center">{entry.is_draft ? '✓' : ''}</td>}
                      {columnVisibility.actions && <td>
                        <div className="action-buttons">
                          {entry.is_draft ? (
                            <>
                              <button className="edit-btn-small" onClick={() => handleEditEntry(entry)}>Edit</button>
                              <button className="delete-btn-small" onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
                            </>
                          ) : (
                            <span className="submitted-badge">Submitted</span>
                          )}
                        </div>
                      </td>}
                    </tr>
                  ))}

                  {getFilteredEntries().length === 0 && (
                    <tr>
                      <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="no-data">
                        {entries.length === 0 ? 'No entries found. Click "Add Entry" to create your first entry.' : 'No entries match the current filters'}
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

          {/* Draft Entries Tab */}
          {activeTab === 'drafts' && (
            <div className="tab-content">
              <section className="entries-section">
                <div className="entries-header">
                  <h2>Draft Entries</h2>
                </div>
                {isLoading ? (
                  <div className="loading">Loading drafts...</div>
                ) : entries.filter(e => e.is_draft).length === 0 ? (
                  <div className="no-data">No draft entries found</div>
                ) : (
                  <div className="entries-table-container">
                    <table className="entries-table">
                      <thead>
                        <tr>
                          <th>Client Code</th>
                          <th>Claims#</th>
                          <th>Patient Name</th>
                          <th>Service Date</th>
                          <th>Provider</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.filter(e => e.is_draft).map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.client_code || '-'}</td>
                            <td>{entry.claims_number || '-'}</td>
                            <td>{entry.patient_name || '-'}</td>
                            <td>{entry.date_of_service ? formatDate(entry.date_of_service) : '-'}</td>
                            <td>{entry.provider_name || '-'}</td>
                            <td><span className="badge badge-draft">Draft</span></td>
                            <td>{formatDateTime(entry.created_at, 'UTC')}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="edit-btn-small" onClick={() => handleEditEntry(entry)}>Edit</button>
                                <button className="delete-btn-small" onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Column Filter Modal */}
      {showColumnFilter && (
        <div className="modal-overlay" onClick={() => setShowColumnFilter(false)}>
          <div className="column-filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👁️ Customize Visible Columns</h2>
              <button className="close-button" onClick={() => setShowColumnFilter(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#7f8c8d', fontSize: '14px' }}>
                Select which columns you want to display in the table
              </p>
              <div className="column-filter-list">
                {tableColumns.map((col) => (
                  <label key={col.key} className="column-filter-item">
                    <input
                      type="checkbox"
                      checked={columnVisibility[col.key as keyof typeof columnVisibility]}
                      onChange={() => handleToggleColumn(col.key)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => {
                  setColumnVisibility({
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
                    date_worked: false,
                    submitted_date: true,
                    comments: true,
                    status_code: true,
                    sub_status_code: true,
                    action_code: true,
                    work_status: true,
                    software: true,
                    is_draft: true,
                    actions: true,
                  });
                }}
              >
                🔄 Reset to Default
              </button>
              <button className="save-btn" onClick={() => setShowColumnFilter(false)}>
                ✓ Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Dialog */}
      {showDialog && (
        <div className="modal-overlay" onClick={handleCloseDialog}>
          <div className="entry-dialog" ref={entryDialogRef} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</h2>
              <button className="close-button" onClick={handleCloseDialog}>×</button>
            </div>
            <div className="dialog-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Client Code *</label>
                  {dropdownOptions.client_codes && dropdownOptions.client_codes.length > 0 ? (
                    <select value={formData.client_code} onChange={(e) => setFormData({ ...formData, client_code: e.target.value })} required>
                      <option value="">Select Client Code</option>
                      {dropdownOptions.client_codes.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.client_code} onChange={(e) => setFormData({ ...formData, client_code: e.target.value })} required />
                  )}
                </div>

                <div className="form-group">
                  <label>Claims# *</label>
                  <input
                    type="text"
                    value={formData.claims_number}
                    onChange={(e) => setFormData({ ...formData, claims_number: e.target.value })}
                    placeholder="Enter claim number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Patient Name *</label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow alphanumeric, spaces, hyphens, and apostrophes
                      if (/^[a-zA-Z0-9\s\-']*$/.test(value)) {
                        setFormData({ ...formData, patient_name: value });
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date of Service *</label>
                  <DateInput label="Date of Service"
                    value={formData.date_of_service}
                    onChange={(value) => setFormData({ ...formData, date_of_service: value })}
                    max={getTodayDate()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Provider Name *</label>
                  <input type="text" value={formData.provider_name} onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Payer Name *</label>
                  <input type="text" value={formData.payer_name} onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Insurance Type *</label>
                  {dropdownOptions.insurance_type && dropdownOptions.insurance_type.length > 0 ? (
                    <select value={formData.insurance_type} onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })} required>
                      <option value="">Select Insurance Type</option>
                      {dropdownOptions.insurance_type.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.insurance_type} onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })} required />
                  )}
                </div>

                <div className="form-group">
                  <label>Insurance Payer Type *</label>
                  {dropdownOptions.insurance_payer_type && dropdownOptions.insurance_payer_type.length > 0 ? (
                    <select value={formData.insurance_payer_type} onChange={(e) => setFormData({ ...formData, insurance_payer_type: e.target.value })} required>
                      <option value="">Select Payer Type</option>
                      {dropdownOptions.insurance_payer_type.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.insurance_payer_type} onChange={(e) => setFormData({ ...formData, insurance_payer_type: e.target.value })} required />
                  )}
                </div>

                <div className="form-group">
                  <label>Claim Type *</label>
                  {dropdownOptions.claim_type && dropdownOptions.claim_type.length > 0 ? (
                    <select value={formData.claim_type} onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })} required>
                      <option value="">Select Claim Type</option>
                      {dropdownOptions.claim_type.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.claim_type} onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })} required />
                  )}
                </div>

                <div className="form-group">
                  <label>Charges (USD) *</label>
                  <input
                    type="text"
                    value={formData.charges}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only positive numbers with decimals
                      if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, charges: value });
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Paid by Payer (USD) *</label>
                  <input
                    type="text"
                    value={formData.paid_by_payer}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow positive/negative numbers with decimals, single - only at start
                      if (value === '' || value === '-' || /^-?\d+\.?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, paid_by_payer: value });
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payer Control # *</label>
                  <input type="text" value={formData.payer_control_num} onChange={(e) => setFormData({ ...formData, payer_control_num: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Last Submission Date *</label>
                  <DateInput label="Last Submission Date"
                    value={formData.last_submission_date}
                    onChange={(value) => setFormData({ ...formData, last_submission_date: value })}
                    max={getTodayDate()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Follow-up Date *</label>
                  <DateInput label="Follow-up Date"
                    value={formData.follow_up_date}
                    onChange={(value) => setFormData({ ...formData, follow_up_date: value })}
                    min={getTodayDate()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date Worked *</label>
                  <input
                    type="text"
                    value={formatDate(formData.date_worked)}
                    disabled
                    style={{
                      backgroundColor: '#f3f4f6',
                      cursor: 'not-allowed',
                      color: '#6b7280'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Claim Due (USD) *</label>
                  <input
                    type="text"
                    value={formData.claim_due}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow positive/negative numbers with decimals
                      if (value === '' || value === '-' || /^-?\d+\.?\d{0,2}$/.test(value)) {
                        setFormData({ ...formData, claim_due: value });
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Comments *</label>
                  <textarea rows={3} value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>Status Code *</label>
                  <select value={formData.status_code} onChange={(e) => {
                    setFormData({ ...formData, status_code: e.target.value, sub_status_code: '' });
                  }} required>
                    <option value="">Select Status Code</option>
                    {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Sub Status Code *</label>
                  <select value={formData.sub_status_code} onChange={(e) => setFormData({ ...formData, sub_status_code: e.target.value })} required>
                    <option value="">Select Sub Status</option>
                    {getSubStatusOptions(formData.status_code).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Action Code *</label>
                  {dropdownOptions.action_code && dropdownOptions.action_code.length > 0 ? (
                    <select value={formData.action_code} onChange={(e) => setFormData({ ...formData, action_code: e.target.value })} required>
                      <option value="">Select Action Code</option>
                      {dropdownOptions.action_code.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.action_code} onChange={(e) => setFormData({ ...formData, action_code: e.target.value })} required />
                  )}
                </div>

                <div className="form-group">
                  <label>Software *</label>
                  {dropdownOptions.software && dropdownOptions.software.length > 0 ? (
                    <select value={formData.software} onChange={(e) => setFormData({ ...formData, software: e.target.value })} required>
                      <option value="">Select Software</option>
                      {dropdownOptions.software.map(sw => <option key={sw} value={sw}>{sw}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={formData.software} onChange={(e) => setFormData({ ...formData, software: e.target.value })} required />
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={formData.escalation} onChange={(e) => setFormData({ ...formData, escalation: e.target.checked })} />
                    Escalation
                  </label>
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button className="cancel-btn" onClick={handleCloseDialog}>Cancel</button>
              <button className="save-btn" onClick={handleSaveDraft}>Save Draft</button>
              <button className="submit-btn" onClick={handleSubmitEntry}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
