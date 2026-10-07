import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/context/authStore';
import { adminAPI } from '@/api/admin';
import { formatDateTime } from '@/utils/dates';
import '../../styles/AdminDashboard.css';
import logo from '../../assets/logo.png';

interface Claim {
  id: string;
  claims_number: string;
  account_number: string;
  provider_name: string | null;
  payer_name: string | null;
  category: string | null;
  billed_amount: string | null;
  balance_amount: string | null;
  claim_status: string;
  assigned_user: string | null;
  work_status: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState<any>({});
  
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadClaims();
    loadSummary();
  }, [statusFilter]);
  
  const loadClaims = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await adminAPI.getAllClaims(params);
      setClaims(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSummary = async () => {
    try {
      const response = await adminAPI.getClaimsSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  
  const formatCurrency = (value: string | null) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(value));
  };
  
  const getStatusBadgeClass = (status: string) => {
    return `badge badge-${status.toLowerCase().replace(/_/g, '-')}`;
  };
  
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dashboard-logo">
            <img src={logo} alt="Practice Management" />
          </div>
          <div className="header-title">
            <h1>Claims Dashboard</h1>
            <p className="user-info">Welcome, {user?.email}</p>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      
      <main className="dashboard-main">
        <section className="summary-section">
          <h2>Claims Summary</h2>
          <div className="summary-cards">
            {Object.entries(summary).map(([status, count]) => (
              <div key={status} className="summary-card">
                <div className="summary-label">{status}</div>
                <div className="summary-count">{count as number}</div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="claims-section">
          <div className="claims-header">
            <h2>All Claims</h2>
            <div className="filter-controls">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {isLoading ? (
            <div className="loading">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="no-data">No claims found</div>
          ) : (
            <div className="claims-table-container">
              <table className="claims-table">
                <thead>
                  <tr>
                    <th>Claims #</th>
                    <th>Account #</th>
                    <th>Provider</th>
                    <th>Payer</th>
                    <th>Category</th>
                    <th>Billed Amount</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Work Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="claim-row">
                      <td className="claims-number">{claim.claims_number}</td>
                      <td>{claim.account_number}</td>
                      <td>{claim.provider_name || '-'}</td>
                      <td>{claim.payer_name || '-'}</td>
                      <td>{claim.category || '-'}</td>
                      <td className="amount">{formatCurrency(claim.billed_amount)}</td>
                      <td className="amount">{formatCurrency(claim.balance_amount)}</td>
                      <td>
                        <span className={getStatusBadgeClass(claim.claim_status)}>
                          {claim.claim_status}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(claim.work_status)}>
                          {claim.work_status}
                        </span>
                      </td>
                      <td>{claim.assigned_user || '-'}</td>
                      <td className="date">{formatDateTime(claim.created_at, 'UTC')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
