import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import '../styles/colors.css';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const [filters, setFilters] = useState({
    category: '',
    start_date: '',
    end_date: ''
  });

  const fetchExpenses = useCallback(async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await axios.get('/api/expenses', { params });
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses', {
        ...formData,
        amount: parseFloat(formData.amount)
      });

      alert('Dépense ajoutée avec succès!');
      setFormData({ category: '', amount: '', description: '' });
      setShowForm(false);
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Erreur lors de l\'ajout de la dépense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense?')) return;

    try {
      await axios.delete(`/api/expenses/${id}`);
      alert('Dépense supprimée avec succès!');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erreur lors de la suppression de la dépense');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Dépenses</h1>
        <button
          style={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annuler' : 'Ajouter une Dépense'}
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Catégorie:</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Toutes</option>
            <option value="fournitures">Fournitures</option>
            <option value="marketing">Marketing</option>
            <option value="loyer">Loyer</option>
            <option value="utilities">Utilitaires</option>
            <option value="autres">Autres</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date début:</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            style={styles.filterInput}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date fin:</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            style={styles.filterInput}
          />
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Catégorie:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              style={styles.select}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="fournitures">Fournitures</option>
              <option value="marketing">Marketing</option>
              <option value="loyer">Loyer</option>
              <option value="utilities">Utilitaires</option>
              <option value="autres">Autres</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Montant (€):</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              style={styles.textarea}
            />
          </div>
          <button type="submit" style={styles.submitButton}>Ajouter</button>
        </form>
      )}

      {/* Expenses List */}
      <div style={styles.expensesList}>
        {expenses.length === 0 ? (
          <div style={styles.emptyState}>Aucune dépense trouvée</div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} style={styles.expenseCard}>
              <div style={styles.expenseInfo}>
                <div style={styles.expenseCategory}>{expense.category}</div>
                <div style={styles.expenseAmount}>€{parseFloat(expense.amount).toFixed(2)}</div>
                <div style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('fr-FR')}
                </div>
                {expense.description && (
                  <div style={styles.expenseDescription}>{expense.description}</div>
                )}
              </div>
              <button
                style={styles.deleteButton}
                onClick={() => handleDelete(expense.id)}
              >
                Supprimer
              </button>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px'
  },
  addButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
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
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
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
  submitButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  expensesList: {
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
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  expenseInfo: {
    flex: 1
  },
  expenseCategory: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  expenseAmount: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#dc3545'
  },
  expenseDate: {
    color: '#666',
    fontSize: '14px'
  },
  expenseDescription: {
    color: '#666',
    fontSize: '14px',
    marginTop: '5px'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default ExpenseManagement;
