import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/signup";
import { signup } from "~/lib/auth.server";
import { getUserId } from "~/lib/session.server";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Sign Up | CoffeeMixer" },
        { name: "description", content: "Create your CoffeeMixer account" },
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
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    // Validation
    if (!name || !email || !password) {
        return { error: "All fields are required." };
    }
    if (password.length < 6) {
        return { error: "Password must be at least 6 characters." };
    }
    if (password !== confirmPassword) {
        return { error: "Passwords don't match." };
    }

    const result = await signup({ name, email, password });

    if (result && "error" in result) {
        return result;
    }

    return result;
}

export default function SignupPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                {/* Header */}
                <div className="text-center">
                    <span className="text-5xl">☕</span>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                        Join CoffeeMixer
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Create an account to discover your perfect brew
                    </p>
                </div>

                {/* Form */}
                <Form method="post" className="space-y-5">
                    {actionData?.error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
                            {actionData.error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="Your name"
                        />
                    </div>

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
                            autoComplete="new-password"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                    >
                        {isSubmitting ? "Creating account..." : "Sign Up"}
                    </button>
                </Form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-amber-600 hover:text-amber-500 font-medium">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
