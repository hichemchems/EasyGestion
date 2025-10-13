import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import '../styles/colors.css';

const SalaryViewing = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [period, setPeriod] = useState({
    start_date: '',
    end_date: ''
  });

  const fetchSalaries = useCallback(async () => {
    try {
      const params = {};
      if (selectedEmployee) params.employee_id = selectedEmployee;
      if (period.start_date) params.start_date = period.start_date;
      if (period.end_date) params.end_date = period.end_date;

      const response = await axios.get('/api/v1/salaries', { params });
      setSalaries(response.data.salaries || []);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, period]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salariesRes, employeesRes] = await Promise.all([
          axios.get('/api/v1/salaries'),
          axios.get('/api/v1/admin/dashboard/sorted-barbers')
        ]);
        setSalaries(salariesRes.data.salaries || []);
        setEmployees(employeesRes.data.barbers || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateSalary = async (employeeId) => {
    try {
      await axios.post('/api/v1/salaries/generate', {
        employee_id: employeeId,
        period_start: period.start_date,
        period_end: period.end_date
      });

      alert('Salaire généré avec succès!');
      fetchSalaries();
    } catch (error) {
      console.error('Error generating salary:', error);
      alert('Erreur lors de la génération du salaire');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Salaires</h1>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Employé:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Tous les employés</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Période début:</label>
          <input
            type="date"
            value={period.start_date}
            onChange={(e) => setPeriod(prev => ({ ...prev, start_date: e.target.value }))}
            style={styles.filterInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Période fin:</label>
          <input
            type="date"
            value={period.end_date}
            onChange={(e) => setPeriod(prev => ({ ...prev, end_date: e.target.value }))}
            style={styles.filterInput}
          />
        </div>
      </div>

      {/* Salaries List */}
      <div style={styles.salariesList}>
        {salaries.length === 0 ? (
          <div style={styles.emptyState}>Aucun salaire trouvé</div>
        ) : (
          salaries.map(salary => (
            <div key={salary.id} style={styles.salaryCard}>
              <div style={styles.salaryInfo}>
                <div style={styles.employeeName}>{salary.employee_name}</div>
                <div style={styles.salaryPeriod}>
                  Période: {new Date(salary.period_start).toLocaleDateString('fr-FR')} - {new Date(salary.period_end).toLocaleDateString('fr-FR')}
                </div>
                <div style={styles.salaryDetails}>
                  <div>Salaire de base: €{parseFloat(salary.base_salary).toFixed(2)}</div>
                  <div>Commission: €{parseFloat(salary.commission).toFixed(2)}</div>
                  <div><strong>Total: €{parseFloat(salary.total_salary).toFixed(2)}</strong></div>
                </div>
              </div>
              <div style={styles.salaryActions}>
                <button
                  style={styles.generateButton}
                  onClick={() => handleGenerateSalary(salary.employee_id)}
                >
                  Régénérer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px'
  },
  header: {
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  },
  filters: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333'
  },
  filterSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  filterInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  salariesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '18px'
  },
  salaryCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
  },
  salaryInfo: {
    flex: 1
  },
  employeeName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  salaryPeriod: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '10px'
  },
  salaryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '14px'
  },
  salaryActions: {
    display: 'flex',
    gap: '10px'
  },
  generateButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default SalaryViewing;
