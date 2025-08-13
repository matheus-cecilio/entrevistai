import { createBrowserClient } from '@supabase/ssr'

// Cache do cliente para evitar recriar constantemente
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Reusar cliente existente se disponível
  if (supabaseClient) {
    return supabaseClient;
  }

  // Create a supabase client on the browser with project's credentials
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storageKey: 'entrevistai-auth-token',
      },
    }
  );

  return supabaseClient;
}
