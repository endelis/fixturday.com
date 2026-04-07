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

async function syncProfile(user) {
  if (!user) return false;
  try {
    // Upsert email so super admin can see who owns each tournament.
    // Silently ignored if email column doesn't exist yet — is_super_admin
    // check below still works in that case.
    await supabase.from('profiles').upsert(
      { id: user.id, email: user.email },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  } catch {
    // Non-fatal — profile email sync failed but auth can continue
  }
  try {
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
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsSuperAdmin(await syncProfile(session?.user ?? null));
      })
      .catch(() => {
        // getSession failed — treat as logged out, unblock UI
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        setIsSuperAdmin(await syncProfile(session?.user ?? null));
      } finally {
        setLoading(false);
      }
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
