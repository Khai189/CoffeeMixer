import type { Route } from "./+types/dashboard";
import { prisma } from "../lib/db.server";
import { requireUserId } from "../lib/session.server";
import { Link } from "react-router";
import CoffeeCard from "../components/CoffeeCard";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Dashboard | CoffeeMixer" },
        { name: "description", content: "Your personal coffee dashboard" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await requireUserId(request);

    const [user, savedRecipes, myRecipes, likedRecipes, savedCount, likeCount, recipeCount] =
        await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            }),
            prisma.savedRecipe.findMany({
                where: { userId },
                include: {
                    recipe: {
                        include: {
                            author: { select: { id: true, name: true } },
                            _count: { select: { likes: true, savedBy: true } },
                        },
                    },
                },
                orderBy: { savedAt: "desc" },
                take: 4,
            }),
            prisma.recipe.findMany({
                where: { authorId: userId },
                include: {
                    author: { select: { id: true, name: true } },
                    _count: { select: { likes: true, savedBy: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 4,
            }),
            prisma.like.findMany({
                where: { userId },
                select: { recipeId: true },
            }),
            prisma.savedRecipe.count({ where: { userId } }),
            prisma.like.count({ where: { userId } }),
            prisma.recipe.count({ where: { authorId: userId } }),
        ]);

    const userLikes = likedRecipes.map((l) => l.recipeId);
    const userSaves = savedRecipes.map((s) => s.recipeId);

    return {
        userName: user?.name || "Coffee Lover",
        savedRecipes: savedRecipes.map((sr) => sr.recipe),
        myRecipes,
        userLikes,
        userSaves,
        stats: { saved: savedCount, likes: likeCount, recipes: recipeCount },
    };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
    const { userName, savedRecipes, myRecipes, userLikes, userSaves, stats } = loaderData;

    return (
        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
            {/* Greeting + Create CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {userName} <span aria-hidden="true">☕</span>
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Here's what's brewing in your world.</p>
                </div>
                <Link
                    to="/recipe/new"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 shadow-md hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                    Create Recipe
                </Link>
            </div>

            {/* Stats */}
            <section aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="sr-only">Your stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
                        <p className="text-3xl font-bold text-amber-600" aria-label={`${stats.recipes} recipes created`}>{stats.recipes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recipes Created</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
                        <p className="text-3xl font-bold text-red-500" aria-label={`${stats.likes} recipes liked`}>{stats.likes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recipes Liked</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center">
                        <p className="text-3xl font-bold text-blue-500" aria-label={`${stats.saved} recipes saved`}>{stats.saved}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Recipes Saved</p>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3" role="group" aria-label="Quick actions">
                <Link
                    to="/"
                    className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors"
                >
                    Browse Feed
                </Link>
                <Link
                    to="/profile"
                    className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors"
                >
                    Edit Preferences
                </Link>
            </div>

            {/* Saved Recipes */}
            <section aria-labelledby="saved-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="saved-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        <span aria-hidden="true">🔖</span> Saved Recipes
                    </h2>
                    {stats.saved > 4 && (
                        <span className="text-sm text-gray-500">Showing latest 4 of {stats.saved}</span>
                    )}
                </div>
                {savedRecipes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No saved recipes yet.</p>
                        <Link to="/" className="mt-3 inline-block text-amber-600 hover:text-amber-700 focus:outline-none focus:underline font-medium">
                            Browse the feed and bookmark ones you love →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {savedRecipes.map((recipe) => (
                            <CoffeeCard
                                key={recipe.id}
                                id={recipe.id}
                                name={recipe.name}
                                description={recipe.description || ""}
                                brewMethod={recipe.brewMethod}
                                difficulty={recipe.difficulty as "easy" | "medium" | "hard"}
                                ingredients={recipe.ingredients}
                                author={recipe.author?.name || "CoffeeMixer"}
                                likes={recipe._count.likes}
                                liked={userLikes.includes(recipe.id)}
                                saved={userSaves.includes(recipe.id)}
                                imageUrl={recipe.imageUrl}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* My Recipes */}
            <section aria-labelledby="my-recipes-heading">
                <div className="flex items-center justify-between mb-4">
                    <h2 id="my-recipes-heading" className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        <span aria-hidden="true">📝</span> My Recipes
                    </h2>
                    {stats.recipes > 4 && (
                        <span className="text-sm text-gray-500">Showing latest 4 of {stats.recipes}</span>
                    )}
                </div>
                {myRecipes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">You haven't created any recipes yet.</p>
                        <Link to="/recipe/new" className="mt-3 inline-block text-amber-600 hover:text-amber-700 focus:outline-none focus:underline font-medium">
                            Create your first recipe →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myRecipes.map((recipe) => (
                            <CoffeeCard
                                key={recipe.id}
                                id={recipe.id}
                                name={recipe.name}
                                description={recipe.description || ""}
                                brewMethod={recipe.brewMethod}
                                difficulty={recipe.difficulty as "easy" | "medium" | "hard"}
                                ingredients={recipe.ingredients}
                                author={recipe.author?.name || "You"}
                                likes={recipe._count.likes}
                                liked={userLikes.includes(recipe.id)}
                                saved={userSaves.includes(recipe.id)}
                                imageUrl={recipe.imageUrl}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
