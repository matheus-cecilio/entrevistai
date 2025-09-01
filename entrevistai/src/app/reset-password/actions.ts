'use server'

import { createClient } from '@/lib/supabase/server'

export async function resetPassword(formData: FormData, accessToken: string, refreshToken: string) {
  try {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
      return { success: false, error: 'Todos os campos são obrigatórios.' }
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'As senhas não coincidem.' }
    }

    // Validação de força da senha
    if (password.length < 8) {
      return { success: false, error: 'A senha deve ter pelo menos 8 caracteres.' }
    }

    if (!/[A-Z]/.test(password)) {
      return { success: false, error: 'A senha deve conter pelo menos uma letra maiúscula.' }
    }

    if (!/[a-z]/.test(password)) {
      return { success: false, error: 'A senha deve conter pelo menos uma letra minúscula.' }
    }

    if (!/\d/.test(password)) {
      return { success: false, error: 'A senha deve conter pelo menos um número.' }
    }

    const supabase = await createClient()

    // Definir a sessão com os tokens do link de recuperação
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      console.error('Session error:', sessionError)
      return { success: false, error: 'Token de recuperação inválido ou expirado.' }
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return { success: false, error: 'Erro ao atualizar senha. Tente novamente.' }
    }

    // Fazer logout para forçar novo login com a nova senha
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in resetPassword:', error)
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}
