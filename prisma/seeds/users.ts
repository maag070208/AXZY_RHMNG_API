import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const usersSeed = async (prisma: PrismaClient) => {
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    {
      username: "admin",
      name: "Admin",
      lastName: "System",
      password: passwordHash,
      role: "ADMIN" as any,
      status: "ACTIVE" as any
    },
    {
      username: "asael",
      name: "Asael",
      lastName: "Dev",
      password: passwordHash,
      role: "ADMIN" as any,
      status: "ACTIVE" as any
    },
    {
      username: "eliseo",
      name: "Eliseo",
      lastName: "Dev",
      password: passwordHash,
      role: "ADMIN" as any,
      status: "ACTIVE" as any
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        password: user.password,
        role: user.role,
        status: user.status
      },
      create: user,
    });
  }

  console.log("✅ Users have been seeded");
};
