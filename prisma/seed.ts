// import { PrismaClient, Prisma } from "@prisma/client"
// import { PrismaPg } from "@prisma/adapter-pg"
// import "dotenv/config"

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL!,
// })

// const prisma = new PrismaClient({ adapter })

// const userData: Prisma.UserCreateInput[] = [
//   {
//     clerkId: "seed_user_1",
//     email: "mark@flowlit.dev",
//     name: "Mark",
//     flows: {
//       create: [
//         { title: "My First Flow", nodes: [], edges: [] },
//         { title: "Onboarding Process", nodes: [], edges: [] },
//       ],
//     },
//   },
// ]

// async function main() {
//   for (const u of userData) {
//     await prisma.user.create({ data: u })
//   }
// }

// main()