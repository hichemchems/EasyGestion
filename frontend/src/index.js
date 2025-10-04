import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import CreateEmployee from './components/CreateEmployee';
import ExpenseManagement from './components/ExpenseManagement';
import Home from './components/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SalaryViewing from './components/SalaryViewing';
import UserDashboard from './components/UserDashboard';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-employee"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                <CreateEmployee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/expenses"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                <ExpenseManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/salaries"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                <SalaryViewing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'barber']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
