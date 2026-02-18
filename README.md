# Panel de Control — Protección al Consumidor

Dashboard de monitoreo en tiempo real para agentes de IA de protección al consumidor. Muestra métricas clave como usuarios únicos, volumen de consultas, índice de no-conflictividad, gasto acumulado al consumidor y estado de los agentes.

## 📋 Requisitos previos

- **Node.js** v18 o superior — [descargar](https://nodejs.org/)
- **npm** v9 o superior (viene incluido con Node.js)
- **Cuenta de Supabase** con un proyecto creado — [supabase.com](https://supabase.com/)

Para verificar que tenés Node y npm instalados:

```bash
node -v   # debería mostrar v18.x o superior
npm -v    # debería mostrar 9.x o superior
```

---

## 🗂 Estructura del proyecto

```
control-panel/
├── backend/          # API REST — Express + TypeScript + Supabase
├── frontend/         # Dashboard UI — React + Vite + TailwindCSS
├── shared/           # Tipos TypeScript compartidos
└── package.json      # Workspaces (monorepo)
```

---

## 🚀 Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd panel_dashboard/control-panel
```

### 2. Instalar todas las dependencias

Desde la carpeta raíz `control-panel/`, ejecutá **un solo comando** que instala las dependencias del backend, frontend y shared gracias a npm workspaces:

```bash
npm install
```

> Esto instala automáticamente las dependencias de los 3 módulos (`backend`, `frontend`, `shared`).

### 3. Configurar variables de entorno del backend

```bash
cd backend
cp .env.example .env
```

Abrí el archivo `backend/.env` y completá los valores con los datos de tu proyecto en Supabase:

```env
# Base de Datos — Settings → Database → Connection string → URI
SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.TU_PROYECTO.supabase.co:5432/postgres

# Client SDK — Settings → API
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...TU_SERVICE_ROLE_KEY

# Puerto del servidor
PORT=3001
```

**¿Dónde encontrar estos valores?**

1. Ir a tu proyecto en [supabase.com/dashboard](https://supabase.com/dashboard)
2. **SUPABASE_DB_URL**: Settings → Database → Connection string → URI (reemplazar `[YOUR-PASSWORD]`)
3. **SUPABASE_URL**: Settings → API → Project URL
4. **SUPABASE_SERVICE_KEY**: Settings → API → `service_role` key (⚠️ es secreta, no la expongas)

### 4. Volver a la raíz

```bash
cd ..
```

---

## ▶️ Ejecutar el proyecto

Necesitás **dos terminales** abiertas simultáneamente:

**Terminal 1 — Backend (API):**

```bash
npm run dev:backend
```

Deberías ver:

```
✅ Cliente Supabase inicializado correctamente
🟢 Supabase client conectado correctamente
🚀 Backend running at http://localhost:3001
```

**Terminal 2 — Frontend (Dashboard):**

```bash
npm run dev:frontend
```

Deberías ver:

```
VITE v7.x.x  ready in Xms
➜  Local:   http://localhost:5173/
```

### 5. Abrir el dashboard

Abrí tu navegador en **[http://localhost:5173](http://localhost:5173)** 🎉

---

## 🛠 Scripts disponibles

Todos los scripts se ejecutan desde la carpeta raíz `control-panel/`:

| Comando | Descripción |
|---|---|
| `npm install` | Instala dependencias de todos los módulos |
| `npm run dev:backend` | Arranca el servidor backend en modo desarrollo |
| `npm run dev:frontend` | Arranca el frontend en modo desarrollo |

---

## 🧩 Stack tecnológico

### Backend
- **Express** — Servidor HTTP
- **TypeScript** — Tipado estático
- **Supabase JS Client** — Conexión a la base de datos vía HTTPS
- **dotenv** — Variables de entorno
- **nodemon + ts-node** — Hot reload en desarrollo

### Frontend
- **React 19** — Biblioteca UI
- **Vite** — Bundler ultrarrápido
- **TailwindCSS** — Utilidades CSS
- **Recharts** — Gráficos interactivos
- **Framer Motion** — Animaciones declarativas

---

## ❓ Resolución de problemas

### El frontend muestra datos de prueba (mock)

El backend no está corriendo o no es accesible. Verificá que:
1. El backend esté corriendo en la Terminal 1 (`npm run dev:backend`)
2. El puerto 3001 no esté ocupado por otro proceso
3. Las variables de entorno en `.env` estén correctas

### Error `ECONNREFUSED` en el frontend

El frontend no puede comunicarse con el backend. Asegurate de que el backend esté corriendo **antes** de abrir el frontend.

### Error de conexión a Supabase

Si el puerto 5432 está bloqueado por tu red (universidad, oficina), no te preocupes — el proyecto utiliza el **Supabase JS Client** que se conecta por HTTPS (puerto 443), que funciona en cualquier red.
