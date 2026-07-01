import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type User = {
  id: string;
  email?: string | null;
  role?: string | null;
};

interface AuthError {
  message: string;
}

interface SignResult {
  error: AuthError | null;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<SignResult>;
  signUpWithEmail: (email: string, password: string) => Promise<SignResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // assign a basic role based on email
  const assignRole = (email: string | null | undefined) => {
    if (!email) return null;
    if (email.toLowerCase() === 'jeannovaes040@gmail.com') return 'admin';
    return 'viewer';
  };
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          const u = data.session.user;
          setUser({ id: u.id, email: u.email, role: assignRole(u.email) });
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn('Auth: falha ao obter sessão (verifique VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY)', e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setUser({ id: u.id, email: u.email, role: assignRole(u.email) });
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signInWithEmail = async (email: string, password: string): Promise<SignResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? { message: error.message } : null };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<SignResult> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? { message: error.message } : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
