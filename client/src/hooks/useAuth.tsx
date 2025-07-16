import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('checkAuth: Starting authentication check...');
    try {
      const response = await fetch('/api/user');
      console.log('checkAuth: Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('checkAuth: User authenticated:', userData);
        setUser(userData);
        setError(null);
      } else if (response.status === 401) {
        // User is not authenticated, this is expected
        console.log('checkAuth: User not authenticated (401), showing landing page');
        setUser(null);
        setError(null);
      } else {
        console.log('checkAuth: Unexpected response status:', response.status);
        setError('Authentication check failed');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Authentication check failed');
    } finally {
      console.log('checkAuth: Setting loading to false');
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}