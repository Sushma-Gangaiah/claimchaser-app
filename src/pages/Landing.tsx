import { useNavigate } from 'react-router-dom';

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Welcome to Claim Chaser</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        A comprehensive claims management system
      </p>
      <button 
        onClick={() => navigate('/login')}
        style={{
          padding: '12px 30px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Go to Login
      </button>
    </div>
  );
};
