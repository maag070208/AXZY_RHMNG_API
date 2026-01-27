import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export const securitySeed = async (prisma: PrismaClient) => {
  await createAdditionalUsers(prisma);
};


const createAdditionalUsers = async (prisma: PrismaClient) => {
  const password = await bcrypt.hash("123456", 10);

  // Get Schedules
  const matutino = await prisma.schedule.findUnique({ where: { name: "Matutino" } });
  const vespertino = await prisma.schedule.findUnique({ where: { name: "Vespertino" } });
  const nocturno = await prisma.schedule.findUnique({ where: { name: "Nocturno" } });

  // Victor -> GUARD (Matutino)
  await prisma.user.upsert({
    where: { username: "victor" },
    update: { scheduleId: matutino?.id },
    create: {
      name: "Victor",
      lastName: "Guardia",
      username: "victor",
      password,
      role: Role.GUARD,
      scheduleId: matutino?.id,
    },
  });

  // Ricardo -> SHIFT_GUARD (Vespertino)
  await prisma.user.upsert({
    where: { username: "ricardo" },
    update: { scheduleId: vespertino?.id },
    create: {
      name: "Ricardo",
      lastName: "Shift",
      username: "ricardo",
      password,
      role: Role.SHIFT_GUARD,
      scheduleId: vespertino?.id,
    },
  });

  // Isabel -> ADMIN
  await prisma.user.upsert({
    where: { username: "isabel" },
    update: {},
    create: {
      name: "Isabel",
      lastName: "Admin",
      username: "isabel",
      password,
      role: Role.ADMIN,
    },
  });

  // Catalina -> ADMIN
  await prisma.user.upsert({
    where: { username: "catalina" },
    update: {},
    create: {
      name: "Catalina",
      lastName: "Admin",
      username: "catalina",
      password,
      role: Role.ADMIN,
    },
  });

  // Martin -> GUARD (Matutino)
  await prisma.user.upsert({
    where: { username: "martin" },
    update: { scheduleId: matutino?.id },
    create: {
      name: "Martin",
      lastName: "Guardia",
      username: "martin",
      password,
      role: Role.GUARD,
      scheduleId: matutino?.id,
    },
  });

  // Marco -> GUARD (Vespertino)
  await prisma.user.upsert({
    where: { username: "marco" },
    update: { scheduleId: vespertino?.id },
    create: {
      name: "Marco",
      lastName: "Guardia",
      username: "marco",
      password,
      role: Role.GUARD,
      scheduleId: vespertino?.id,
    },
  });

  // Asael -> GUARD (Nocturno)
  await prisma.user.upsert({
    where: { username: "asael" },
    update: { scheduleId: nocturno?.id },
    create: {
      name: "Asael",
      lastName: "Guardia",
      username: "asael",
      password,
      role: Role.GUARD,
      scheduleId: nocturno?.id,
    },
  });
};
