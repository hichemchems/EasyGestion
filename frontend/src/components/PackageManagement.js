import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PackageManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    is_active: true
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/packages/admin');
      setPackages(response.data.packages);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement des prestations');
      console.error('Fetch packages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingPackage) {
        await axios.put(`/packages/${editingPackage.id}`, data);
      } else {
        await axios.post('/packages', data);
      }

      fetchPackages();
      setShowForm(false);
      setEditingPackage(null);
      setFormData({ name: '', price: '', is_active: true });
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la prestation');
      console.error('Save package error:', err);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price.toString(),
      is_active: pkg.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cette prestation ?')) {
      try {
        await axios.delete(`/packages/${id}`);
        fetchPackages();
      } catch (err) {
        setError('Erreur lors de la suppression de la prestation');
        console.error('Delete package error:', err);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData({ name: '', price: '', is_active: true });
  };

  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestion des Prestations</h1>
        <button
          onClick={() => setShowForm(true)}
          style={styles.addButton}
        >
          Ajouter une Prestation
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>
              {editingPackage ? 'Modifier la Prestation' : 'Ajouter une Prestation'}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom de la prestation:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Prix (€):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    style={styles.checkbox}
                  />
                  Actif
                </label>
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.saveButton}>
                  {editingPackage ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" onClick={resetForm} style={styles.cancelButton}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.packagesGrid}>
        {packages.map(pkg => (
          <div key={pkg.id} style={styles.packageCard}>
            <div style={styles.packageHeader}>
              <h3 style={styles.packageName}>{pkg.name}</h3>
              <span style={pkg.is_active ? styles.activeBadge : styles.inactiveBadge}>
                {pkg.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div style={styles.packagePrice}>{pkg.price} €</div>
            <div style={styles.packageActions}>
              <button
                onClick={() => handleEdit(pkg)}
                style={styles.editButton}
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(pkg.id)}
                style={styles.deleteButton}
              >
                Désactiver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#333',
    fontSize: '28px',
    margin: 0
  },
  addButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px'
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  checkboxGroup: {
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  packagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  packageCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: 'white'
  },
  packageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  packageName: {
    margin: 0,
    color: '#333'
  },
  activeBadge: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  inactiveBadge: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  packagePrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '15px'
  },
  packageActions: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    backgroundColor: '#ffc107',
    color: 'black',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    flex: 1
  }
};

export default PackageManagement;
