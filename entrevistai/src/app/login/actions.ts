'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-safe access to form data
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validação básica antes de chamar o Supabase
  if (!data.email || !data.password) {
    return redirect('/login?message=' + encodeURIComponent('Email e senha são obrigatórios.'))
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Login error:', error)
    
    if (error.message?.includes('Invalid login credentials')) {
      return redirect('/login?message=' + encodeURIComponent('Email ou senha incorretos. Verifique seus dados.'))
    }
    
    if (error.message?.includes('Email not confirmed')) {
      return redirect('/login?message=' + encodeURIComponent('Email não confirmado. Verifique sua caixa de entrada.'))
    }
    
    return redirect('/login?message=' + encodeURIComponent(`Erro ao fazer login: ${error.message}`))
  }

  revalidatePath('/', 'layout')
  return redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validação básica antes de chamar o Supabase
  if (!data.email || !data.password) {
    return redirect('/signup?message=' + encodeURIComponent('Email e senha são obrigatórios.'))
  }

  if (data.password.length < 6) {
    return redirect('/signup?message=' + encodeURIComponent('Senha deve ter pelo menos 6 caracteres.'))
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error(error)
    
    // Tratamento específico para diferentes tipos de erro
    if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
      return redirect('/signup?message=' + encodeURIComponent('Este email já está cadastrado. Tente fazer login ou use outro email.'))
    }
    
    if (error.message?.includes('Invalid email')) {
      return redirect('/signup?message=' + encodeURIComponent('Email inválido. Verifique o formato do email.'))
    }
    
    if (error.message?.includes('Password')) {
      return redirect('/signup?message=' + encodeURIComponent('Senha fraca. Use pelo menos 6 caracteres com letras e números.'))
    }
    
    // Erro genérico
    return redirect('/signup?message=' + encodeURIComponent('Erro ao criar conta. Verifique os dados e tente novamente.'))
  }

  return redirect('/login?message=' + encodeURIComponent('Conta criada! Faça login!.'))
}

export async function loginWithProvider(provider: 'google' | 'github') {
    const supabase = await createClient();
    // Try to build origin from headers when available; fallback to env
    let origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { headers } = await import('next/headers');
      const hdrs = await headers();
      const proto = hdrs.get('x-forwarded-proto');
      const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
      if (host) {
        origin = `${proto || 'https'}://${host}`;
      }
    } catch {
      // ignore; use env fallback
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${new URL(origin).origin}/auth/callback`
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
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/login');
}
