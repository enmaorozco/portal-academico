import { cookies } from "next/headers";

export interface UserSession {
  username: string;
  role: "maestro" | "estudiante";
  name: string;
  studentId?: number;
}

export const GENERIC_USERS: Record<
  string,
  {
    username: string;
    passwords: string[];
    role: "maestro" | "estudiante";
    name: string;
    studentId?: number;
  }
> = {
  maestro: {
    username: "maestro",
    passwords: ["maestro123", "profesor123", "admin123"],
    role: "maestro",
    name: "Prof. Roberto Gómez",
  },
  profesor: {
    username: "profesor",
    passwords: ["profesor123", "maestro123"],
    role: "maestro",
    name: "Prof. Roberto Gómez",
  },
  estudiante: {
    username: "estudiante",
    passwords: ["estudiante123", "alumno123"],
    role: "estudiante",
    name: "Carlos Estudiante",
    studentId: 1,
  },
};

export const AUTH_COOKIE_NAME = "school_auth_session";

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(sessionCookie.value),
    ) as UserSession;
    if (
      parsed.role &&
      (parsed.role === "maestro" || parsed.role === "estudiante")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
