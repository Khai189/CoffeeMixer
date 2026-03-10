import bcrypt from "bcryptjs";
import { prisma } from "./db.server";
import { createUserSession } from "./session.server";

interface SignupParams {
    name: string;
    email: string;
    password: string;
}

interface LoginParams {
    email: string;
    password: string;
}

// Register a new user
export async function signup({ name, email, password }: SignupParams) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return { error: "A user with this email already exists." };
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user and their default profile
    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            profile: {
                create: {
                    sweetnessLevel: 3,
                    strengthLevel: 3,
                },
            },
        },
    });

    return createUserSession(user.id, "/");
}

// Log in an existing user
export async function login({ email, password }: LoginParams) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return { error: "Invalid email or password." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        return { error: "Invalid email or password." };
    }

    return createUserSession(user.id, "/");
}

// Get the full user object by ID
export async function getUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            profile: true,
        },
    });
}
