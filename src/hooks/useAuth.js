// useAuth.js
// Returns: { session, user, loading, isSuperAdmin, signIn, signOut }
// - Uses supabase.auth.getSession() on mount
// - Subscribes to onAuthStateChange
// - Fetches profiles.is_super_admin once per session
// - signIn(email, password) → calls supabase.auth.signInWithPassword
// - signOut() → calls supabase.auth.signOut
// - loading: true until initial session check + profile fetch complete

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

async function fetchIsSuperAdmin(userId) {
  if (!userId) return false;
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', userId)
    .single();
  return data?.is_super_admin ?? false;
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsSuperAdmin(await fetchIsSuperAdmin(session?.user?.id));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsSuperAdmin(await fetchIsSuperAdmin(session?.user?.id));
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

  return { session, user, loading, isSuperAdmin, signIn, signOut };
}
