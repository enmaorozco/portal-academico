import { NextResponse } from "next/server";
import { GENERIC_USERS, AUTH_COOKIE_NAME, UserSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña requeridos" },
        { status: 400 },
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const userConfig = GENERIC_USERS[cleanUsername];

    if (!userConfig || !userConfig.passwords.includes(cleanPassword)) {
      return NextResponse.json(
        {
          error:
            "Credenciales inválidas. Usa maestro/maestro123 o estudiante/estudiante123",
        },
        { status: 401 },
      );
    }

    const session: UserSession = {
      username: userConfig.username,
      role: userConfig.role,
      name: userConfig.name,
      studentId: userConfig.studentId,
    };

    const response = NextResponse.json({ success: true, session });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: encodeURIComponent(JSON.stringify(session)),
      path: "/",
      httpOnly: false, // Accessible in client for fast navigation, but validated
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error al procesar inicio de sesión" },
      { status: 500 },
    );
  }
}
