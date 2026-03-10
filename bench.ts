import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
    const start = Date.now();
    const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL!, max: 10 });
    console.log("adapter created:", Date.now() - start, "ms");

    const prisma = new PrismaClient({ adapter });
    console.log("client created:", Date.now() - start, "ms");

    const recipes = await prisma.recipe.findMany({
        include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true, savedBy: true } },
        },
    });
    console.log("query done:", Date.now() - start, "ms, found:", recipes.length, "recipes");

    await prisma.$disconnect();
    console.log("total:", Date.now() - start, "ms");
}

main();
