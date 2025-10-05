import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders EasyGestion heading', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { level: 1, name: /EasyGestion/i });
  expect(headingElement).toBeInTheDocument();
});
