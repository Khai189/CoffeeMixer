import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
    const connectionString = process.env.DIRECT_DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString, max: 10 });
    return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

declare global {
    var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
    prisma = createPrismaClient();
} else {
    if (!global.__prisma) {
        global.__prisma = createPrismaClient();
    }
    prisma = global.__prisma;
}

export { prisma };
