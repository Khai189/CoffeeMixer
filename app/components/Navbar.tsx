import { Form, Link, useLocation } from "react-router";
import { useState } from "react";

interface NavbarProps {
    user: {
        id: string;
        name: string;
        email: string;
        profile?: { pfpUrl?: string };
    } | null;
}

export default function Navbar({ user }: NavbarProps) {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) =>
        location.pathname === path
            ? "text-amber-600 dark:text-amber-400 font-semibold"
            : "text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400";

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800" aria-label="Main navigation">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2" aria-label="CoffeeMixer home">
                    <div className="bg-white rounded-full p-0.5 shadow-sm">
                        <img src="/favicon.ico" alt="" className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        CoffeeMixer
                    </span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1 text-sm font-medium">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive("/")}`}
                        aria-current={location.pathname === "/" ? "page" : undefined}
                    >
                        Home
                    </Link>
                    <Link
                        to="/feed"
                        className={`px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isActive("/feed")}`}
                        aria-current={location.pathname === "/feed" ? "page" : undefined}
                    >
                        Feed
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

                {/* Right side — Auth + Mobile Menu */}
                <div className="flex items-center gap-2">
                    {/* Mobile menu button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        aria-expanded={mobileMenuOpen}
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <>
                            <Link
                                to="/profile"
                                className="w-9 h-9 rounded-full bg-linear-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center text-sm font-bold text-white shadow-sm hover:ring-2 hover:ring-amber-400 outline-none transition-all"
                                aria-label={`Profile for ${user.name}`}
                            >
                                {user.profile?.pfpUrl ? (
                                    <img
                                        src={user.profile.pfpUrl}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    user.name.charAt(0).toUpperCase()
                                )}
                            </Link>
                            <Form method="post" action="/logout" className="hidden md:block">
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
                                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 focus:outline-none focus:text-amber-600 transition-colors rounded-lg"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/signup"
                                className="px-3 py-2 text-sm font-medium rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <div className="px-4 py-3 space-y-1">
                        <Link
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2.5 rounded-lg text-base font-medium ${isActive("/")}`}
                            aria-current={location.pathname === "/" ? "page" : undefined}
                        >
                            Home
                        </Link>
                        <Link
                            to="/feed"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2.5 rounded-lg text-base font-medium ${isActive("/feed")}`}
                            aria-current={location.pathname === "/feed" ? "page" : undefined}
                        >
                            Feed
                        </Link>
                        {user && (
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2.5 rounded-lg text-base font-medium ${isActive("/dashboard")}`}
                                    aria-current={location.pathname === "/dashboard" ? "page" : undefined}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2.5 rounded-lg text-base font-medium ${isActive("/profile")}`}
                                    aria-current={location.pathname === "/profile" ? "page" : undefined}
                                >
                                    Profile
                                </Link>
                                <Form method="post" action="/logout">
                                    <button
                                        type="submit"
                                        className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                    >
                                        Log out
                                    </button>
                                </Form>
                            </>
                        )}
                        {!user && (
                            <div className="pt-3 space-y-2">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
