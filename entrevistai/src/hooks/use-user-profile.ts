"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/types/profile";
import { type User as SupabaseUser } from "@supabase/supabase-js";

export function useUserProfile(user: SupabaseUser | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          // Se não há perfil, criar um básico
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário",
                avatar_url: user.user_metadata?.avatar_url || null,
                updated_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (!createError && newProfile) {
            setProfile(newProfile);
          }
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
}
