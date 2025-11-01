import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { loginUser, registerUser } from '../services/authApi';
import { clearToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  selectedRole: UserRole | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  selectRole: (role: UserRole) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  resetRole: () => void;
  register: (userData: Omit<User, 'id' | 'role'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'ayu_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_KEY);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setSelectedRole(parsedUser.role);
      }
    } catch (e) {
      console.error("Failed to parse user session.", e);
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setIsInitialized(true);
    }
  }, []);


  const selectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const login = async (email: string, pass: string) => {
    if (!selectedRole) {
        setError("Please select a role first.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await loginUser(email, pass);
      // Optional: enforce role matching if UI insists on selectedRole filter
      if (loggedInUser.role !== selectedRole) {
        throw new Error('Selected role does not match your account role.');
      }
      setUser(loggedInUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'role'>) => {
    if (!selectedRole) {
        setError("Please select a role first.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const location = (userData as any)?.location ? { latitude: (userData as any).location.latitude, longitude: (userData as any).location.longitude } : undefined;
        const newUser = await registerUser({ name: userData.name, email: userData.email, password: (userData as any).password || 'password', role: selectedRole, location });
        setUser(newUser); // Auto-login after registration
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    } catch (err) {
        setError((err as Error).message);
        throw err; // re-throw to be caught in component
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSelectedRole(null);
    sessionStorage.removeItem(SESSION_KEY);
    clearToken();
  };

  const resetRole = () => {
      setSelectedRole(null);
      setError(null);
  }

  return (
    <AuthContext.Provider value={{ user, selectedRole, loading, error, selectRole, login, logout, resetRole, register, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};