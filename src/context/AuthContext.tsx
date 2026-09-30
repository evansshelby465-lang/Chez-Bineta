import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  managerLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      const authorized =
        !!user &&
        user.email?.toLowerCase() === 'evansshelby465@gmail.com' &&
        user.emailVerified === true;

      setIsAdmin(authorized);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);

      const authorized =
        cred.user.email?.toLowerCase() === 'evansshelby465@gmail.com' &&
        cred.user.emailVerified === true;

      setCurrentUser(cred.user);
      setIsAdmin(authorized);

      if (!authorized) {
        await signOut(auth);
        throw new Error(
          'Ce compte Google n’est pas autorisé à accéder au terminal gérant.'
        );
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
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
        signInWithGoogle,
        managerLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
