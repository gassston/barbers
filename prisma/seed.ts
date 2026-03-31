import { PrismaClient } from "@prisma/client";
import { auth } from "../apps/api/src/lib/auth.js";

const prisma = new PrismaClient();

async function createUser(params: {
  email: string;
  name: string;
  password: string;
  role: "CLIENT" | "STAFF" | "ADMIN";
  phone?: string;
}) {
  // Use Better Auth API to create user (handles password hashing + Account record)
  const { user } = await auth.api.signUpEmail({
    body: {
      email: params.email,
      password: params.password,
      name: params.name,
    },
  });

  // Update extra fields not handled by Better Auth sign-up
  return prisma.user.update({
    where: { id: user.id },
    data: {
      role: params.role,
      phone: params.phone,
      emailVerified: true,
    },
  });
}

async function main() {
  console.log("Seeding database...");

  // Admin
  const admin = await createUser({
    email: "admin@barbers.dev",
    name: "Admin",
    password: "admin123",
    role: "ADMIN",
  });

  // Staff 1
  const carlos = await createUser({
    email: "carlos@barbers.dev",
    name: "Carlos Pérez",
    password: "staff123",
    role: "STAFF",
    phone: "+5492611234567",
  });

  const carlosProfile = await prisma.staffProfile.create({
    data: {
      userId: carlos.id,
      bio: "Especialista en cortes clásicos y fade.",
      specialties: ["fade", "corte clásico", "barba"],
      acceptsOnlineBooking: true,
      workingHours: {
        create: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
          { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
          { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
          { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
          { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
          { dayOfWeek: 6, startTime: "09:00", endTime: "14:00" },
        ],
      },
    },
  });

  // Staff 2
  const lucia = await createUser({
    email: "lucia@barbers.dev",
    name: "Lucía González",
    password: "staff123",
    role: "STAFF",
    phone: "+5492617654321",
  });

  const luciaProfile = await prisma.staffProfile.create({
    data: {
      userId: lucia.id,
      bio: "Cortes modernos y colorimetría.",
      specialties: ["colorimetría", "balayage", "corte moderno"],
      acceptsOnlineBooking: true,
      workingHours: {
        create: [
          { dayOfWeek: 2, startTime: "10:00", endTime: "19:00" },
          { dayOfWeek: 3, startTime: "10:00", endTime: "19:00" },
          { dayOfWeek: 4, startTime: "10:00", endTime: "19:00" },
          { dayOfWeek: 5, startTime: "10:00", endTime: "19:00" },
          { dayOfWeek: 6, startTime: "10:00", endTime: "15:00" },
        ],
      },
    },
  });

  // Services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: "srv-corte-caballero" },
      update: {},
      create: {
        id: "srv-corte-caballero",
        name: "Corte de caballero",
        description: "Corte clásico con tijera o máquina.",
        durationMinutes: 30,
        price: 3500,
        category: "Corte",
      },
    }),
    prisma.service.upsert({
      where: { id: "srv-corte-barba" },
      update: {},
      create: {
        id: "srv-corte-barba",
        name: "Corte + Barba",
        description: "Corte de cabello y arreglo de barba.",
        durationMinutes: 50,
        price: 5500,
        category: "Corte",
      },
    }),
    prisma.service.upsert({
      where: { id: "srv-fade" },
      update: {},
      create: {
        id: "srv-fade",
        name: "Fade / Degradé",
        description: "Fade skin, low fade o mid fade.",
        durationMinutes: 45,
        price: 4500,
        category: "Corte",
      },
    }),
    prisma.service.upsert({
      where: { id: "srv-color" },
      update: {},
      create: {
        id: "srv-color",
        name: "Colorimetría",
        description: "Color completo, mechas o balayage.",
        durationMinutes: 120,
        price: 15000,
        category: "Color",
      },
    }),
  ]);

  // Link services to staff
  await prisma.staffService.createMany({
    data: services.slice(0, 3).map((s) => ({
      staffId: carlosProfile.id,
      serviceId: s.id,
    })),
    skipDuplicates: true,
  });

  await prisma.staffService.createMany({
    data: services.map((s) => ({
      staffId: luciaProfile.id,
      serviceId: s.id,
    })),
    skipDuplicates: true,
  });

  // Demo client
  const cliente = await createUser({
    email: "cliente@barbers.dev",
    name: "Juan Demo",
    password: "client123",
    role: "CLIENT",
    phone: "+5492619876543",
  });

  await prisma.clientProfile.create({
    data: {
      userId: cliente.id,
      preferredStaffId: carlosProfile.id,
      loyaltyPoints: 120,
      totalVisits: 4,
    },
  });

  console.log("\nSeed completed.");
  console.log("  Admin:  admin@barbers.dev / admin123");
  console.log("  Staff:  carlos@barbers.dev / staff123");
  console.log("  Staff:  lucia@barbers.dev / staff123");
  console.log("  Client: cliente@barbers.dev / client123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
