import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import CreateEmployee from './components/CreateEmployee';
import ExpenseManagement from './components/ExpenseManagement';
import Home from './components/Home';
import Login from './components/Login';
import PackageManagement from './components/PackageManagement';
import ProtectedRoute from './components/ProtectedRoute';
import SalaryViewing from './components/SalaryViewing';
import UserDashboard from './components/UserDashboard';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/create-employee",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
        <CreateEmployee />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/expenses",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
        <ExpenseManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/salaries",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
        <SalaryViewing />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/packages",
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
        <PackageManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={['user', 'barber']}>
        <UserDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "*",
    element: <Login />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true }} />
    </AuthProvider>
  </React.StrictMode>
);
