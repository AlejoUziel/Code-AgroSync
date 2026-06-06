import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import LocalDBProvider from "@/components/providers/LocalDBProvider";

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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TooltipProvider>
          {/* Seeds localStorage with demo data on first visit.
              Remove this wrapper when connecting to MySQL. */}
          <LocalDBProvider>{children}</LocalDBProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
