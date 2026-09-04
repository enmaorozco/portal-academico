import { NextResponse } from "next/server";
import { UPLOADS_DIR, getDb } from "@/lib/db";
import path from "node:path";
import fs from "node:fs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Archivo PDF no encontrado", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Look up original filename if available in db
    let originalName = safeFilename;
    try {
      const db = getDb();
      const record = db
        .prepare("SELECT original_name FROM submissions WHERE file_name = ?")
        .get(safeFilename) as { original_name: string } | undefined;
      if (record && record.original_name) {
        originalName = record.original_name;
      }
    } catch {
      // Fallback to safeFilename
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(originalName)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Error al leer el archivo", { status: 500 });
  }
}
