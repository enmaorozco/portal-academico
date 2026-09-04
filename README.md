# 🎓 Portal Académico: Gestión Escolar, Tareas PDF y Calificaciones

Plataforma web educativa construida con **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** y **SQLite** (`node:sqlite`). Permite a maestros gestionar sus alumnos y calificar asignaciones, y a los estudiantes subir sus tareas en formato PDF y consultar sus notas.

---

## 🔑 Credenciales Genéricas de Acceso

La aplicación cuenta con usuarios genéricos preconfigurados directamente en el código para pruebas y demostración rápida:

| Rol                       | Usuario                    | Contraseña                       | Capacidades                                                                                                                                                      |
| ------------------------- | -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 👨‍🏫 **Maestro / Profesor** | `maestro` _(o `profesor`)_ | `maestro123` _(o `profesor123`)_ | Registrar estudiantes, crear tareas con fecha de entrega, previsualizar entregas PDF en visor integrado y asignar notas con comentarios formativos.              |
| 🎓 **Estudiante**         | `estudiante`               | `estudiante123`                  | Consultar tareas asignadas, subir archivos de entrega estrictamente en formato **PDF**, visualizar sus entregas y ver calificaciones y comentarios del profesor. |

> **Nota:** La pantalla de inicio de sesión (`/`) incluye botones de **Acceso Rápido (1 Clic)** para alternar entre el Maestro y el Estudiante sin tener que escribir las credenciales manualmente.

---

## 🚀 Características Principales

- **Gestión de Estudiantes**: Alta, baja y consulta de alumnos con cálculo automático de entregas y promedios individuales.
- **Gestión de Asignaciones**: Creación y eliminación de tareas con descripción detallada y fechas límite.
- **Subida de Tareas en PDF**: Drag & drop interactivo con validación estricta de formato `.pdf` (máximo 15MB).
- **Visor de PDF Integrado**: Visualización directa del archivo PDF entregado dentro de un modal interactivo en el navegador sin descargas obligatorias.
- **Calificación y Retroalimentación**: Asignación de nota numérica (0 - 100) y comentarios formativos para el alumno.
- **Persistencia con SQLite**: Almacenamiento local ligero y veloz con `node:sqlite`, sin configuraciones complejas de base de datos ni dependencias nativas pesadas.

---

## 📂 Estructura del Repositorio

```text
├── data/                    # Archivo de base de datos SQLite (school.db)
├── uploads/                 # Almacenamiento de archivos PDF subidos
├── src/
│   ├── app/
│   │   ├── api/             # Rutas API (auth, students, assignments, submissions, files)
│   │   ├── dashboard/       # Paneles para maestro y estudiante
│   │   ├── globals.css      # Directivas de Tailwind CSS
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Pantalla de Login con acceso rápido
│   └── lib/
│       ├── auth.ts          # Credenciales genéricas y utilidades de sesión
│       └── db.ts            # Conexión SQLite y creación de tablas
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛠️ Ejecución

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:3000
   ```
