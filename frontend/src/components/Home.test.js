

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

// Mock axios
const axios = require('axios');
jest.mock('axios', () => ({
  post: jest.fn(),
}));

// Mock useDropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
  }),
}));

// Mock useAuth
const mockLogin = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the form with all fields', () => {
    renderWithProviders(<Home />);

    expect(screen.getByText('EasyGestion')).toBeInTheDocument();
    expect(screen.getByText('Create your admin account to get started')).toBeInTheDocument();
    expect(screen.getByLabelText('Name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Email:')).toBeInTheDocument();
    expect(screen.getByLabelText('SIRET (14 digits):')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone:')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password:')).toBeInTheDocument();
    expect(screen.getByText('Drop logo image here, or click to select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Admin Account' })).toBeInTheDocument();
  });

  test('shows validation error for empty fields', async () => {
    renderWithProviders(<Home />);

    const submitButton = screen.getByRole('button', { name: 'Create Admin Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });
  });

  test('shows validation error for password mismatch', async () => {
    renderWithProviders(<Home />);

    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('SIRET (14 digits):'), { target: { value: '12345678901234' } });
    fireEvent.change(screen.getByLabelText('Phone:'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password:'), { target: { value: 'DifferentPassword123!' } });

    const submitButton = screen.getByRole('button', { name: 'Create Admin Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('shows validation error for invalid SIRET', async () => {
    renderWithProviders(<Home />);

    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('SIRET (14 digits):'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Phone:'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'Password123456789!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password:'), { target: { value: 'Password123456789!' } });

    const submitButton = screen.getByRole('button', { name: 'Create Admin Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('SIRET must be exactly 14 digits')).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });
    mockLogin.mockResolvedValueOnce({ success: true });

    renderWithProviders(<Home />);

    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Test Admin' } });
    fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('SIRET (14 digits):'), { target: { value: '12345678901234' } });
    fireEvent.change(screen.getByLabelText('Phone:'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Password:'), { target: { value: 'Password123456789!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password:'), { target: { value: 'Password123456789!' } });

    const submitButton = screen.getByRole('button', { name: 'Create Admin Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/admins', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'Password123456789!');
    });
  });
});
