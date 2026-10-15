import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, loginUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const impersonateId = searchParams.get('impersonate');
  const impersonateBy = searchParams.get('by');
  const [checkingImpersonation, setCheckingImpersonation] = useState(Boolean(impersonateId && impersonateBy));

  useEffect(() => {
    if (impersonateId && impersonateBy) {
      setCheckingImpersonation(true);
      api.impersonateUser(impersonateId, impersonateBy)
        .then((res) => {
          if (res.success && res.user) {
            loginUser(res.user);
            searchParams.delete('impersonate');
            searchParams.delete('by');
            setSearchParams(searchParams, { replace: true });
          } else {
            alert(res.message || 'Impersonation rejected');
          }
        })
        .catch((err) => {
          console.error('Impersonation error:', err);
        })
        .finally(() => {
          setCheckingImpersonation(false);
        });
    }
  }, [impersonateId, impersonateBy]);

  if (checkingImpersonation) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1120', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '18px', fontWeight: 700 }}>Switching Account & Logging in...</div>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px' }}>Verifying top-down authorization in new tab</div>
        </div>
      </div>
    );
  }

  if (!currentUser && !impersonateId) {
    const targetRole = allowedRoles[0] || 'user';
    return <Navigate to={`/${targetRole}/login`} replace />;
  }

  if (currentUser) {
    // Superadmin can view any panel
    if (currentUser.role === 'superadmin') {
      return children;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
    }
  }

  return children;
}
