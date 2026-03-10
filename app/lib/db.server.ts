import { PrismaClient } from "../../generated/prisma/client";

function createPrismaClient() {
    return new PrismaClient({
        accelerateUrl: process.env.DATABASE_URL!,
    });
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
