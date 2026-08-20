import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'customer' | 'admin' | 'hotel' | 'restaurant' | 'driver' | 'guide';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  // Helper function to resolve role from Auth Metadata or Database
  const resolveUserRole = async (currentUser: User | null): Promise<UserRole | null> => {
    if (!currentUser) return null;

    // 1. Check App Metadata (set by Supabase admin/SQL)
    if (currentUser.app_metadata?.role) {
      return currentUser.app_metadata.role as UserRole;
    }

    // 2. Check User Metadata (set on signup)
    if (currentUser.user_metadata?.role) {
      return currentUser.user_metadata.role as UserRole;
    }

    // 3. Ground Truth Fallback: Query 'customers' table in Supabase
    try {
      const { data } = await supabase
        .from('customers')
        .select('role')
        .or(`id.eq.${currentUser.id},user_id.eq.${currentUser.id}`)
        .maybeSingle();

      if (data?.role) {
        return data.role as UserRole;
      }
    } catch {
      // Table query failed or row doesn't exist
    }

    return 'customer'; // Default fallback
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      const currentUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        const userRole = await resolveUserRole(currentUser);
        setRole(userRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Handle auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const currentUser = newSession?.user ?? null;
      setSession(newSession);
      setUser(currentUser);

      if (currentUser) {
        const userRole = await resolveUserRole(currentUser);
        setRole(userRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: selectedRole } },
    });

    if (error) {
      // Surface the real Supabase error text — don't paper over it.
      // Common ones you'll actually see here:
      //  - "User already registered" (422)
      //  - "Database error saving new user" (500 — a DB trigger on auth.users is failing)
      //  - "Password should be at least 6 characters" (422)
      return { error: error.message };
    }

    // NOTE: We deliberately do NOT insert into `customers` here.
    // If a Postgres trigger on auth.users (e.g. handle_new_user) already
    // creates the profile row, this insert would race it and throw a
    // duplicate-key error — which is very likely the root cause of the
    // 500s you were seeing on repeated signup attempts.
    //
    // Profile creation should happen in exactly ONE place:
    //   - Preferred: a DB trigger (atomic, can't be skipped/duplicated by client)
    //   - Or: client-side upsert with onConflict, ONLY if you confirm via
    //     the Supabase dashboard that no trigger exists.
    //
    // If you don't yet have a trigger, use this SQL instead of the client
    // insert (run once in the Supabase SQL editor):
    //
    // create or replace function public.handle_new_user()
    // returns trigger as $$
    // begin
    //   insert into public.customers (id, user_id, full_name, role)
    //   values (
    //     new.id,
    //     new.id,
    //     new.raw_user_meta_data->>'full_name',
    //     coalesce(new.raw_user_meta_data->>'role', 'customer')
    //   )
    //   on conflict (id) do nothing;
    //   return new;
    // end;
    // $$ language plpgsql security definer set search_path = public;
    //
    // drop trigger if exists on_auth_user_created on auth.users;
    // create trigger on_auth_user_created
    //   after insert on auth.users
    //   for each row execute function public.handle_new_user();

    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/portal`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, role, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}