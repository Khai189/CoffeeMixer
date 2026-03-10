import { Form, Link, useLocation } from "react-router";

interface NavbarProps {
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export default function Navbar({ user }: NavbarProps) {
    const location = useLocation();

    const isActive = (path: string) =>
        location.pathname === path
            ? "text-amber-600 dark:text-amber-400 font-semibold"
            : "text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400";

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800" aria-label="Main navigation">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2" aria-label="CoffeeMixer home">
                    <span className="text-2xl" aria-hidden="true">☕</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        CoffeeMixer
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="hidden sm:flex items-center gap-1 text-sm font-medium">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive("/")}`}
                        aria-current={location.pathname === "/" ? "page" : undefined}
                    >
                        Home
                    </Link>
                    {user && (
                        <Link
                            to="/dashboard"
                            className={`px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive("/dashboard")}`}
                            aria-current={location.pathname === "/dashboard" ? "page" : undefined}
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Right side — Auth */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                to="/profile"
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center text-sm font-bold text-white shadow-sm hover:ring-2 hover:ring-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-all"
                                aria-label={`Profile for ${user.name}`}
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </Link>
                            <Form method="post" action="/logout">
                                <button
                                    type="submit"
                                    className="text-sm text-gray-500 hover:text-red-500 focus:outline-none focus:text-red-500 transition-colors px-2 py-1 rounded-lg"
                                    aria-label="Log out"
                                >
                                    Log out
                                </button>
                            </Form>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 focus:outline-none focus:text-amber-600 transition-colors rounded-lg"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 text-sm font-medium rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
