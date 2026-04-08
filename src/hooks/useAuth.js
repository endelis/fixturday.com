// useAuth.js
// Returns: { session, user, loading, signIn, signOut }
// - Uses supabase.auth.getSession() on mount
// - Subscribes to onAuthStateChange
// - signIn(email, password) → calls supabase.auth.signInWithPassword
// - signOut() → calls supabase.auth.signOut
// - loading: true until initial session check completes

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const isSuperAdmin = session?.user?.app_metadata?.is_super_admin === true

  return { session, user, loading, isSuperAdmin, signIn, signOut };
}
