"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateProfileAction } from "@/lib/profile-actions"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, User } from "lucide-react"

const welcomeFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),
})

type WelcomeFormData = z.infer<typeof welcomeFormSchema>

interface WelcomeModalProps {
  isOpen: boolean
  onComplete: (name: string) => void
  currentEmail: string
}

export function WelcomeModal({ isOpen, onComplete, currentEmail }: WelcomeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeFormSchema),
    defaultValues: {
      fullName: "",
    },
  })

  const onSubmit = async (data: WelcomeFormData) => {
    setIsLoading(true)
    
    try {
      const result = await updateProfileAction({
        full_name: data.fullName,
      })

      if (result.success) {
        toast({
          title: "Bem-vindo(a)!",
          description: `Olá, ${data.fullName}! Seu perfil foi configurado com sucesso.`,
        })
        onComplete(data.fullName)
      } else {
        toast({
          title: "Erro ao salvar nome",
          description: result.error || "Não foi possível salvar seu nome. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl">Bem-vindo ao EntrevistAI!</DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>
              Para melhorar sua experiência, como você gostaria de ser chamado(a)?
            </p>
            <p className="text-sm text-muted-foreground">
              Conectado como: <span className="font-medium">{currentEmail}</span>
            </p>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite seu nome"
                      {...field}
                      disabled={isLoading}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading || !form.watch("fullName")?.trim()}
                className="w-full"
              >
                {isLoading ? "Salvando..." : "Continuar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
