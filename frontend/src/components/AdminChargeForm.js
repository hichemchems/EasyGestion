import axios from 'axios';
import { useEffect, useState } from 'react';
import './styles/colors.css';

const AdminChargeForm = () => {
  const [charges, setCharges] = useState({
    rent: '',
    charges: '',
    operating_costs: '',
    electricity: '',
    salaries: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const response = await axios.get('/api/v1/admin/charges');
        if (response.data.charges && response.data.charges.length > 0) {
          setCharges(response.data.charges[0]);
        }
      } catch (err) {
        setError('Failed to load admin charges');
      }
    };
    fetchCharges();
  }, []);

  const handleChange = (e) => {
    setCharges({
      ...charges,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await axios.post('/api/v1/admin/charges', {
        rent: parseFloat(charges.rent),
        charges: parseFloat(charges.charges),
        operating_costs: parseFloat(charges.operating_costs),
        electricity: parseFloat(charges.electricity),
        salaries: parseFloat(charges.salaries)
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving charges');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ color: 'var(--color-black)', backgroundColor: 'var(--color-white)', padding: '1rem', borderRadius: '8px' }}>
      <h3>Admin Charges</h3>
      {['rent', 'charges', 'operating_costs', 'electricity', 'salaries'].map((field) => (
        <div key={field}>
          <label>{field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}</label>
          <input
            type="number"
            step="0.01"
            name={field}
            value={charges[field]}
            onChange={handleChange}
            required
            style={{ borderColor: error ? 'var(--color-red)' : 'var(--color-gray)' }}
          />
        </div>
      ))}
      {error && <p style={{ color: 'var(--color-red)' }}>{error}</p>}
      {success && <p style={{ color: 'var(--color-green)' }}>Charges saved successfully!</p>}
      <button type="submit" className="button-validate">Save</button>
    </form>
  );
};

export default AdminChargeForm;
