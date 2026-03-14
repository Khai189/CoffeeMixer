import { createCookieSessionStorage, redirect } from "react-router";

// Session storage using a secure HTTP-only cookie
export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "__coffeemixer_session",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
        secrets: [process.env.SESSION_SECRET || "dev-secret-change-in-production"],
        secure: process.env.NODE_ENV === "production",
    },
});

// Get the session from the request
export async function getSession(request: Request) {
    return sessionStorage.getSession(request.headers.get("Cookie"));
}

// Get the logged-in user's ID from the session (or null)
export async function getUserId(request: Request): Promise<string | null> {
    const session = await getSession(request);
    const userId = session.get("userId");
    return typeof userId === "string" ? userId : null;
}

// Require authentication — redirects to /login if not logged in
export async function requireUserId(request: Request): Promise<string> {
    const userId = await getUserId(request);
    if (!userId) {
        throw redirect("/login");
    }
    return userId;
}

// Create a session and redirect (used after login/signup)
export async function createUserSession(userId: string, redirectTo: string) {
    const session = await sessionStorage.getSession();
    session.set("userId", userId);
    return redirect(redirectTo, {
        headers: {
            "Set-Cookie": await sessionStorage.commitSession(session),
        },
    });
}

// Destroy the session and redirect (used for logout)
export async function logout(request: Request) {
    const session = await getSession(request);
    return redirect("/login", {
        headers: {
            "Set-Cookie": await sessionStorage.destroySession(session),
        },
    });
}
