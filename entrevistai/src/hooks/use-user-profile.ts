"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/types/profile";
import { type User as SupabaseUser } from "@supabase/supabase-js";

export function useUserProfile(user: SupabaseUser | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        console.error("Error fetching profile:", error);
        return;
      }

      if (!data) {
        // Se não há perfil, criar um básico
        const defaultName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              full_name: defaultName,
              avatar_url: user?.user_metadata?.avatar_url || null,
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
          // Verificar se é nome padrão (baseado no email)
          const isDefaultName = defaultName === user?.email?.split("@")[0];
          setIsFirstTime(isDefaultName);
        }
      } else {
        setProfile(data);
        // Verificar se é nome padrão (primeiro acesso)
        const isDefaultName = data.full_name === user?.email?.split("@")[0];
        setIsFirstTime(isDefaultName);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.user_metadata?.full_name, user?.user_metadata?.avatar_url, user?.email]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsFirstTime(false);
      setLoading(false);
      return;
    }

    fetchProfile(user.id);
  }, [user, fetchProfile]);

  const updateProfile = useCallback((newProfile: Profile) => {
    setProfile(newProfile);
    setIsFirstTime(false);
  }, []);

  return { profile, loading, isFirstTime, updateProfile };
}
