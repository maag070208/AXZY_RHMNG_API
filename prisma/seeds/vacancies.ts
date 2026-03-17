import { PrismaClient } from "@prisma/client";

export const vacanciesSeed = async (prisma: PrismaClient) => {
  console.log("Seeding Vacancies...");

  // Assume an HR user exists, or we leave createdById empty if not necessary for the seed.
  // We can fetch the first RECURSOS_HUMANOS user to attach if available, or just create it as null.
  
  const hrUser = await prisma.user.findFirst({
    where: { role: 'RECURSOS_HUMANOS' }
  });

  const createdById = hrUser ? hrUser.id : undefined;

  const vacancies = [
    {
      title: "Desarrollador Frontend React",
      description: "Buscamos un desarrollador Frontend con experiencia en React.js, Next.js y TailwindCSS para unirse a nuestro equipo de producto.",
      department: "Ingeniería",
      salary: 35000,
      positions: 2,
      status: "ACTIVE" as any,
      createdById,
    },
    {
      title: "Desarrollador Backend Node.js",
      description: "Buscamos un desarrollador Backend con experiencia en Node.js, Express y Prisma ORM.",
      department: "Ingeniería",
      salary: 40000,
      positions: 1,
      status: "ACTIVE" as any,
      createdById,
    },
    {
      title: "Especialista en Recursos Humanos",
      description: "Buscamos un especialista en RRHH para gestionar el ciclo completo de reclutamiento.",
      department: "Recursos Humanos",
      salary: 25000,
      positions: 1,
      status: "ACTIVE" as any,
      createdById,
    },
    {
      title: "Diseñador UX/UI",
      description: "Se busca diseñador enfocado en crear experiencias de usuario intuitivas y atractivas.",
      department: "Diseño",
      salary: 30000,
      positions: 1,
      status: "DRAFT" as any,
      createdById,
    }
  ];

  for (const vacancy of vacancies) {
    const existing = await prisma.vacancy.findFirst({
      where: { title: vacancy.title }
    });
    
    if (!existing) {
      await prisma.vacancy.create({
        data: vacancy
      });
    }
  }

  console.log("Vacancies seeded!");
};
