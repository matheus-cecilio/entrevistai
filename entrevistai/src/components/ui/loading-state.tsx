"use client";

import { LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  title?: string;
  message?: string;
  showCard?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ 
  title = "Carregando...", 
  message, 
  showCard = false,
  size = "md"
}: LoadingStateProps) {
  const spinnerSizes = {
    sm: "h-6 w-6",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl"
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <LoaderCircle className={`${spinnerSizes[size]} animate-spin text-primary mb-4`} />
      <h3 className={`${titleSizes[size]} font-semibold mb-2`}>{title}</h3>
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
