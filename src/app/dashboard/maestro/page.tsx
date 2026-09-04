"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
  Award,
  ExternalLink,
  X,
  Search,
  Filter,
  FileCheck,
  AlertCircle,
  Calendar,
  Mail,
  Hash,
} from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  matricula: string;
  created_at: string;
  total_submissions?: number;
  average_grade?: number | null;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  total_submissions?: number;
  graded_submissions?: number;
  pending_submissions?: number;
}

interface Submission {
  id: number;
  assignment_id: number;
  student_id: number;
  student_name: string;
  file_name: string;
  original_name: string;
  file_size: number;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
  status: "entregada" | "calificada";
  assignment_title: string;
  assignment_due_date: string;
  student_email: string;
  student_matricula: string;
}

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<
    "calificaciones" | "tareas" | "estudiantes"
  >("calificaciones");

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignmentId, setFilterAssignmentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(
    null,
  );

  // Forms state
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    matricula: "",
  });
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
  });
  const [gradeInput, setGradeInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [studentsRes, assignmentsRes, submissionsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/assignments"),
        fetch("/api/submissions"),
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data.assignments || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) {
      console.error("Error loading teacher data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler: Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al agregar estudiante");
        setSubmitting(false);
        return;
      }
      setNewStudent({ name: "", email: "", matricula: "" });
      setIsStudentModalOpen(false);
      loadData();
    } catch {
      setFormError("Error de red al registrar estudiante");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Delete Student
  const handleDeleteStudent = async (id: number, name: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar al estudiante "${name}"? Se borrarán también sus entregas.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar estudiante");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al eliminar");
    }
  };

  // Handler: Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al crear la tarea");
        setSubmitting(false);
        return;
      }
      setNewAssignment({ title: "", description: "", due_date: "" });
      setIsAssignmentModalOpen(false);
      loadData();
    } catch {
      setFormError("Error de red al crear tarea");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler: Delete Assignment
  const handleDeleteAssignment = async (id: number, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar la tarea "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  // Handler: Open Grade Modal
  const openGradeModal = (sub: Submission) => {
    setGradingSubmission(sub);
    setGradeInput(sub.grade !== null ? String(sub.grade) : "");
    setFeedbackInput(sub.feedback || "");
    setFormError("");
  };

  // Handler: Submit Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setFormError("");
    setSubmitting(true);

    const numericGrade = parseFloat(gradeInput);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      setFormError("La nota debe ser un número entre 0 y 100");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/submissions/${gradingSubmission.id}/grade`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: numericGrade,
            feedback: feedbackInput,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Error al guardar la calificación");
        setSubmitting(false);
        return;
      }

      setGradingSubmission(null);
      loadData();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for stats
  const totalSubmissionsCount = submissions.length;
  const pendingSubmissionsCount = submissions.filter(
    (s) => s.status === "entregada",
  ).length;
  const gradedSubmissionsCount = submissions.filter(
    (s) => s.status === "calificada",
  ).length;

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesFilter =
      filterAssignmentId === "all" ||
      String(sub.assignment_id) === filterAssignmentId;
    const matchesSearch =
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_matricula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.assignment_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Estudiantes
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {students.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Inscritos en la clase
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tareas Creadas
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {assignments.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Asignaciones vigentes
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              PDFs Recibidos
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalSubmissionsCount}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Entregas totales</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Por Calificar
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {pendingSubmissionsCount}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {gradedSubmissionsCount} ya calificadas
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 shadow-sm">
        <button
          onClick={() => setActiveTab("calificaciones")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "calificaciones"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Entregas y Calificaciones</span>
          {pendingSubmissionsCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("tareas")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "tareas"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Gestión de Tareas</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("estudiantes")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "estudiantes"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Estudiantes</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
            {students.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Entregas y Calificaciones */}
      {activeTab === "calificaciones" && (
        <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Entregas de Tareas en PDF
              </h2>
              <p className="text-xs text-slate-500">
                Visualiza los archivos PDF entregados por los estudiantes y
                asigna calificaciones con retroalimentación.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Filter by Assignment */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={filterAssignmentId}
                  onChange={(e) => setFilterAssignmentId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">
                    Todas las tareas ({assignments.length})
                  </option>
                  {assignments.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiante o tarea..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium text-sm">
                No se encontraron entregas
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Los estudiantes aún no han subido tareas que coincidan con estos
                filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">Tarea</th>
                    <th className="py-3 px-4">Archivo PDF</th>
                    <th className="py-3 px-4">Fecha Entrega</th>
                    <th className="py-3 px-4">Estado / Calificación</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {sub.student_name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {sub.student_matricula}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block line-clamp-1">
                          {sub.assignment_title}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            PDF
                          </span>
                          <span
                            className="truncate max-w-[140px]"
                            title={sub.original_name}
                          >
                            {sub.original_name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {(sub.file_size / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(sub.submitted_at).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sub.status === "calificada" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Nota: {sub.grade} / 100
                            </span>
                            {sub.feedback && (
                              <p
                                className="text-[11px] text-slate-500 mt-1 max-w-[180px] truncate"
                                title={sub.feedback}
                              >
                                &ldquo;{sub.feedback}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setPreviewPdfUrl({
                                url: `/api/files/${sub.file_name}`,
                                title: `${sub.student_name} - ${sub.assignment_title}`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                            title="Visualizar documento PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver PDF</span>
                          </button>

                          <button
                            onClick={() => openGradeModal(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {sub.status === "calificada"
                                ? "Re-calificar"
                                : "Calificar"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Gestión de Tareas */}
      {activeTab === "tareas" && (
        <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Asignaciones y Tareas
              </h2>
              <p className="text-xs text-slate-500">
                Publica tareas con instrucciones y fechas límite para que los
                estudiantes suban sus archivos PDF.
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setIsAssignmentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Tarea</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium text-sm">
                No hay tareas creadas aún
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Crea una nueva tarea para que los alumnos puedan subir sus
                entregas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {a.title}
                      </h3>
                      <button
                        onClick={() => handleDeleteAssignment(a.id, a.title)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-3 mb-4">
                      {a.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 pt-3 mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Límite:
                      </span>
                      <span className="font-medium text-slate-800 font-mono">
                        {a.due_date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Entregas registradas:</span>
                      <span className="font-bold text-indigo-600">
                        {a.total_submissions || 0} alumnos
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            a.total_submissions && a.graded_submissions
                              ? Math.round(
                                  (a.graded_submissions / a.total_submissions) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{a.graded_submissions || 0} calificadas</span>
                      <span>{a.pending_submissions || 0} pendientes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Gestión de Estudiantes */}
      {activeTab === "estudiantes" && (
        <div className="bg-white rounded-b-xl border border-slate-200 border-t-0 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Listado de Estudiantes Registrados
              </h2>
              <p className="text-xs text-slate-500">
                Gestiona a los alumnos del curso. Puedes añadir nuevos
                estudiantes o darlos de baja.
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setIsStudentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Estudiante</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4 text-center">Tareas Entregadas</th>
                  <th className="py-3 px-4 text-center">Promedio</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {student.name}
                      {student.id === 1 && (
                        <span className="ml-2 inline-flex text-[10px] font-normal bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Usuario Demo Estudiante
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {student.matricula}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {student.email}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {student.total_submissions || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {student.average_grade ? (
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                          {student.average_grade} / 100
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin calif.
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          handleDeleteStudent(student.id, student.name)
                        }
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        title="Eliminar estudiante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-200 transition-colors text-xs flex items-center gap-1"
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

      {/* Modal: Calificar Entrega */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Calificar Entrega de Tarea
                </h3>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
                <p>
                  <strong className="text-slate-700">Estudiante:</strong>{" "}
                  {gradingSubmission.student_name} (
                  {gradingSubmission.student_matricula})
                </p>
                <p>
                  <strong className="text-slate-700">Tarea:</strong>{" "}
                  {gradingSubmission.assignment_title}
                </p>
                <p>
                  <strong className="text-slate-700">Archivo:</strong>{" "}
                  {gradingSubmission.original_name}
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Calificación (Escala 0 a 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="ej. 95"
                  className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comentarios y Retroalimentación Pedagógica
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Escribe comentarios formativos sobre el trabajo entregado por el estudiante..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar Calificación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Estudiante */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Registrar Nuevo Estudiante
                </h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Daniel Torres"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ej. daniel.torres@escuela.edu"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula o Código Escolar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. EST-2026-005"
                  value={newStudent.matricula}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, matricula: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Registrar Estudiante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Tarea */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Crear Nueva Tarea
                </h3>
              </div>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Tarea 4: Análisis Literario"
                  value={newAssignment.title}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      title: e.target.value,
                    })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción e Instrucciones *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Indica las instrucciones que los estudiantes deben seguir para elaborar su PDF..."
                  value={newAssignment.description}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      description: e.target.value,
                    })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha Límite de Entrega *
                </label>
                <input
                  type="date"
                  required
                  value={newAssignment.due_date}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      due_date: e.target.value,
                    })
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Publicando..." : "Publicar Tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
