import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DB_PATH = path.join(DATA_DIR, "school.db");

let dbInstance: DatabaseSync | null = null;

function ensureSamplePdf(filePath: string) {
  if (!fs.existsSync(filePath)) {
    const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 260 >>
stream
BT
/F1 22 Tf
50 720 Td
(Tarea 1: Ensayo sobre la Revolucion Industrial) Tj
/F1 13 Tf
0 -40 Td
(Alumno: Carlos Estudiante - Matricula: EST-2026-001) Tj
0 -30 Td
(Fecha de entrega: 03 de Septiembre de 2026) Tj
0 -40 Td
(Resumen:) Tj
0 -25 Td
(La revolucion industrial transformo radicalmente la estructura socioeconomica,) Tj
0 -20 Td
(pasando de una economia agraria a una produccion mecanizada impulsada por el vapor.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
619
%%EOF
`;
    fs.writeFileSync(filePath, samplePdfContent, "utf-8");
  }
}

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);

  // Enable WAL mode and foreign keys
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      matricula TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      student_name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      grade REAL DEFAULT NULL,
      feedback TEXT DEFAULT NULL,
      graded_at TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'entregada'
    );
  `);

  // Seed sample data if empty
  const countStudents = (
    db.prepare("SELECT COUNT(*) as count FROM students").get() as {
      count: number;
    }
  ).count;
  if (countStudents === 0) {
    const insertStudent = db.prepare(
      "INSERT INTO students (name, email, matricula) VALUES (?, ?, ?)",
    );
    insertStudent.run(
      "Carlos Estudiante",
      "estudiante@escuela.edu",
      "EST-2026-001",
    );
    insertStudent.run(
      "Mariana López",
      "mariana.lopez@escuela.edu",
      "EST-2026-002",
    );
    insertStudent.run(
      "Alejandro Ruiz",
      "alejandro.ruiz@escuela.edu",
      "EST-2026-003",
    );
    insertStudent.run(
      "Valeria Morales",
      "valeria.morales@escuela.edu",
      "EST-2026-004",
    );
  }

  const countAssignments = (
    db.prepare("SELECT COUNT(*) as count FROM assignments").get() as {
      count: number;
    }
  ).count;
  if (countAssignments === 0) {
    const insertAssignment = db.prepare(
      "INSERT INTO assignments (title, description, due_date) VALUES (?, ?, ?)",
    );
    insertAssignment.run(
      "Tarea 1: Ensayo sobre la Revolución Industrial",
      "Elaborar un ensayo analítico de mínimo 2 cuartillas destacando los efectos socioeconómicos de la máquina de vapor.",
      "2026-09-15",
    );
    insertAssignment.run(
      "Tarea 2: Resolución de Problemas de Cálculo",
      "Resolver los ejercicios del capítulo 4 sobre integrales definidas y cálculo de áreas bajo la curva.",
      "2026-09-22",
    );
    insertAssignment.run(
      "Tarea 3: Proyecto de Energías Renovables",
      "Presentar un reporte técnico evaluando la viabilidad de paneles solares en edificios escolares.",
      "2026-09-30",
    );
  }

  const countSubmissions = (
    db.prepare("SELECT COUNT(*) as count FROM submissions").get() as {
      count: number;
    }
  ).count;
  if (countSubmissions === 0) {
    const sampleFileName = "demo_ensayo_carlos.pdf";
    const sampleFilePath = path.join(UPLOADS_DIR, sampleFileName);
    ensureSamplePdf(sampleFilePath);

    const stats = fs.statSync(sampleFilePath);
    const insertSubmission = db.prepare(`
      INSERT INTO submissions (
        assignment_id, student_id, student_name, file_name, original_name, file_size, status, grade, feedback, graded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertSubmission.run(
      1,
      1,
      "Carlos Estudiante",
      sampleFileName,
      "Ensayo_CarlosEstudiante_RevIndustrial.pdf",
      stats.size,
      "calificada",
      95,
      "Excelente análisis histórico y muy buena estructura argumentativa. Buen trabajo.",
      new Date().toISOString(),
    );
  }

  dbInstance = db;
  return dbInstance;
}
