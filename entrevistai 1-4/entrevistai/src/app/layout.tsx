import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Importar a fonte
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// 2. Instanciar a fonte
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // 3. Criar uma variável CSS para o Tailwind
});

export const metadata: Metadata = {
  title: "EntrevistAI",
  description: "Sua próxima entrevista com um simulador alimentado por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>{}</head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
