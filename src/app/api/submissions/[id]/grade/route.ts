import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "maestro") {
      return NextResponse.json(
        { error: "Solo el maestro puede calificar tareas" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const submissionId = parseInt(id, 10);
    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: "ID de entrega inválido" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { grade, feedback } = body;

    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      return NextResponse.json(
        { error: "La calificación debe ser un número válido entre 0 y 100" },
        { status: 400 },
      );
    }

    const db = getDb();
    const submission = db
      .prepare("SELECT id FROM submissions WHERE id = ?")
      .get(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Entrega no encontrada" },
        { status: 404 },
      );
    }

    db.prepare(
      `
      UPDATE submissions
      SET 
        grade = ?,
        feedback = ?,
        status = 'calificada',
        graded_at = datetime('now')
      WHERE id = ?
    `,
    ).run(
      numericGrade,
      feedback ? String(feedback).trim() : null,
      submissionId,
    );

    const updated = db
      .prepare("SELECT * FROM submissions WHERE id = ?")
      .get(submissionId);

    return NextResponse.json({
      success: true,
      message: "Calificación y comentarios guardados con éxito",
      submission: updated,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json(
      { error: "Error al calificar la tarea" },
      { status: 500 },
    );
  }
}
