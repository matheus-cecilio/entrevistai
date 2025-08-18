"use client";

import { useAuth } from "@/hooks/use-auth";
import { UserHeader } from "./UserHeader";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserHeaderClient({ initialUser }: { initialUser: SupabaseUser | null }) {
  const { user, loading } = useAuth(initialUser);
  if (loading || !user) return null;
  return <UserHeader user={user} />;
}
