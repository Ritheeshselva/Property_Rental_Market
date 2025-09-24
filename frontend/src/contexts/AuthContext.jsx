import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isLoggedIn } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    isLoggedIn: false,
    role: null,
    name: null,
    email: null,
    loading: true
  });

  const checkAuthStatus = () => {
    const user = getCurrentUser();
    const loggedIn = isLoggedIn();
    
    console.log('AuthContext: Checking auth status', { loggedIn, user });
    
    setUserData({
      isLoggedIn: loggedIn,
      role: user?.role || null,
      name: user?.name || null,
      email: user?.email || null,
      loading: false
    });
  };

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();

    // Listen for auth changes
    const handleAuthChange = () => {
      console.log('AuthContext: Auth change event received');
      checkAuthStatus();
    };

    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const value = {
    ...userData,
    updateAuth: checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};