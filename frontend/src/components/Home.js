import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/colors.css';

const Home = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [siret, setSiret] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const onDrop = (acceptedFiles) => {
    setLogo(acceptedFiles[0]);
    setError(''); // Clear any previous error
  };

  const onDropRejected = (fileRejections) => {
    const rejection = fileRejections[0];
    if (rejection.errors[0].code === 'file-invalid-type') {
      setError('Please select a valid image file.');
    } else {
      setError('File upload failed. Please try again.');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/*': [] },
    multiple: false
  });

  const validateForm = () => {
    if (!name || !email || !siret || !phone || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 14) {
      setError('Password must be at least 14 characters');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    if (siret.length !== 14 || !/^\d+$/.test(siret)) {
      setError('SIRET must be exactly 14 digits');
      return false;
    }
    if (!/^[+]?[0-9][\d]{0,14}$/.test(phone) || phone.length < 10) {
      setError('Invalid phone number. Please enter a valid phone number (at least 10 digits)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Starting admin registration process');
    console.log('Form data:', { name, email, siret, phone, password: '[HIDDEN]', confirmPassword: '[HIDDEN]', logo: logo ? logo.name : 'none' });

    if (!validateForm()) {
      console.log('Form validation failed');
      setLoading(false);
      return;
    }

    console.log('Form validation passed');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('siret', siret);
    formData.append('phone', phone);
    formData.append('password', password);
    if (logo) {
      formData.append('logo', logo);
    }

    console.log('FormData created:', Array.from(formData.entries()));
    console.log('Axios baseURL:', axios.defaults.baseURL);
    console.log('Sending admin registration request to:', axios.defaults.baseURL + '/admin');

    try {
      console.log('Making axios POST request');
      const response = await axios.post('/admin', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Registration response received:', response.data);

      // Auto login after registration
      console.log('Attempting auto-login');
      const loginResult = await login(email, password);
      if (loginResult.success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/admin/dashboard');
      } else {
        console.log('Login failed:', loginResult.error);
        setError('Registration successful, but login failed. Please try logging in manually.');
      }
    } catch (error) {
      console.log('Registration error:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      if (error.response?.data?.errors) {
        setError(error.response.data.errors.map(err => err.msg).join(', '));
      } else {
        setError(error.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>EasyGestion</h1>
        <p style={styles.subtitle}>Create your admin account to get started</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              autoComplete="name"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="siret" style={styles.label}>SIRET (14 digits):</label>
            <input
              id="siret"
              type="text"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              style={styles.input}
              autoComplete="off"
              maxLength="14"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="phone" style={styles.label}>Phone:</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
              autoComplete="tel"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="new-password"
              required
            />
            <small style={styles.hint}>At least 14 characters, with uppercase, lowercase, number, and one special character (@$!%*?&)</small>
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm Password:</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              autoComplete="new-password"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="logo" style={styles.label}>Logo (optional):</label>
            <div {...getRootProps()} style={styles.dropzone}>
              <input id="logo" {...getInputProps()} />
              {logo ? (
                <p>Selected: {logo.name}</p>
              ) : (
                <p>Drop logo image here, or click to select</p>
              )}
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>
        <p style={styles.loginLink}>
          Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
        </p>
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
    maxWidth: '500px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333',
    fontSize: '28px'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#666'
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
  },
  loginLink: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none'
  }
};

export default Home;
