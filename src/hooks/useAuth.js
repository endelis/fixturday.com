// useAuth.js
// Returns: { session, user, loading, isSuperAdmin, signIn, signOut }
// - Uses supabase.auth.getSession() on mount
// - Subscribes to onAuthStateChange
// - Fetches profiles.is_super_admin once per session
// - signIn(email, password) → calls supabase.auth.signInWithPassword
// - signOut() → calls supabase.auth.signOut
// - loading: true until initial session check + profile fetch complete
// - Safety timeout: loading forced false after 5s to prevent infinite spinner

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

async function syncProfile(user) {
  if (!user) return false;
  try {
    // Upsert email so super admin can see who owns each tournament
    await supabase.from('profiles').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: false }
    );
    const { data } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();
    return data?.is_super_admin ?? false;
  } catch {
    return false;
  }
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — never stay loading forever (e.g. new tab, slow network)
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsSuperAdmin(await syncProfile(session?.user ?? null));
      })
      .catch(() => {
        // Session fetch failed — treat as logged out
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsSuperAdmin(await syncProfile(session?.user ?? null));
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
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
