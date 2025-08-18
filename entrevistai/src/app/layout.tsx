import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";
import { UserHeader } from "@/components/user/UserHeader";
import { UserHeaderClient } from "@/components/user/UserHeaderClient";

// 2. Instanciar a fonte
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Criar uma variável CSS para o Tailwind
});

export const metadata: Metadata = {
  title: "EntrevistAI",
  description: "Sua próxima entrevista com um simulador alimentado por IA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="pt-BR" className={`${inter.variable} dark`}>
      <head>{}</head>
      <body className="font-body antialiased">
        <div className="min-h-screen">
          <div className="container mx-auto max-w-5xl px-4 pt-4">
            {/* SSR header when user cookie is available */}
            {user ? <UserHeader user={user} /> : <UserHeaderClient initialUser={null} />}
          </div>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
