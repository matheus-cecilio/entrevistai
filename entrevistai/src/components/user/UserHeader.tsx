"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useOptimizedNavigation } from "@/hooks/use-optimized-navigation";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { useEffect } from "react";

interface UserHeaderProps {
  user: SupabaseUser;
}

export function UserHeader({ user }: UserHeaderProps) {
  const { profile, loading } = useUserProfile(user);
  const { preloadRoute } = useOptimizedNavigation();

  // Preload das rotas mais acessadas
  useEffect(() => {
    preloadRoute("/dashboard");
    preloadRoute("/profile");
  }, [preloadRoute]);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Usuário";

  return (
    <header className="mb-4 flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className="text-sm">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {loading ? "Carregando..." : displayName}
          </span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Link href="/dashboard" prefetch={true}>
          <Button variant="ghost" size="sm">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Histórico
          </Button>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full cursor-pointer" prefetch={true}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Histórico</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer" prefetch={true}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logout} className="w-full">
              <DropdownMenuItem asChild>
                <button className="w-full cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
