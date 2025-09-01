'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function requestPasswordReset(formData: FormData) {
  try {
    const email = formData.get('email') as string

    if (!email) {
      return { success: false, error: 'Email é obrigatório.' }
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Email inválido.' }
    }

    const supabase = await createClient()
    
    // Construir URL de redirecionamento
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:9002'
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const redirectTo = `${protocol}://${host}/reset-password`

    // Solicitar reset de senha
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('Password reset error:', error)
      
      // Não revelamos se o email existe ou não por segurança
      // Sempre retornamos sucesso para evitar enumeração de usuários
      if (error.message.includes('User not found') || error.message.includes('not found')) {
        return { success: true }
      }
      
      return { success: false, error: 'Erro ao enviar email de recuperação. Tente novamente.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in requestPasswordReset:', error)
    return { success: false, error: 'Erro inesperado. Tente novamente.' }
  }
}
