"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, Save, User } from "lucide-react";
import { updateProfileSchema, type UpdateProfileData, type Profile } from "@/types/profile";
import { updateProfile } from "@/lib/profile-actions";

interface ProfileFormProps {
  profile: Profile;
  userId: string;
}

export function ProfileForm({ profile, userId }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
    },
  });

  const onSubmit = async (data: UpdateProfileData) => {
    setIsLoading(true);
    
    try {
      const result = await updateProfile(userId, data);
      
      if (result.success) {
        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar perfil",
          description: result.error || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar suas informações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUrl = form.watch("avatar_url");
  const fullName = form.watch("full_name");

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Editar Perfil
        </CardTitle>
        <CardDescription>
          Atualize suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Preview do Avatar */}
          <div className="flex items-center space-x-6 p-4 bg-secondary/50 rounded-lg">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} alt={fullName || "Avatar"} />
              <AvatarFallback className="text-lg">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{fullName || "Nome não definido"}</h3>
              <p className="text-sm text-muted-foreground">
                {avatarUrl ? "Avatar personalizado" : "Avatar com iniciais"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este é como seu perfil aparecerá no site
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite seu nome completo"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Avatar (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://exemplo.com/minha-foto.jpg"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
