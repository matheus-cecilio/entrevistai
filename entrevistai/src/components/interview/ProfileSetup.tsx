import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Layers, Sparkles, LoaderCircle } from "lucide-react";
import type { ProfileFormData } from "@/types/interview";
import { esquemaPerfil } from "@/types/interview";

export const ProfileSetup = ({ onStart, isLoading }: { onStart: (data: ProfileFormData) => void; isLoading: boolean }) => {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(esquemaPerfil),
    defaultValues: { jobRole: "", professionalArea: "" },
  });

  return (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold">EntrevistAI</CardTitle>
        <CardDescription className="text-lg">
          Aprimore suas habilidades com uma entrevista conversacional baseada em IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onStart)} className="space-y-6">
            <FormField
              control={form.control}
              name="jobRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Sua função profissional</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="Exemplo: Desenvolvedor React Senior" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="professionalArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Área de atuação</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input placeholder="Exemplo: React, Node.js, TypeScript, JS" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg" size="lg" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "Começar Entrevista"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
