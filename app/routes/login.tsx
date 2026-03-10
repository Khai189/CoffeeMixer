import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/login";
import { login } from "~/lib/auth.server";
import { getUserId } from "~/lib/session.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Log In | CoffeeMixer" },
        { name: "description", content: "Log in to your CoffeeMixer account" },
    ];
}

// If already logged in, redirect to home
export async function loader({ request }: Route.LoaderArgs) {
    const userId = await getUserId(request);
    if (userId) throw redirect("/");
    return null;
}

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    // Basic validation
    if (!email || !password) {
        return { error: "Email and password are required." };
    }

    const result = await login({ email, password });

    // If login returned an error object, return it to the form
    if (result && "error" in result) {
        return result;
    }

    // Otherwise it's a redirect Response
    return result;
}

export default function LoginPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center">
                    <span className="text-5xl">☕</span>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Log in to your CoffeeMixer account
                    </p>
                </div>

                {/* Form */}
                <Form method="post" className="space-y-5">
                    {actionData?.error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm" role="alert">
                            {actionData.error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative z-50"
                        style={{ pointerEvents: 'auto' }}
                    >
                        {isSubmitting ? "Logging in..." : "Log In"}
                    </button>
                </Form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="text-amber-600 hover:text-amber-500 font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
