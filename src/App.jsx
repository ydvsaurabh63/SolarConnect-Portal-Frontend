import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import PortalLogin from './pages/PortalLogin';
import ConsumerDashboard from './pages/ConsumerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import AgentDashboard from './pages/AgentDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import FinancerDashboard from './pages/FinancerDashboard';
import InstallerDashboard from './pages/InstallerDashboard';

import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* 2. Unified Role-Based Login Routes */}
          {/* e.g. /superadmin/login, /admin/login, /distributor/login, /agent/login, etc. */}
          <Route path="/:role/login" element={<PortalLogin />} />
          <Route path="/login" element={<Navigate to="/user/login" replace />} />

          {/* 3. Role-Based Protected Dashboards */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <ConsumerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/distributor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['distributor']}>
                <DistributorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['agent', 'executive']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['partner']}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/financer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['financer']}>
                <FinancerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/installer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['installer']}>
                <InstallerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
