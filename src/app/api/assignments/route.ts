import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const studentIdParam =
      searchParams.get("studentId") ||
      (session.role === "estudiante" ? String(session.studentId) : null);

    if (session.role === "maestro") {
      // Maestro gets assignments with counts
      const query = `
        SELECT 
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.created_at,
          COUNT(s.id) as total_submissions,
          SUM(CASE WHEN s.status = 'calificada' THEN 1 ELSE 0 END) as graded_submissions,
          SUM(CASE WHEN s.status = 'entregada' THEN 1 ELSE 0 END) as pending_submissions
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id
        GROUP BY a.id
        ORDER BY a.created_at DESC
      `;
      const assignments = db.prepare(query).all();
      return NextResponse.json({ assignments });
    } else {
      // Estudiante gets assignments with their own submission status
      const studentId = studentIdParam ? parseInt(studentIdParam, 10) : 1;
      const query = `
        SELECT 
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.created_at,
          s.id as submission_id,
          s.file_name,
          s.original_name,
          s.submitted_at,
          s.grade,
          s.feedback,
          s.status as submission_status
        FROM assignments a
        LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = ?
        ORDER BY a.created_at DESC
      `;
      const assignments = db.prepare(query).all(studentId);
      return NextResponse.json({ assignments });
    }
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Error al obtener las tareas" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "maestro") {
      return NextResponse.json(
        { error: "Solo el maestro puede crear tareas" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { title, description, due_date } = body;

    if (!title || !description || !due_date) {
      return NextResponse.json(
        { error: "Título, descripción y fecha de entrega son obligatorios" },
        { status: 400 },
      );
    }

    const db = getDb();
    const insert = db.prepare(
      "INSERT INTO assignments (title, description, due_date) VALUES (?, ?, ?)",
    );
    const result = insert.run(
      String(title).trim(),
      String(description).trim(),
      String(due_date).trim(),
    );

    const newAssignment = db
      .prepare("SELECT * FROM assignments WHERE id = ?")
      .get(Number(result.lastInsertRowid));

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Error al crear la tarea" },
      { status: 500 },
    );
  }
}
