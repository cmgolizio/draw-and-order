"use client";

import Link from "next/link";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";

function AuthToggleButton() {
  const { user, supabase, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!supabase) return;
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <span className='text-sm text-gray-600' aria-live='polite'>
        Checking auth…
      </span>
    );
  }

  if (user) {
    return (
      <button
        type='button'
        onClick={handleSignOut}
        className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70'
        disabled={signingOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <Link
      href='/login'
      className='rounded-md border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500'
    >
      Sign in
    </Link>
  );
}

export default function Header() {
  return (
    <header className='sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-4 py-3'>
        <Link href='/' className='text-lg font-semibold text-gray-900'>
          Draw &amp; Order
        </Link>
        <AuthToggleButton />
      </div>
    </header>
  );
}
