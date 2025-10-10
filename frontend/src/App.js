import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import Home from './components/Home';
import PackageManagement from './components/PackageManagement';
import ExpenseManagement from './components/ExpenseManagement';
import CreateEmployee from './components/CreateEmployee';
import SalaryViewing from './components/SalaryViewing';
import ReceiptEntry from './components/ReceiptEntry';
import Unauthorized from './components/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true }}>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/admin-dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/packages"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                  <PackageManagement />
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
              path="/admin/create-employee"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                  <CreateEmployee />
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
              path="/admin/receipts"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superAdmin']}>
                  <ReceiptEntry />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
