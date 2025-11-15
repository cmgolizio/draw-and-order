// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { subscribeToAuthChanges } from "@/lib/authHelpers";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsub = subscribeToAuthChanges((firebaseUser) => {
//       setUser(firebaseUser);
//       setLoading(false);
//     });
//     return () => unsub();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }

// "use client";

// import { createContext, useContext, useEffect, useState } from "react";

// import { createSupabaseClient } from "@/lib/supabaseClient";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const supabase = createSupabaseClient();

//     // 1) Get current session/user on mount
//     supabase.auth.getUser().then(({ data, error }) => {
//       if (error) {
//         console.error("Supabase getUser error:", error);
//       } else {
//         setUser(data?.user ?? null);
//       }
//       setLoading(false);
//     });

//     // 2) Subscribe to auth changes (login/logout)
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null);
//     });

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }

// /**
//  * "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { supabaseBrowserClient } from "@/lib/supabaseBrowserClient";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const supabase = supabaseBrowserClient();
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     supabase.auth.getUser().then(({ data }) => {
//       setUser(data?.user ?? null);
//     });

//     const { data: listener } = supabase.auth.onAuthStateChange(
//       (_event, session) => {
//         setUser(session?.user ?? null);
//       }
//     );

//     return () => listener.subscription.unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, supabase }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);

//  */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, supabase, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
