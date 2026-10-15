import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('solar_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginUser = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('solar_auth_user', JSON.stringify(user));
    } catch (e) {
      console.error('Storage error:', e);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('solar_auth_user');
    } catch (e) {
      console.error('Storage error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
