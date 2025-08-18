"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type User as SupabaseUser, type AuthChangeEvent, type Session } from "@supabase/supabase-js";

export function useAuth(initialUser: SupabaseUser | null = null) {
  const [user, setUser] = useState<SupabaseUser | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [initialized, setInitialized] = useState(!!initialUser);

  useEffect(() => {
    const supabase = createClient();

    // Função otimizada para verificar autenticação
    const checkAuth = async () => {
      try {
        // Primeiro, autentica de fato consultando o servidor de auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          setUser(user);
        } else {
          // Fallback: tenta obter da sessão local
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Auth error:', error);
            setUser(null);
          } else {
            setUser(session?.user ?? null);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

  // Verificar imediatamente (ainda que haja initialUser, garantimos validade da sessão)
  checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, _session: Session | null) => {
        // Revalida com getUser para garantir estado confiável
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user ?? null);
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, initialized };
}
