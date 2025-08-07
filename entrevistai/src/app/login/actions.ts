'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  // type-safe access to form data
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect(`/login?message=Could not authenticate user. ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error(error)
    return redirect('/login?message=Could not authenticate user')
  }

  return redirect('/login?message=Check email to continue sign in process')
}

export async function loginWithProvider(provider: 'google' | 'github') {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002').origin}/auth/callback`
        }
    });

    if (error) {
        console.error("OAuth Error:", error);
        return redirect('/login?message=Could not authenticate with provider');
    }
    
    if (data.url) {
        return redirect(data.url);
    }

    return redirect('/login?message=An unknown error occurred with OAuth.');
}

export async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect('/login');
}
