import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
    const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

let prisma: PrismaClient;

declare global {
    var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances in development (hot reload creates new connections)
if (process.env.NODE_ENV === "production") {
    prisma = createPrismaClient();
} else {
    if (!global.__prisma) {
        global.__prisma = createPrismaClient();
    }
    prisma = global.__prisma;
}

export { prisma };
