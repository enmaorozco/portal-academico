import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const db = getDb();
    // Get students along with their submissions count and average grade
    const query = `
      SELECT 
        s.id,
        s.name,
        s.email,
        s.matricula,
        s.created_at,
        COUNT(sub.id) as total_submissions,
        ROUND(AVG(sub.grade), 1) as average_grade
      FROM students s
      LEFT JOIN submissions sub ON s.id = sub.student_id
      GROUP BY s.id
      ORDER BY s.name ASC
    `;

    const students = db.prepare(query).all();
    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Error al obtener los estudiantes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "maestro") {
      return NextResponse.json(
        { error: "Solo el maestro puede registrar estudiantes" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, email, matricula } = body;

    if (!name || !email || !matricula) {
      return NextResponse.json(
        {
          error: "Todos los campos son requeridos (nombre, correo y matrícula)",
        },
        { status: 400 },
      );
    }

    const db = getDb();

    // Check if email or matricula already exists
    const existing = db
      .prepare("SELECT id FROM students WHERE email = ? OR matricula = ?")
      .get(String(email).trim(), String(matricula).trim());

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un estudiante con ese correo o matrícula" },
        { status: 409 },
      );
    }

    const insert = db.prepare(
      "INSERT INTO students (name, email, matricula) VALUES (?, ?, ?)",
    );
    const result = insert.run(
      String(name).trim(),
      String(email).trim().toLowerCase(),
      String(matricula).trim().toUpperCase(),
    );

    const newStudent = db
      .prepare("SELECT * FROM students WHERE id = ?")
      .get(Number(result.lastInsertRowid));

    return NextResponse.json({ student: newStudent }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Error al registrar el estudiante" },
      { status: 500 },
    );
  }
}
