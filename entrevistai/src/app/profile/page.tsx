import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Home } from 'lucide-react';
import Link from 'next/link';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { getProfile, createProfile } from '@/lib/profile-actions';

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Tentar buscar o perfil existente
  const profileResult = await getProfile(user.id);
  
  let profile;
  
  if (!profileResult.success) {
    // Se não existe perfil, criar um novo
    const createResult = await createProfile(user.id, {
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    });
    
    if (createResult.success) {
      profile = createResult.data;
    } else {
      return (
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao carregar perfil</h1>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar ou criar seu perfil.
            </p>
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      );
    }
  } else {
    profile = profileResult.data;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between border-b px-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Settings className="text-primary" />
            <span>Configurações de Perfil</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/" prefetch={true}>
                <Home className="mr-2 h-4 w-4" />
                Início
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard" prefetch={true}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto max-w-5xl p-4">
        <div className="py-8">
          <ProfileForm profile={profile} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
