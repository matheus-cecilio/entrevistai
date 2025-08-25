import { LoadingState } from "@/components/ui/loading-state";

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-secondary">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl p-4">
        <LoadingState 
          title="Carregando histórico..."
          message="Buscando suas entrevistas anteriores"
          showCard={true}
        />
      </main>
    </div>
  );
}
