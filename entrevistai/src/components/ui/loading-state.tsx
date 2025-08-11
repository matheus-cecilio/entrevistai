"use client";

import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  title?: string;
  message?: string;
  showCard?: boolean;
}

export function LoadingState({ 
  title = "Carregando...", 
  message, 
  showCard = false 
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {message && (
        <p className="text-muted-foreground text-sm max-w-md">{message}</p>
      )}
    </div>
  );

  if (showCard) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}
