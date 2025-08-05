
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  loginUser: (username: string, password: string) => Promise<User | null>;
  signupUser: (username: string, password: string, companyName: string, phoneNumbers: string[], role: UserRole) => Promise<User | null>; // Updated signature
  logoutUser: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>; // Added to refresh context
  isAdmin: boolean;
  isPosAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  const loadUser = useCallback(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const loginUser = useCallback(async (username: string, password: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null); 
      throw error; 
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const signupUser = useCallback(async (username: string, password: string, companyName: string, phoneNumbers: string[], role: UserRole): Promise<User | null> => { 
    setIsLoadingAuth(true);
    try {
      // First, create the user account
      await authService.signup(username, password, companyName, phoneNumbers, role);
      // Then, automatically log the new user in
      const loggedInUser = await loginUser(username, password);
      return loggedInUser;
    } catch (error) {
      console.error("Signup or auto-login failed:", error);
      // If signup worked but auto-login failed, user still exists but isn't logged in.
      // If signup failed, loginUser won't be called or will fail.
      setCurrentUser(null); // Ensure no stale user state if auto-login fails
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [loginUser]);

  const logoutUser = useCallback(async () => {
    setIsLoadingAuth(true);
    await authService.logout();
    setCurrentUser(null);
    setIsLoadingAuth(false);
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    setIsLoadingAuth(true);
    const user = authService.getCurrentUser(); // Re-fetch from service (which reads from localStorage)
    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);


  const isAdmin = currentUser?.role === UserRole.Admin;
  const isPosAgent = currentUser?.role === UserRole.PosAgent;

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, loginUser, signupUser, logoutUser, refreshCurrentUser, isAdmin, isPosAgent }}>
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
