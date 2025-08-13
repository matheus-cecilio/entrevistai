"use client"

import { deleteInterviewAction } from "@/lib/actions"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface DeleteInterviewButtonProps {
  interviewId: string
  jobRole: string
}

export function DeleteInterviewButton({ interviewId, jobRole }: DeleteInterviewButtonProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    const result = await deleteInterviewAction(interviewId)
    
    if (result.success) {
      toast({
        title: "Entrevista excluída",
        description: "A entrevista foi removida do seu histórico com sucesso.",
      })
      router.refresh() // Recarrega a página para atualizar a lista
    } else {
      toast({
        title: "Erro ao excluir",
        description: result.error || "Não foi possível excluir a entrevista.",
        variant: "destructive",
      })
    }
  }

  return (
    <DeleteConfirmationDialog
      title="Excluir Entrevista"
      description={`Tem certeza que deseja excluir esta entrevista de "${jobRole}"? Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      trigger={
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      }
    />
  )
}
