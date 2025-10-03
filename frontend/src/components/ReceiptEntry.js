import axios from 'axios';
import { useState } from 'react';
import './styles/colors.css';

const ReceiptEntry = ({ employeeId, onReceiptCreated }) => {
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        `/api/employees/${employeeId}/receipts`,
        { client_name: clientName, amount: parseFloat(amount), description }
      );
      setSuccess(true);
      setClientName('');
      setAmount('');
      setDescription('');
      if (onReceiptCreated) onReceiptCreated(response.data.receipt);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating receipt');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ color: 'var(--color-black)', backgroundColor: 'var(--color-white)', padding: '1rem', borderRadius: '8px' }}>
      <h3>Enter Receipt</h3>
      <div>
        <label>Client Name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          style={{ borderColor: error ? 'var(--color-red)' : 'var(--color-gray)' }}
        />
      </div>
      <div>
        <label>Amount</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ borderColor: error ? 'var(--color-red)' : 'var(--color-gray)' }}
        />
      </div>
      <div>
        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          style={{ borderColor: error ? 'var(--color-red)' : 'var(--color-gray)' }}
        />
      </div>
      {error && <p style={{ color: 'var(--color-red)' }}>{error}</p>}
      {success && <p style={{ color: 'var(--color-green)' }}>Receipt created successfully!</p>}
      <button type="submit" className="button-validate">Submit</button>
    </form>
  );
};

export default ReceiptEntry;
