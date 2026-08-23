import type { Metadata } from "next";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

export const metadata: Metadata = {
  title: "IntelRetail Pro",
  description: "Plataforma de Diagnóstico y Simulación Estratégica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="relative">
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}