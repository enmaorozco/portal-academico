"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  Calendar,
  Award,
  ExternalLink,
  X,
  FileCheck,
  RefreshCw,
  Info,
} from "lucide-react";

interface AssignmentWithSubmission {
  id: number;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  submission_id: number | null;
  file_name: string | null;
  original_name: string | null;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  submission_status: "entregada" | "calificada" | null;
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Modal & Preview state
  const [uploadModalAssignment, setUploadModalAssignment] =
    useState<AssignmentWithSubmission | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssignments = useCallback(async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error("Error fetching assignments:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const handleFileChange = (file: File | null) => {
    setUploadError("");
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      setUploadError(
        "Formato inválido. Por favor selecciona únicamente un archivo en formato PDF (.pdf).",
      );
      setSelectedFile(null);
      return;
    }

    // 15 MB limit
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("El archivo excede el tamaño límite permitido de 15MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalAssignment || !selectedFile) {
      setUploadError("Selecciona un archivo PDF para subir");
      return;
    }

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("assignmentId", String(uploadModalAssignment.id));
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Error al subir la tarea");
        setUploading(false);
        return;
      }

      setSelectedFile(null);
      setUploadModalAssignment(null);
      loadAssignments();
    } catch {
      setUploadError("Error de red al conectar con el servidor");
    } finally {
      setUploading(false);
    }
  };

  // Calculations for stats
  const totalCount = assignments.length;
  const submittedCount = assignments.filter(
    (a) => a.submission_id !== null,
  ).length;
  const gradedList = assignments.filter((a) => a.grade !== null);
  const averageGrade =
    gradedList.length > 0
      ? (
          gradedList.reduce((acc, curr) => acc + (curr.grade || 0), 0) /
          gradedList.length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Student Greeting & Stats */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-700/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
              Panel del Estudiante
            </span>
            <h1 className="text-2xl font-bold tracking-tight">
              Bienvenido a tu aula virtual
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Aquí puedes revisar tus asignaciones, subir tus tareas en formato
              PDF y consultar las calificaciones y comentarios de tu maestro.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <div className="text-center px-3 border-r border-white/20">
              <p className="text-xl font-extrabold">
                {submittedCount} / {totalCount}
              </p>
              <p className="text-[11px] text-emerald-100">Entregadas</p>
            </div>
            <div className="text-center px-3">
              <p className="text-xl font-extrabold">
                {averageGrade ? `${averageGrade}` : "N/A"}
              </p>
              <p className="text-[11px] text-emerald-100">Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Assignments List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Mis Tareas Asignadas
            </h2>
            <p className="text-xs text-slate-500">
              Sube tus archivos PDF antes de la fecha límite para su evaluación.
            </p>
          </div>
          <button
            onClick={() => loadAssignments()}
            className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
            title="Recargar tareas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-sm">
              No tienes tareas asignadas por el momento
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Tu profesor aún no ha publicado nuevas tareas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isSubmitted = assignment.submission_id !== null;
              const isGraded = assignment.submission_status === "calificada";

              return (
                <div
                  key={assignment.id}
                  className={`border rounded-xl p-5 transition-all ${
                    isGraded
                      ? "border-emerald-200 bg-emerald-50/20"
                      : isSubmitted
                        ? "border-blue-200 bg-blue-50/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    {/* Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">
                          {assignment.title}
                        </h3>

                        {/* Status badge */}
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Calificada
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            <FileCheck className="w-3.5 h-3.5" />
                            Entregada (Pendiente de Nota)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente de Entrega
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {assignment.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Fecha límite:{" "}
                          <strong className="text-slate-700 font-mono">
                            {assignment.due_date}
                          </strong>
                        </span>
                        {assignment.submitted_at && (
                          <span className="text-slate-400">
                            Entregada el:{" "}
                            {new Date(
                              assignment.submitted_at,
                            ).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions & Grade display */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:border-l lg:border-slate-200 lg:pl-5">
                      {isGraded && (
                        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center min-w-[110px]">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                            Calificación
                          </span>
                          <span className="text-xl font-black text-emerald-700">
                            {assignment.grade} / 100
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {isSubmitted ? (
                          <>
                            {assignment.file_name && (
                              <button
                                onClick={() =>
                                  setPreviewPdfUrl({
                                    url: `/api/files/${assignment.file_name}`,
                                    title: `${assignment.title} - ${assignment.original_name}`,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                                title="Ver mi PDF enviado"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                                <span>Ver mi PDF</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setUploadModalAssignment(assignment);
                                setSelectedFile(null);
                                setUploadError("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                              title="Subir una nueva versión en PDF"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Reenviar PDF</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setUploadModalAssignment(assignment);
                              setSelectedFile(null);
                              setUploadError("");
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Subir Tarea (PDF)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Card if graded */}
                  {isGraded && assignment.feedback && (
                    <div className="mt-4 pt-3 border-t border-emerald-200/60 bg-emerald-50/50 p-3 rounded-lg flex items-start gap-2.5">
                      <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          Retroalimentación del Maestro:
                        </p>
                        <p className="text-xs text-slate-700 mt-0.5 italic">
                          &ldquo;{assignment.feedback}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Subir Archivo PDF */}
      {uploadModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Entregar Tarea en PDF
                </h3>
              </div>
              <button
                onClick={() => setUploadModalAssignment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-800">
                  {uploadModalAssignment.title}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Fecha límite: {uploadModalAssignment.due_date}
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-50/50"
                    : selectedFile
                      ? "border-emerald-300 bg-emerald-50/20"
                      : "border-slate-300 hover:border-emerald-400 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) =>
                    handleFileChange(e.target.files ? e.target.files[0] : null)
                  }
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull;
                        Formato PDF Válido
                      </p>
                    </div>
                    <p className="text-xs text-emerald-600 font-medium pt-1">
                      Haz clic si deseas cambiar de archivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Arrastra y suelta tu archivo PDF aquí
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        o haz clic para explorar en tu computadora
                      </p>
                    </div>
                    <span className="inline-block bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      SOLO FORMATO PDF (máx. 15MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalAssignment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Subiendo PDF...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirmar Entrega</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visor de PDF */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="bg-red-50 text-red-600 border border-red-200 font-bold text-xs px-2 py-1 rounded">
                  PDF
                </span>
                <h3 className="font-bold text-slate-800 text-sm truncate max-w-lg">
                  {previewPdfUrl.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-600 hover:text-emerald-600 rounded-lg hover:bg-slate-200 transition-colors text-xs flex items-center gap-1"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Pestaña nueva</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF iframe */}
            <div className="flex-1 bg-slate-100 p-1">
              <iframe
                src={previewPdfUrl.url}
                className="w-full h-full rounded-b-xl border-0 shadow-inner bg-white"
                title="Visor PDF de Tarea"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
