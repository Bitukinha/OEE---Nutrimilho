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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null);
      setLoading(false);
    };

    getSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
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
