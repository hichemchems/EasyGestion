import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [employeesRes, analyticsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/analytics/realtime-daily-turnover')
      ]);

      setEmployees(employeesRes.data.users || []);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.welcome}>Bonjour {user?.username || 'Admin'}</h1>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Menu Buttons */}
        <div style={styles.menuGrid}>
          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>👥</div>
            <div style={styles.buttonText}>Mes employés</div>
          </button>

          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>💇</div>
            <div style={styles.buttonText}>Services</div>
          </button>

          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>💳</div>
            <div style={styles.buttonText}>Modes de paiement</div>
          </button>

          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>📊</div>
            <div style={styles.buttonText}>Statistiques</div>
          </button>
        </div>

        {/* Employees Cards */}
        <div style={styles.employeesSection}>
          <h2 style={styles.sectionTitle}>Employés ({employees.length})</h2>
          <div style={styles.employeesGrid}>
            {employees.map(employee => (
              <div key={employee.id} style={styles.employeeCard}>
                <div style={styles.employeeName}>{employee.name}</div>
                <div style={styles.employeeRole}>{employee.position}</div>
                <div style={styles.employeeStats}>
                  <div>Chiffre d'affaires: €0</div>
                  <div>Clients aujourd'hui: 0</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Summary */}
        <div style={styles.analyticsSection}>
          <div style={styles.analyticsCard}>
            <h3>Chiffre d'affaires aujourd'hui</h3>
            <div style={styles.analyticsValue}>
              €{analytics.realtime_turnover?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div style={styles.footer}>
        <button
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  welcome: {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  },
  mainContent: {
    flex: 1,
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  menuButton: {
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  buttonIcon: {
    fontSize: '32px'
  },
  buttonText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  employeesSection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333'
  },
  employeesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px'
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  employeeName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  employeeRole: {
    color: '#666',
    marginBottom: '15px'
  },
  employeeStats: {
    fontSize: '14px',
    color: '#555'
  },
  analyticsSection: {
    marginBottom: '30px'
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  analyticsValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: '10px'
  },
  footer: {
    padding: '20px',
    textAlign: 'center'
  },
  logoutButton: {
    backgroundColor: 'var(--color-yellow)',
    color: 'var(--color-black)',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default AdminDashboard;
