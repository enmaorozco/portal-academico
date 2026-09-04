"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GraduationCap, LogOut, User, BookOpen, Layers } from "lucide-react";
import { UserSession } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.session) {
          router.push("/");
        } else {
          setSession(data.session);
          // Check role alignment
          if (
            pathname.includes("/dashboard/maestro") &&
            data.session.role !== "maestro"
          ) {
            router.push("/dashboard/estudiante");
          } else if (
            pathname.includes("/dashboard/estudiante") &&
            data.session.role !== "estudiante"
          ) {
            router.push("/dashboard/maestro");
          }
        }
      })
      .catch(() => {
        router.push("/");
      })
      .finally(() => setLoading(false));
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
  };

  const handleSwitchUser = async (targetRole: "maestro" | "estudiante") => {
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: targetRole,
          password: `${targetRole}123`,
        }),
      });
      if (targetRole === "maestro") {
        router.push("/dashboard/maestro");
      } else {
        router.push("/dashboard/estudiante");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">
            Cargando portal...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isTeacher = session.role === "maestro";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl text-white ${isTeacher ? "bg-indigo-600" : "bg-emerald-600"}`}
            >
              {isTeacher ? (
                <BookOpen className="w-6 h-6" />
              ) : (
                <GraduationCap className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Portal Académico
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isTeacher
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {isTeacher ? "Profesor / Maestro" : "Estudiante"}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistema de Tareas en PDF y Calificaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch Button */}
            <button
              onClick={() =>
                handleSwitchUser(isTeacher ? "estudiante" : "maestro")
              }
              title={`Cambiar a vista de ${isTeacher ? "Estudiante" : "Profesor"}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Cambiar a {isTeacher ? "Estudiante" : "Maestro"}</span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 font-semibold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {session.name}
                </p>
                <p className="text-[11px] text-slate-400 capitalize">
                  @{session.username}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Plataforma Escolar Next.js &bull; SQLite Data Store &bull; Entregas de
        Tareas en PDF
      </footer>
    </div>
  );
}
