import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

const ReceiptEntry = ({ employeeId, onReceiptAdded }) => {
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!clientName || !amount) {
      setError('Client name and amount are required');
      return false;
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Amount must be a positive number');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(`/api/v1/employees/${employeeId}/receipts`, {
        client_name: clientName,
        amount: parseFloat(amount),
        description
      });
      if (res.status === 201) {
        setClientName('');
        setAmount('');
        setDescription('');
        if (onReceiptAdded) onReceiptAdded(res.data.receipt);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3>Ajouter un reçu</h3>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nom du client:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Montant (€):</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Description (optionnel):</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
            maxLength={500}
          />
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}>
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    margin: '20px auto'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '5px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '80px'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  error: {
    color: 'var(--color-red)',
    marginBottom: '15px',
    fontWeight: 'bold',
    textAlign: 'center'
  }
};

export default ReceiptEntry;
