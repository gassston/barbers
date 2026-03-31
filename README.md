# Barbers

Web app de turnos online para peluquerías y barberías. Permite a los clientes reservar, reagendar y cancelar turnos, y a los administradores gestionar la agenda, el staff y los reportes.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Backend | Fastify 5 + TypeScript |
| Base de datos | PostgreSQL 16 + Prisma 6 |
| Cache / Queue | Redis 7 + BullMQ 5 |
| Auth | Better Auth (email/password, sesiones, roles) |
| Notificaciones | Resend (email) + Twilio (SMS) |
| Storage | MinIO (S3-compatible) |
| Pagos | Mercado Pago (pendiente) |
| Infra dev | Docker Compose |

---

## Estructura del proyecto

Monorepo con npm workspaces.

```
barbers/
├── apps/
│   ├── api/                  # Fastify API (puerto 4000)
│   │   └── src/
│   │       ├── index.ts      # Bootstrap, plugins, registro de rutas
│   │       ├── worker.ts     # Worker BullMQ (reminders)
│   │       ├── config.ts     # Validación de env con Zod
│   │       ├── lib/          # prisma, redis, minio, email, sms, auth
│   │       ├── plugins/      # auth.ts (Better Auth + session middleware)
│   │       ├── jobs/         # Definición de queues BullMQ
│   │       └── routes/
│   │           ├── health/
│   │           ├── availability/   # Slots + SSE stream
│   │           ├── appointments/   # Book / reschedule / cancel
│   │           ├── services/
│   │           ├── staff/
│   │           ├── reviews/
│   │           ├── client/         # Perfil + historial del cliente
│   │           └── admin/
│   │               ├── index.ts         # Agenda + status update
│   │               ├── dashboard.ts     # Overview metrics
│   │               ├── reports.ts       # Revenue / by-service / by-staff
│   │               └── staff-management.ts
│   │
│   └── web/                  # Next.js frontend (puerto 3000)
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # Login, registro
│           │   ├── (public)/       # Booking wizard, menú de servicios
│           │   ├── (client)/       # Dashboard, historial, perfil
│           │   └── (admin)/        # Dashboard, agenda, reportes, staff
│           ├── components/
│           │   ├── booking/        # BookingWizard + 4 steps
│           │   ├── client/         # AppointmentCard, RescheduleModal, ReviewModal
│           │   └── admin/          # ScheduleView, StaffDetailClient
│           ├── lib/
│           │   ├── api.ts          # Cliente HTTP tipado
│           │   └── auth-client.ts  # Better Auth browser client
│           └── middleware.ts       # Protección de rutas /client/* y /admin/*
│
├── packages/
│   └── shared/               # Tipos y schemas Zod compartidos entre apps
│
├── prisma/
│   ├── schema.prisma         # Schema completo (15 modelos)
│   └── seed.ts               # Datos de demo
│
├── scripts/
│   └── setup-dev.sh
│
├── docker-compose.yml
└── .env.example
```

---

## Setup de desarrollo

### Requisitos

- Node.js 22+
- Docker + Docker Compose

### Pasos

```bash
git clone <repo>
cd barbers

# Copia el env y ajusta los valores si es necesario
cp .env.example .env

# Instala dependencias, levanta infraestructura, migra y seedea la DB
bash scripts/setup-dev.sh
```

### Levantar todo con Docker

```bash
docker compose up
```

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| MinIO console | http://localhost:9001 |
| Prisma Studio | `npm run db:studio` |

### Desarrollar localmente (sin Docker para las apps)

```bash
# Solo infraestructura
docker compose up -d postgres redis minio

# Apps en modo watch
npm run dev -w apps/api   # puerto 4000
npm run dev -w apps/web   # puerto 3000
```

### Comandos de base de datos

```bash
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # seed con datos de demo
npm run db:studio    # Prisma Studio en el navegador
```

---

## Credenciales de demo (seed)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@barbers.dev | admin123 |
| Staff | carlos@barbers.dev | staff123 |
| Staff | lucia@barbers.dev | staff123 |
| Cliente | cliente@barbers.dev | client123 |

---

## API — Endpoints

Base: `http://localhost:4000`

### Auth (`/api/auth/*`)

Manejado por Better Auth. Rutas principales:

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-up/email` | Registro |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/session` | Sesión activa |

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/services` | Lista de servicios activos |
| GET | `/api/v1/services/:id` | Detalle de servicio |
| GET | `/api/v1/staff` | Lista de profesionales |
| GET | `/api/v1/staff/:id` | Perfil de profesional |
| GET | `/api/v1/staff/:id/reviews` | Reseñas de un profesional |
| GET | `/api/v1/availability` | Slots disponibles (`?staffId&serviceId&date`) |
| GET | `/api/v1/availability/stream` | SSE de disponibilidad en tiempo real |
| GET | `/health` | Health check (DB + Redis) |

### Cliente (requiere sesión)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/appointments` | Turnos del cliente autenticado |
| POST | `/api/v1/appointments` | Reservar turno |
| GET | `/api/v1/appointments/:id` | Detalle de turno |
| PATCH | `/api/v1/appointments/:id/reschedule` | Reagendar |
| PATCH | `/api/v1/appointments/:id/cancel` | Cancelar |
| POST | `/api/v1/reviews` | Crear reseña (turno COMPLETED) |
| GET | `/api/v1/client/profile` | Perfil + loyalty points + stats |
| PATCH | `/api/v1/client/profile` | Actualizar nombre / teléfono |
| GET | `/api/v1/client/appointments/history` | Historial (completados, cancelados, ausentes) |

### Admin / Staff (requiere rol STAFF o ADMIN)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/admin/dashboard` | KPIs del día y la semana + próximos turnos |
| GET | `/api/v1/admin/schedule` | Agenda diaria/semanal (`?date&view=day\|week&staffId`) |
| PATCH | `/api/v1/admin/appointments/:id/status` | Cambiar estado de turno |
| GET | `/api/v1/admin/reports/revenue` | Revenue agrupado por día/semana (`?from&to&groupBy`) |
| GET | `/api/v1/admin/reports/by-service` | Stats por servicio (`?from&to`) |
| GET | `/api/v1/admin/reports/by-staff` | Stats por profesional (`?from&to`) |
| GET | `/api/v1/admin/staff-management` | Lista de staff con stats del mes |
| POST | `/api/v1/admin/staff-management` | Crear profesional |
| GET | `/api/v1/admin/staff-management/:id` | Detalle de profesional |
| PATCH | `/api/v1/admin/staff-management/:id` | Editar perfil |
| PUT | `/api/v1/admin/staff-management/:id/working-hours` | Reemplazar horarios laborales |
| PUT | `/api/v1/admin/staff-management/:id/services` | Reemplazar servicios asignados |
| POST | `/api/v1/admin/staff-management/:id/time-off` | Agregar franco/ausencia |
| PATCH | `/api/v1/admin/staff-management/:id/time-off/:id/approve` | Aprobar/rechazar franco |

---

## Features implementadas

### Portal del cliente
- Registro y login con email/password
- Wizard de reserva en 4 pasos: servicio → profesional → fecha/hora → confirmar
- Disponibilidad en tiempo real (SSE + Redis pub/sub)
- Dashboard con turnos próximos
- Reagendar con selector de fecha y horarios disponibles
- Cancelar (respeta ventana mínima configurable)
- Historial con opción de dejar reseña (1-5 estrellas + comentario)
- Perfil editable con puntos de fidelidad y estadísticas

### Panel admin
- **Dashboard**: KPIs del día (total, confirmados, completados, ausentes) y de la semana (total, revenue, tasa de ausencia), próximos turnos del día
- **Agenda**: vista diaria y semanal con navegación, filtro por profesional, contadores por estado
- **Reportes**: gráfico de revenue por día/semana, tabla por servicio y por profesional; presets 7d / 30d / 3 meses
- **Gestión de staff**:
  - Lista con stats del mes y francos pendientes
  - Alta de profesional (email/password + servicios + horarios por defecto)
  - Edición de perfil, especialidades, comisión, toggle online
  - Configuración de horarios laborales por día
  - Asignación de servicios
  - Gestión de francos y ausencias (parciales o día completo) con aprobación

### Background jobs
- Reminder de turno por email + SMS programado 24h antes
- Job cancelado/reemplazado automáticamente al reagendar o cancelar

---

## Variables de entorno

Ver [.env.example](.env.example) para la lista completa. Las principales:

```bash
DATABASE_URL=postgresql://barbers:barbers_secret@localhost:5432/barbers_db
REDIS_URL=redis://:redis_secret@localhost:6379
BETTER_AUTH_SECRET=          # string aleatorio de 32+ caracteres
RESEND_API_KEY=              # opcional, para emails
TWILIO_ACCOUNT_SID=          # opcional, para SMS
MP_ACCESS_TOKEN=             # opcional, para pagos
CANCELLATION_HOURS_LIMIT=24  # ventana mínima para cancelar/reagendar
```

---

## Modelo de datos (resumen)

```
User ──┬── StaffProfile ──┬── WorkingHours
       │                  ├── TimeOff
       │                  ├── StaffService ── Service
       │                  └── GalleryPhoto
       │
       └── ClientProfile ──┬── LoyaltyEvent
                           └── Waitlist

Appointment ──┬── User (client)
              ├── StaffProfile
              ├── Service
              ├── Review
              └── LoyaltyEvent

Session / Account / Verification  ← Better Auth
NotificationLog
```

---

## Roadmap

- [ ] Pago de seña con Mercado Pago (Checkout Pro + webhooks)
- [ ] Política de cancelación con retención de seña
- [ ] Waitlist con notificación automática al liberarse un slot
- [ ] Loyalty points: canje en el checkout
- [ ] Galería de fotos antes/después por servicio
- [ ] Google OAuth para clientes
- [ ] App mobile (la API ya es independiente del frontend)
