import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Académico | Gestión de Tareas y Calificaciones",
  description:
    "Plataforma para gestión de estudiantes, entrega de tareas en PDF y calificaciones con SQLite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
