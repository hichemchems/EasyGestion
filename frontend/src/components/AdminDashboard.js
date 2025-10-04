import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [charts, setCharts] = useState({ daily: [], monthly: [], yearly: [] });
  const [forecast, setForecast] = useState({});
  const [indicators, setIndicators] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [barbersRes, chartsRes, forecastRes, basketRes, clientRes, dailyRes] = await Promise.all([
        axios.get('/api/admin/dashboard/sorted-barbers'),
        axios.get('/api/admin/dashboard/realtime-charts'),
        axios.get('/api/admin/dashboard/forecast'),
        axios.get('/api/analytics/realtime-average-basket'),
        axios.get('/api/analytics/realtime-client-count'),
        axios.get('/api/analytics/realtime-daily-turnover')
      ]);

      setBarbers(barbersRes.data.barbers || []);
      setCharts(chartsRes.data);
      setForecast(forecastRes.data);
      setIndicators({
        averageBasket: basketRes.data.average_basket,
        clientCount: clientRes.data.client_count,
        dailyTurnover: dailyRes.data.turnover,
        forecastPercentage: forecastRes.data.percentage_achieved
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleEditDeduction = (barberId) => {
    // TODO: Implement edit deduction modal or inline edit
    alert(`Modifier la déduction pour le coiffeur ${barberId}`);
  };

  const dailyChartData = {
    labels: charts.daily?.map(d => d.date) || [],
    datasets: [{
      label: 'Chiffre d\'Affaires Journalier',
      data: charts.daily?.map(d => d.turnover) || [],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const monthlyChartData = {
    labels: charts.monthly?.map(d => d.month) || [],
    datasets: [{
      label: 'Chiffre d\'Affaires Mensuel',
      data: charts.monthly?.map(d => d.turnover) || [],
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }]
  };

  const yearlyChartData = {
    labels: charts.yearly?.map(d => d.year) || [],
    datasets: [{
      label: 'Chiffre d\'Affaires Annuel',
      data: charts.yearly?.map(d => d.turnover) || [],
      borderColor: 'rgb(54, 162, 235)',
      tension: 0.1
    }]
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.welcome}>Bonjour {user?.username}</h1>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Real-time Indicators */}
        <div style={styles.indicatorsSection}>
          <div style={styles.indicatorCard}>
            <div style={styles.indicatorValue}>€{indicators.averageBasket?.toFixed(2) || '0.00'}</div>
            <div style={styles.indicatorLabel}>Panier Moyen</div>
          </div>
          <div style={styles.indicatorCard}>
            <div style={styles.indicatorValue}>{indicators.clientCount || 0}</div>
            <div style={styles.indicatorLabel}>Clients Aujourd'hui</div>
          </div>
          <div style={styles.indicatorCard}>
            <div style={styles.indicatorValue}>€{indicators.dailyTurnover?.toFixed(2) || '0.00'}</div>
            <div style={styles.indicatorLabel}>Chiffre d'Affaires Journalier</div>
          </div>
          <div style={styles.indicatorCard}>
            <div style={styles.indicatorValue}>{indicators.forecastPercentage?.toFixed(1) || '0.0'}%</div>
            <div style={styles.indicatorLabel}>Prévision</div>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${indicators.forecastPercentage || 0}%`}}></div>
            </div>
          </div>
        </div>

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

        <button style={styles.menuButton} onClick={() => navigate('/admin/expenses')}>
          <div style={styles.buttonIcon}>💰</div>
          <div style={styles.buttonText}>Dépenses</div>
        </button>

        <button style={styles.menuButton} onClick={() => navigate('/admin/salaries')}>
          <div style={styles.buttonIcon}>💵</div>
          <div style={styles.buttonText}>Salaires</div>
        </button>

        <button style={styles.menuButton}>
          <div style={styles.buttonIcon}>📊</div>
          <div style={styles.buttonText}>Statistiques</div>
        </button>
        </div>

        {/* Barbers Cards */}
        <div style={styles.barbersSection}>
          <h2 style={styles.sectionTitle}>Coiffeurs ({barbers.length})</h2>
          <div style={styles.barbersGrid}>
            {barbers.map(barber => (
              <div key={barber.id} style={styles.barberCard}>
                <div style={styles.barberName}>{barber.name}</div>
                <div style={styles.barberStats}>
                  <div>Reçus Journaliers: €{barber.daily_receipts?.toFixed(2) || '0.00'}</div>
                  <div>Reçus Hebdomadaires: €{barber.weekly_receipts?.toFixed(2) || '0.00'}</div>
                  <div>Reçus Mensuels: €{barber.monthly_receipts?.toFixed(2) || '0.00'}</div>
                  <div>Revenus Restants: €{(barber.turnover - (barber.turnover * barber.deduction_percentage / 100))?.toFixed(2) || '0.00'}</div>
                  <div>Déduction: {barber.deduction_percentage}%</div>
                </div>
                <button style={styles.editButton} onClick={() => handleEditDeduction(barber.id)}>Modifier Déduction</button>
              </div>
            ))}
          </div>
          <button style={styles.addButton} onClick={() => navigate('/admin/create-employee')}>Ajouter Coiffeur</button>
        </div>

        {/* Charts Section */}
        <div style={styles.chartsSection}>
          <h2 style={styles.sectionTitle}>Graphiques en Temps Réel</h2>
          <div style={styles.chartsGrid}>
            <div style={styles.chartContainer}>
              <h3>Chiffre d'Affaires Journalier</h3>
              <Line data={dailyChartData} />
            </div>
            <div style={styles.chartContainer}>
              <h3>Chiffre d'Affaires Mensuel</h3>
              <Line data={monthlyChartData} />
            </div>
            <div style={styles.chartContainer}>
              <h3>Chiffre d'Affaires Annuel</h3>
              <Line data={yearlyChartData} />
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
