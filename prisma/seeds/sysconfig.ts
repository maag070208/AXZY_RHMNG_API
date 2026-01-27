import { PrismaClient } from "@prisma/client";

export const sysConfigSeed = async (prisma: PrismaClient) => {
  await prisma.sysConfig.upsert({
    where: { key: "INCIDENT_EMAIL" },
    update: { value: "maag070208@gmail.com|asael070208@gmail.com" },
    create: {
      key: "INCIDENT_EMAIL",
      value: "maag070208@gmail.com|asael070208@gmail.com",
    },
  });

  console.log("Seeding SysConfig... [DONE]");
};
