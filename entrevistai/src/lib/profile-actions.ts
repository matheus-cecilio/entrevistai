"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, type UpdateProfileData } from "@/types/profile";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function getProfile(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error("Error in getProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateProfile(userId: string, profileData: UpdateProfileData) {
  try {
    // Validar dados de entrada
    const validatedData = updateProfileSchema.parse(profileData);
    
    const supabase = await createClient();

    // Preparar dados para atualização
    const updateData = {
      full_name: validatedData.full_name,
      avatar_url: validatedData.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }

    // Revalidar as páginas que dependem do perfil
    revalidatePath("/profile");
    revalidatePath("/history");
    revalidatePath("/");

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function createProfile(userId: string, initialData?: Partial<UpdateProfileData>) {
  try {
    const supabase = await createClient();

    const profileData = {
      id: userId,
      full_name: initialData?.full_name || null,
      avatar_url: initialData?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in createProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Action para atualizar o perfil do usuário atual autenticado
 */
export async function updateProfileAction(profileData: UpdateProfileData) {
  try {
    // Validar dados de entrada
    const validatedData = updateProfileSchema.parse(profileData);
    
    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Preparar dados para atualização
    const updateData = {
      full_name: validatedData.full_name,
      avatar_url: validatedData.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }

    // Revalidar as páginas que dependem do perfil
    revalidatePath("/profile");
    revalidatePath("/history");
    revalidatePath("/");

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateProfileAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Action para solicitar alteração de senha por email
 */
export async function requestPasswordChange() {
  try {
    const supabase = await createClient();

    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    // Construir URL de redirecionamento
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:9002';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const redirectTo = `${protocol}://${host}/reset-password`;

    // Solicitar reset de senha para o usuário atual
    const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
      redirectTo,
    });

    if (error) {
      console.error('Password change request error:', error);
      return { success: false, error: 'Erro ao enviar email de alteração. Tente novamente.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in requestPasswordChange:', error);
    return { success: false, error: 'Erro inesperado. Tente novamente.' };
  }
}
