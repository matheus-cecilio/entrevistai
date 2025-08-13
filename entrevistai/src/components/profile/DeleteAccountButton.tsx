"use client"

import { deleteUserAccountAction } from "@/lib/actions"
import { logout } from "@/app/login/actions"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DeleteAccountButton() {
  const { toast } = useToast()

  const handleDeleteAccount = async () => {
    const result = await deleteUserAccountAction()
    
    if (result.success) {
      toast({
        title: "Conta excluída",
        description: result.warning || result.message || "Sua conta foi excluída permanentemente.",
        variant: result.warning ? "default" : "default"
      })
      // Fazer logout e redirecionar para login
      await logout()
    } else {
      toast({
        title: "Erro ao excluir conta",
        description: result.error || "Não foi possível excluir sua conta. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <DeleteConfirmationDialog
      title="Excluir Conta Permanentemente"
      description="Tem certeza que deseja excluir sua conta? Esta ação irá remover TODOS os seus dados, incluindo histórico de entrevistas, perfil e configurações. Esta ação não pode ser desfeita."
      onConfirm={handleDeleteAccount}
      trigger={
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Conta Permanentemente
        </Button>
      }
    />
  )
}
