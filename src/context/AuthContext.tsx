import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithManager: (email: string, password: string) => Promise<void>;
  managerLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const isManagerAccount = (user: User | null) =>
    !!user &&
    user.providerData.some(
      (provider) => provider.providerId === 'password'
    );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(isManagerAccount(user));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithManager = async (
    email: string,
    password: string
  ) => {
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (!isManagerAccount(cred.user)) {
        await signOut(auth);
        throw new Error('Ce compte n’est pas un compte gérant.');
      }

      setCurrentUser(cred.user);
      setIsAdmin(true);
    } catch (error) {
      console.error('Manager Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const managerLogout = async () => {
    setIsAdmin(false);
    setCurrentUser(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        loading,
        signInWithManager,
        managerLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return ctx;
}
