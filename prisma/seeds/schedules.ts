import { PrismaClient } from "@prisma/client";

export const schedulesSeed = async (prisma: PrismaClient) => {
  const schedules = [
    {
      name: "Matutino",
      startTime: "07:00",
      endTime: "15:00",
    },
    {
      name: "Vespertino",
      startTime: "15:00",
      endTime: "23:00",
    },
    {
      name: "Nocturno",
      startTime: "23:00",
      endTime: "07:00",
    },
  ];

  for (const schedule of schedules) {
    await prisma.schedule.upsert({
      where: { name: schedule.name },
      update: {},
      create: schedule,
    });
  }
};
