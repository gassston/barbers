import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireRole } from "../../plugins/auth.js";
import { auth } from "../../lib/auth.js";

const workingHoursSchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().default(true),
  }),
);

const updateStaffSchema = z.object({
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  acceptsOnlineBooking: z.boolean().optional(),
  commissionPct: z.number().min(0).max(100).optional(),
});

const timeOffSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().max(200).optional(),
});

const inviteStaffSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).default([]),
  serviceIds: z.array(z.string().min(1)).default([]),
});

export async function adminStaffManagementRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/admin/staff-management — list all staff with stats
  app.get("/admin/staff-management", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const staffList = await prisma.staffProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
        staffServices: { include: { service: { select: { id: true, name: true } } } },
        workingHours: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        _count: {
          select: {
            appointments: true,
            timeOff: { where: { approved: false } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    // Appointment stats for this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthStats = await prisma.appointment.groupBy({
      by: ["staffId", "status"],
      where: { startAt: { gte: monthStart }, staffId: { in: staffList.map((s) => s.id) } },
      _count: true,
    });

    const statsMap: Record<string, Record<string, number>> = {};
    for (const row of monthStats) {
      statsMap[row.staffId] ??= {};
      statsMap[row.staffId][row.status] = row._count;
    }

    return reply.send(
      staffList.map((s) => ({
        ...s,
        monthStats: statsMap[s.id] ?? {},
      })),
    );
  });

  // GET /api/v1/admin/staff-management/:id — single staff detail
  app.get("/admin/staff-management/:id", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };

    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
        staffServices: { include: { service: true } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        timeOff: { orderBy: { date: "desc" }, take: 20 },
      },
    });

    if (!staff) return reply.status(404).send({ error: "Not found" });
    return reply.send(staff);
  });

  // POST /api/v1/admin/staff-management — invite / create new staff member
  app.post("/admin/staff-management", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const parsed = inviteStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { name, email, password, phone, bio, specialties, serviceIds } = parsed.data;

    // Create user via Better Auth
    let user: Awaited<ReturnType<typeof auth.api.signUpEmail>>["user"];
    try {
      const result = await auth.api.signUpEmail({ body: { email, password, name } });
      user = result.user;
    } catch (err: any) {
      const message = err?.body?.message ?? err?.message ?? "Error al crear el usuario";
      return reply.status(err?.statusCode ?? 422).send({ error: message });
    }

    // Set role + phone
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "STAFF", phone, emailVerified: true },
    });

    // Create staff profile
    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: user.id,
        bio,
        specialties,
        workingHours: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "18:00",
          })),
        },
        staffServices: serviceIds.length
          ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
          : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        workingHours: true,
      },
    });

    return reply.status(201).send(staffProfile);
  });

  // DELETE /api/v1/admin/staff-management/:id — delete staff + user
  app.delete("/admin/staff-management/:id", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };

    const staffProfile = await prisma.staffProfile.findUnique({
      where: { id },
      select: { userId: true, _count: { select: { appointments: true } } },
    });

    if (!staffProfile) {
      return reply.status(404).send({ error: "Profesional no encontrado" });
    }

    if (staffProfile._count.appointments > 0) {
      return reply.status(409).send({
        error: "No se puede eliminar un profesional con turnos registrados",
      });
    }

    // Deleting the user cascades to StaffProfile, WorkingHours, StaffService,
    // TimeOff, Sessions, and Accounts.
    await prisma.user.delete({ where: { id: staffProfile.userId } });

    return reply.status(204).send();
  });

  // PATCH /api/v1/admin/staff-management/:id — update profile
  app.patch("/admin/staff-management/:id", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const updated = await prisma.staffProfile.update({
      where: { id },
      data: {
        ...parsed.data,
        instagramUrl: parsed.data.instagramUrl || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return reply.send(updated);
  });

  // PUT /api/v1/admin/staff-management/:id/working-hours — replace all working hours
  app.put("/admin/staff-management/:id/working-hours", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = workingHoursSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    await prisma.$transaction([
      prisma.workingHours.deleteMany({ where: { staffId: id } }),
      prisma.workingHours.createMany({
        data: parsed.data.map((h) => ({ ...h, staffId: id })),
      }),
    ]);

    const hours = await prisma.workingHours.findMany({
      where: { staffId: id },
      orderBy: { dayOfWeek: "asc" },
    });

    return reply.send(hours);
  });

  // PUT /api/v1/admin/staff-management/:id/services — replace services
  app.put("/admin/staff-management/:id/services", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { id } = req.params as { id: string };
    const { serviceIds } = req.body as { serviceIds: string[] };

    if (!Array.isArray(serviceIds)) {
      return reply.status(400).send({ error: "serviceIds must be an array" });
    }

    await prisma.$transaction([
      prisma.staffService.deleteMany({ where: { staffId: id } }),
      prisma.staffService.createMany({
        data: serviceIds.map((serviceId) => ({ staffId: id, serviceId })),
      }),
    ]);

    return reply.send({ ok: true });
  });

  // POST /api/v1/admin/staff-management/:id/time-off — add time-off
  app.post("/admin/staff-management/:id/time-off", async (req, reply) => {
    const session = requireRole(req, reply, "STAFF");
    if (!session) return;

    const { id } = req.params as { id: string };
    const parsed = timeOffSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const userRole = (session.user as any).role as string;
    // Staff can only add their own time-off; admins can add for anyone
    if (userRole !== "ADMIN") {
      const profile = await prisma.staffProfile.findFirst({
        where: { id, userId: session.user.id },
      });
      if (!profile) return reply.status(403).send({ error: "Forbidden" });
    }

    const timeOff = await prisma.timeOff.create({
      data: {
        staffId: id,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        reason: parsed.data.reason,
        approved: userRole === "ADMIN", // auto-approve if admin
      },
    });

    return reply.status(201).send(timeOff);
  });

  // PATCH /api/v1/admin/staff-management/:id/time-off/:timeOffId/approve
  app.patch("/admin/staff-management/:id/time-off/:timeOffId/approve", async (req, reply) => {
    const session = requireRole(req, reply, "ADMIN");
    if (!session) return;

    const { timeOffId } = req.params as { id: string; timeOffId: string };
    const { approved } = req.body as { approved: boolean };

    const timeOff = await prisma.timeOff.update({
      where: { id: timeOffId },
      data: { approved },
    });

    return reply.send(timeOff);
  });
}
