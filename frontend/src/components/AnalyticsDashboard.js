import axios from 'axios';
import { useEffect, useState } from 'react';
import './styles/colors.css';

const AnalyticsDashboard = () => {
  const [turnover, setTurnover] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [profit, setProfit] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const [turnoverRes, evolutionRes, profitRes, performanceRes] = await Promise.all([
        axios.get(`/api/analytics/turnover?period=${period}`),
        axios.get(`/api/analytics/evolution?months=12`),
        axios.get(`/api/analytics/profit?period=${period}`),
        axios.get(`/api/analytics/performance?period=${period}`)
      ]);

      setTurnover(turnoverRes.data);
      setEvolution(evolutionRes.data);
      setProfit(profitRes.data);
      setPerformance(performanceRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
    }
  };

  return (
    <div style={{ color: 'var(--color-black)', backgroundColor: 'var(--color-white)', padding: '1rem' }}>
      <h2>Analytics Dashboard</h2>

      <div>
        <label>Period:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {error && <p style={{ color: 'var(--color-red)' }}>{error}</p>}

      {turnover && (
        <div style={{ marginTop: '1rem', border: '1px solid var(--color-gray)', padding: '1rem', borderRadius: '8px' }}>
          <h3>Turnover</h3>
          <p>Sales: €{turnover.turnover.sales.toFixed(2)}</p>
          <p>Receipts: €{turnover.turnover.receipts.toFixed(2)}</p>
          <p>Total: €{turnover.turnover.total.toFixed(2)}</p>
        </div>
      )}

      {profit && (
        <div style={{ marginTop: '1rem', border: '1px solid var(--color-gray)', padding: '1rem', borderRadius: '8px' }}>
          <h3>Profit</h3>
          <p>Turnover: €{profit.turnover.toFixed(2)}</p>
          <p>Expenses: €{profit.expenses.toFixed(2)}</p>
          <p>Profit: €{profit.profit.toFixed(2)}</p>
        </div>
      )}

      {performance && (
        <div style={{ marginTop: '1rem', border: '1px solid var(--color-gray)', padding: '1rem', borderRadius: '8px' }}>
          <h3>Employee Performance</h3>
          {performance.employees.map((emp) => (
            <div key={emp.employee_id} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--color-gray)', borderRadius: '4px' }}>
              <p><strong>{emp.employee_name}</strong></p>
              <p>Total Turnover: €{emp.total_turnover.toFixed(2)}</p>
              <p>Net Turnover: €{emp.net_turnover.toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      {evolution && (
        <div style={{ marginTop: '1rem', border: '1px solid var(--color-gray)', padding: '1rem', borderRadius: '8px' }}>
          <h3>Monthly Evolution</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {evolution.data.map((month) => (
              <div key={month.month} style={{ margin: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--color-gray)', borderRadius: '4px' }}>
                <p>{month.month}</p>
                <p>€{month.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
