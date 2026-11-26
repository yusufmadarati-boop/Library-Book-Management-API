import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const initialBooks = [
  {
    id: "1",
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Software Engineering",
    available: true,
  },
  {
    id: "2",
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    genre: "Programming",
    available: false,
  },
  {
    id: "3",
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    genre: "Software Architecture",
    available: true,
  },
];

async function main() {
  console.log("Seeding PostgreSQL database with initial books...");

  for (const book of initialBooks) {
    await prisma.book.upsert({
      where: { id: book.id },
      update: {
        title: book.title,
        author: book.author,
        genre: book.genre,
        available: book.available,
      },
      create: book,
    });
  }

  const count = await prisma.book.count();
  console.log(`Database seeded successfully. Total books in database: ${count}`);
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
