import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [clientName, setClientName] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [packagesRes, statsRes] = await Promise.all([
        axios.get('/api/packages'),
        axios.get(`/api/employees/${user?.id}/remaining-revenue`)
      ]);

      setPackages(packagesRes.data.packages || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage || !clientName) return;

    try {
      await axios.post(`/api/employees/${user?.id}/sales`, {
        package_id: selectedPackage.id,
        client_name: clientName,
        description
      });

      alert('Vente enregistrée avec succès!');
      setSelectedPackage(null);
      setClientName('');
      setDescription('');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Erreur lors de l\'enregistrement de la vente');
    }
  };

  const handleReceiptSubmit = async (e) => {
    e.preventDefault();
    if (!receiptAmount || !clientName) return;

    try {
      await axios.post(`/api/employees/${user?.id}/receipts`, {
        client_name: clientName,
        amount: parseFloat(receiptAmount),
        description
      });

      alert('Reçu enregistré avec succès!');
      setReceiptAmount('');
      setClientName('');
      setDescription('');
      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Erreur lors de l\'enregistrement du reçu');
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
        <img src="/logo.png" alt="Logo" style={styles.logo} />
        <h1 style={styles.welcome}>Bonjour {user?.username}</h1>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Menu Buttons */}
        <div style={styles.menuGrid}>
          <button style={styles.menuButton} onClick={() => document.getElementById('packages-section').scrollIntoView()}>
            <div style={styles.buttonIcon}>💇</div>
            <div style={styles.buttonText}>Services</div>
          </button>

          <button style={styles.menuButton} onClick={() => document.getElementById('stats-section').scrollIntoView()}>
            <div style={styles.buttonIcon}>📊</div>
            <div style={styles.buttonText}>Mes Statistiques</div>
          </button>
        </div>

        {/* Stats Section */}
        <div id="stats-section" style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Mes Statistiques</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>€{stats.total_revenue?.toFixed(2) || '0.00'}</div>
              <div style={styles.statLabel}>Revenus du Mois</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>€{stats.remaining_revenue?.toFixed(2) || '0.00'}</div>
              <div style={styles.statLabel}>Revenus Restants</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.deduction_percentage || 0}%</div>
              <div style={styles.statLabel}>Déduction</div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        <div id="packages-section" style={styles.packagesSection}>
          <h2 style={styles.sectionTitle}>Sélection de Services</h2>

          {/* Package Selection */}
          <div style={styles.packagesGrid}>
            {packages.map(pkg => (
              <div
                key={pkg.id}
                style={{
                  ...styles.packageCard,
                  ...(selectedPackage?.id === pkg.id ? styles.selectedPackage : {})
                }}
                onClick={() => handlePackageSelect(pkg)}
              >
                <div style={styles.packageName}>{pkg.name}</div>
                <div style={styles.packagePrice}>€{pkg.price}</div>
              </div>
            ))}
          </div>

          {/* Sale Form */}
          {selectedPackage && (
            <form onSubmit={handleSaleSubmit} style={styles.form}>
              <h3>Enregistrer une Vente</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service Sélectionné:</label>
                <div style={styles.selectedService}>
                  {selectedPackage.name} - €{selectedPackage.price}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom du Client:</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description (optionnel):</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={styles.textarea}
                />
              </div>
              <button type="submit" style={styles.submitButton}>Enregistrer la Vente</button>
            </form>
          )}

          {/* Receipt Form */}
          <form onSubmit={handleReceiptSubmit} style={styles.form}>
            <h3>Enregistrer un Reçu</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom du Client:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Montant (€):</label>
              <input
                type="number"
                step="0.01"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Description (optionnel):</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>
            <button type="submit" style={styles.submitButton}>Enregistrer le Reçu</button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.logoutButton} onClick={handleLogout}>Déconnexion</button>
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    width: '50px',
    height: '50px'
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
  statsSection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666'
  },
  packagesSection: {
    marginBottom: '30px'
  },
  packagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  packageCard: {
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  selectedPackage: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff'
  },
  packageName: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  packagePrice: {
    fontSize: '18px',
    color: '#007bff',
    fontWeight: 'bold'
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minHeight: '80px'
  },
  selectedService: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
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
