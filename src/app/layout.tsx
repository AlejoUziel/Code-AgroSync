import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import LocalDBProvider from "@/components/providers/LocalDBProvider";
import { ModernAlertProvider } from "@/components/shared/ModernAlertDialog";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgroSync — Plataforma de Gestión Agrícola",
  description:
    "AgroSync es la plataforma SaaS líder para la gestión integral de fincas y cultivos. Optimiza tu operación agrícola con tecnología de punta.",
  keywords:
    "agricultura, gestión agrícola, cultivos, parcelas, inventario agrícola, SaaS agrícola",
  openGraph: {
    title: "AgroSync — Gestión Agrícola Inteligente",
    description:
      "Plataforma integral de gestión para empresas agrícolas y administradores de fincas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={outfit.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TooltipProvider>
          <LocalDBProvider>
            <ModernAlertProvider>{children}</ModernAlertProvider>
          </LocalDBProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
