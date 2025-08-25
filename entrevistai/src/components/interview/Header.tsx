import { LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { logout } from "@/app/login/actions";

export const Header = ({ user }: { user: SupabaseUser }) => (
  <header className="mb-4 flex items-center justify-between rounded-lg border bg-card p-2">
    <div className="text-sm text-muted-foreground">
      Logado como:{" "}
      <span className="font-semibold text-foreground">{user.email}</span>
    </div>
    <div className="flex items-center gap-2">
      <Link href="/history">
        <Button variant="ghost" size="sm">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Histórico
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/history" className="w-full cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Histórico</span>
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