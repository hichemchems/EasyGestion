import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import '../styles/colors.css';

const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: 'Barber',
    hire_date: '',
    deduction_percentage: 10
  });
  const [avatar, setAvatar] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onDropAvatar = (acceptedFiles) => {
    setAvatar(acceptedFiles[0]);
  };

  const onDropDocuments = (acceptedFiles) => {
    setDocuments(acceptedFiles);
  };

  const avatarDropzone = useDropzone({
    onDrop: onDropAvatar,
    accept: 'image/*',
    multiple: false
  });

  const documentsDropzone = useDropzone({
    onDrop: onDropDocuments,
    accept: { 'application/pdf': [] },
    multiple: true
  });

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.hire_date) {
      setError('All fields are required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 14) {
      setError('Password must be at least 14 characters');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('position', formData.position);
    data.append('hire_date', formData.hire_date);
    data.append('deduction_percentage', formData.deduction_percentage);

    if (avatar) {
      data.append('avatar', avatar);
    }

    documents.forEach(doc => {
      data.append('documents', doc);
    });

    try {
      await axios.post('/api/v1/admin/employees', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/admin/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Employee</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Position:</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              style={styles.input}
            >
              <option value="Barber">Barber</option>
              <option value="Assistant">Assistant</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Hire Date:</label>
            <input
              type="date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Deduction Percentage:</label>
            <input
              type="number"
              name="deduction_percentage"
              value={formData.deduction_percentage}
              onChange={handleInputChange}
              style={styles.input}
              min="0"
              max="100"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
            <small style={styles.hint}>At least 14 characters, with uppercase, lowercase, number, and special character</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Avatar (optional):</label>
            <div {...avatarDropzone.getRootProps()} style={styles.dropzone}>
              <input {...avatarDropzone.getInputProps()} />
              {avatar ? (
                <p>Selected: {avatar.name}</p>
              ) : (
                <p>Drop avatar image here, or click to select</p>
              )}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Documents (optional):</label>
            <div {...documentsDropzone.getRootProps()} style={styles.dropzone}>
              <input {...documentsDropzone.getInputProps()} />
              {documents.length > 0 ? (
                <p>Selected: {documents.map(d => d.name).join(', ')}</p>
              ) : (
                <p>Drop documents (PDF) here, or click to select</p>
              )}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
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
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  hint: {
    color: '#888',
    fontSize: '12px',
    marginTop: '5px'
  },
  dropzone: {
    border: '2px dashed #ddd',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    transition: 'border-color 0.3s'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '15px',
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
    textAlign: 'center',
    fontWeight: 'bold'
  }
};

export default CreateEmployee;
