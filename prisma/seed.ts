import { PrismaClient } from "@prisma/client";
import { securitySeed } from "./seeds/security";
import { locationsSeed } from "./seeds/locations";
import { sysConfigSeed } from "./seeds/sysconfig";

import { schedulesSeed } from "./seeds/schedules";

const prisma = new PrismaClient();

async function main() {
  await schedulesSeed(prisma);
  await securitySeed(prisma);
  await locationsSeed(prisma);
  await sysConfigSeed(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
