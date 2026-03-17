import { PrismaClient } from "@prisma/client";
import { sysConfigSeed } from "./seeds/sysconfig";
import { vacanciesSeed } from "./seeds/vacancies";
import { usersSeed } from "./seeds/users";

const prisma = new PrismaClient();

async function main() {
  await sysConfigSeed(prisma);
  await vacanciesSeed(prisma);
  await usersSeed(prisma);
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
