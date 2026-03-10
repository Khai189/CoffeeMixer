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
            ? "text-amber-600 dark:text-amber-400"
            : "text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400";

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl">☕</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        CoffeeMixer
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
                    <Link to="/" className={`transition-colors ${isActive("/")}`}>
                        Home
                    </Link>
                    <Link to="/dashboard" className={`transition-colors ${isActive("/dashboard")}`}>
                        Dashboard
                    </Link>
                    {user && (
                        <Link to="/recipe/new" className={`transition-colors ${isActive("/recipe/new")}`}>
                            + Create
                        </Link>
                    )}
                </div>

                {/* Right side — Auth */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <button className="p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                {/* Bell / notifications icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                </svg>
                            </button>
                            <Link
                                to="/profile"
                                className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-sm font-medium text-amber-700 dark:text-amber-300 hover:ring-2 hover:ring-amber-400 transition-all"
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </Link>
                            <Form method="post" action="/logout">
                                <button
                                    type="submit"
                                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Log out
                                </button>
                            </Form>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
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
