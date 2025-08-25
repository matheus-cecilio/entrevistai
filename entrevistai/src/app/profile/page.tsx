import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { getProfile, createProfile } from '@/lib/profile-actions';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const profileResult = await getProfile(user.id);
  let profile;

  if (!profileResult.success) {
    const createResult = await createProfile(user.id, {
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
    });

    if (!createResult.success) {
      return (
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao carregar perfil</h1>
            <p className="text-muted-foreground mb-4">Não foi possível carregar ou criar seu perfil.</p>
            <Button asChild>
              <Link href="/history">Voltar ao Histórico</Link>
            </Button>
          </div>
        </div>
      );
    }

    profile = createResult.data;
  } else {
    profile = profileResult.data;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container mx-auto max-w-5xl p-4 mt-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="text-primary" />
            Configurações de Perfil
          </h1>
        </div>

        <div className="py-8">
          <ProfileForm profile={profile} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
