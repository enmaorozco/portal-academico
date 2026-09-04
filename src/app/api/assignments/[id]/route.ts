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
        { error: "Solo el maestro puede eliminar tareas" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const assignmentId = parseInt(id, 10);
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "ID de tarea inválido" },
        { status: 400 },
      );
    }

    const db = getDb();
    const result = db
      .prepare("DELETE FROM assignments WHERE id = ?")
      .run(assignmentId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tarea eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Error al eliminar la tarea" },
      { status: 500 },
    );
  }
}
