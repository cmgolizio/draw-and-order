"use client";

import { createBrowserClient } from "@supabase/ssr";

// We create *one* browser client
let supabase = null;

export function getSupabaseClient() {
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

/* ---------------------------
   AUTH HELPERS
---------------------------- */

// SIGN IN WITH EMAIL + PASSWORD
export async function signInWithEmail(email, password) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// SIGN UP WITH EMAIL + PASSWORD
export async function signUpWithEmail(email, password) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// SIGN IN WITH GOOGLE OAUTH
export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  return { data, error };
}

// SIGN OUT
export async function signOutUser() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

// SUBSCRIBE TO USER STATE CHANGES
export function onAuthStateChanged(callback) {
  const supabase = getSupabaseClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });
}

// GET CURRENT USER (async)
export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}
