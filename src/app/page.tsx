"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.session) {
          if (data.session.role === "maestro") {
            router.push("/dashboard/maestro");
          } else {
            router.push("/dashboard/estudiante");
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (
    e?: React.FormEvent,
    customUser?: string,
    customPass?: string,
  ) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const userToSubmit = customUser ?? username;
    const passToSubmit = customPass ?? password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userToSubmit,
          password: passToSubmit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      if (data.session.role === "maestro") {
        router.push("/dashboard/maestro");
      } else {
        router.push("/dashboard/estudiante");
      }
    } catch {
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  const quickLogin = (role: "maestro" | "estudiante") => {
    if (role === "maestro") {
      setUsername("maestro");
      setPassword("maestro123");
      handleLogin(undefined, "maestro", "maestro123");
    } else {
      setUsername("estudiante");
      setPassword("estudiante123");
      handleLogin(undefined, "estudiante", "estudiante123");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <GraduationCap className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Portal Educativo
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Gestión de Estudiantes, Tareas PDF y Calificaciones
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. maestro o estudiante"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? "Ingresando..." : "Iniciar Sesión"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Acceso Rápido / Credenciales Genéricas */}
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Acceso Rápido de Prueba (1 Clic)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => quickLogin("maestro")}
                disabled={loading}
                className="flex flex-col items-center p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all text-left group"
              >
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Maestro</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  maestro / maestro123
                </span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("estudiante")}
                disabled={loading}
                className="flex flex-col items-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-left group"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>Estudiante</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  estudiante / estudiante123
                </span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Credenciales Genéricas Configuradas:</span>
              </div>
              <ul className="list-disc list-inside text-slate-500 pl-1 space-y-0.5">
                <li>
                  <strong className="text-slate-700">Profesor:</strong> usuario{" "}
                  <code>maestro</code> | clave <code>maestro123</code>
                </li>
                <li>
                  <strong className="text-slate-700">Estudiante:</strong>{" "}
                  usuario <code>estudiante</code> | clave{" "}
                  <code>estudiante123</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
