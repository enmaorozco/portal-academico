import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "maestro") {
      return NextResponse.json(
        { error: "Solo el maestro puede eliminar estudiantes" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: "ID de estudiante inválido" },
        { status: 400 },
      );
    }

    const db = getDb();
    const result = db
      .prepare("DELETE FROM students WHERE id = ?")
      .run(studentId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Estudiante eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Error al eliminar el estudiante" },
      { status: 500 },
    );
  }
}
