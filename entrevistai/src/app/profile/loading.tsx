import { LoadingState } from "@/components/ui/loading-state";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto max-w-5xl p-4">
        <div className="py-8">
          <LoadingState 
            title="Carregando seu perfil..."
            message="Preparando suas informações pessoais"
            showCard={true}
          />
        </div>
      </main>
    </div>
  );
}
