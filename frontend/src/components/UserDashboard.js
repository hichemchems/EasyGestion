import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [packagesRes, analyticsRes] = await Promise.all([
        axios.get('/api/packages'),
        axios.get('/api/analytics/realtime-daily-turnover')
      ]);

      setPackages(packagesRes.data.packages || []);
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

  const handlePackageSelect = (pkg) => {
    // TODO: Implement package selection logic
    console.log('Selected package:', pkg);
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>EasyGestion</div>
        <h1 style={styles.welcome}>Bonjour {user?.username || 'Utilisateur'}</h1>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Menu Buttons */}
        <div style={styles.menuGrid}>
          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>💇</div>
            <div style={styles.buttonText}>Choisir un service</div>
          </button>

          <button style={styles.menuButton}>
            <div style={styles.buttonIcon}>📊</div>
            <div style={styles.buttonText}>Mes statistiques</div>
          </button>
        </div>

        {/* Packages Section */}
        <div style={styles.packagesSection}>
          <h2 style={styles.sectionTitle}>Services disponibles</h2>
          <div style={styles.packagesGrid}>
            {packages.map(pkg => (
              <div
                key={pkg.id}
                style={styles.packageCard}
                onClick={() => handlePackageSelect(pkg)}
              >
                <div style={styles.packageName}>{pkg.name}</div>
                <div style={styles.packagePrice}>€{pkg.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Stats */}
        <div style={styles.statsSection}>
          <div style={styles.statsCard}>
            <h3>Mon chiffre d'affaires aujourd'hui</h3>
            <div style={styles.statsValue}>
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
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  welcome: {
    margin: 0,
    color: '#333',
    fontSize: '20px'
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
  packagesSection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333'
  },
  packagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
  },
  packageCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    textAlign: 'center'
  },
  packageName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  packagePrice: {
    fontSize: '24px',
    color: '#007bff',
    fontWeight: 'bold'
  },
  statsSection: {
    marginBottom: '30px'
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statsValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#28a745',
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

export default UserDashboard;
