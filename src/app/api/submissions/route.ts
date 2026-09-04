import { NextResponse } from "next/server";
import { getDb, UPLOADS_DIR } from "@/lib/db";
import { getSession } from "@/lib/auth";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentId =
      searchParams.get("studentId") ||
      (session.role === "estudiante" ? String(session.studentId) : null);

    const db = getDb();

    let query = `
      SELECT 
        s.id,
        s.assignment_id,
        s.student_id,
        s.student_name,
        s.file_name,
        s.original_name,
        s.file_size,
        s.submitted_at,
        s.grade,
        s.feedback,
        s.graded_at,
        s.status,
        a.title as assignment_title,
        a.due_date as assignment_due_date,
        st.email as student_email,
        st.matricula as student_matricula
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN students st ON s.student_id = st.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (assignmentId) {
      query += " AND s.assignment_id = ?";
      params.push(parseInt(assignmentId, 10));
    }

    if (studentId && session.role === "estudiante") {
      query += " AND s.student_id = ?";
      params.push(parseInt(studentId, 10));
    }

    query += " ORDER BY s.submitted_at DESC";

    const submissions = db.prepare(query).all(...params);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Error al obtener las entregas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const assignmentIdRaw = formData.get("assignmentId");
    const file = formData.get("file") as File | null;

    if (!assignmentIdRaw || !file) {
      return NextResponse.json(
        { error: "Se requiere la tarea y el archivo PDF" },
        { status: 400 },
      );
    }

    const assignmentId = parseInt(String(assignmentIdRaw), 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "ID de tarea inválido" },
        { status: 400 },
      );
    }

    // Validate that file is PDF
    const fileNameLower = file.name.toLowerCase();
    if (!fileNameLower.endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error:
            "Formato inválido. Solo se permiten archivos en formato PDF (.pdf)",
        },
        { status: 400 },
      );
    }

    // Max file size: 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "El archivo excede el tamaño máximo permitido de 15MB" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Check if assignment exists
    const assignment = db
      .prepare("SELECT id, title FROM assignments WHERE id = ?")
      .get(assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { error: "La tarea seleccionada no existe" },
        { status: 404 },
      );
    }

    // Determine student info
    let studentId = session.studentId || 1;
    let studentName = session.name;

    // Ensure student exists in database
    const studentRecord = db
      .prepare("SELECT id, name FROM students WHERE id = ?")
      .get(studentId) as { id: number; name: string } | undefined;
    if (!studentRecord) {
      // Pick first student or fallback
      const firstStudent = db
        .prepare("SELECT id, name FROM students ORDER BY id ASC LIMIT 1")
        .get() as { id: number; name: string } | undefined;
      if (firstStudent) {
        studentId = firstStudent.id;
        studentName = firstStudent.name;
      }
    } else {
      studentName = studentRecord.name;
    }

    // Save PDF file to UPLOADS_DIR
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}.pdf`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);

    fs.writeFileSync(destinationPath, buffer);

    // Check if an existing submission exists for this student and assignment
    const existingSubmission = db
      .prepare(
        `
      SELECT id, file_name FROM submissions WHERE assignment_id = ? AND student_id = ?
    `,
      )
      .get(assignmentId, studentId) as
      | { id: number; file_name: string }
      | undefined;

    let submissionId: number;

    if (existingSubmission) {
      // Remove old file if it exists and is different
      if (
        existingSubmission.file_name &&
        existingSubmission.file_name !== uniqueFileName
      ) {
        const oldPath = path.join(UPLOADS_DIR, existingSubmission.file_name);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch {
            // Ignore error
          }
        }
      }

      // Update existing submission record
      db.prepare(
        `
        UPDATE submissions 
        SET 
          file_name = ?, 
          original_name = ?, 
          file_size = ?, 
          submitted_at = datetime('now'),
          status = 'entregada',
          grade = NULL,
          feedback = NULL,
          graded_at = NULL
        WHERE id = ?
      `,
      ).run(uniqueFileName, file.name, file.size, existingSubmission.id);

      submissionId = existingSubmission.id;
    } else {
      // Insert new submission
      const insert = db.prepare(`
        INSERT INTO submissions (
          assignment_id, student_id, student_name, file_name, original_name, file_size, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'entregada')
      `);

      const result = insert.run(
        assignmentId,
        studentId,
        studentName,
        uniqueFileName,
        file.name,
        file.size,
      );
      submissionId = Number(result.lastInsertRowid);
    }

    const savedSubmission = db
      .prepare("SELECT * FROM submissions WHERE id = ?")
      .get(submissionId);

    return NextResponse.json({
      success: true,
      message: "Tarea en formato PDF subida con éxito",
      submission: savedSubmission,
    });
  } catch (error) {
    console.error("Error uploading submission:", error);
    return NextResponse.json(
      { error: "Error al subir la tarea" },
      { status: 500 },
    );
  }
}
