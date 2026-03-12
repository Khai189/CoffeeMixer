import type { Route } from "../+types/user";
import { prisma } from "../lib/db.server";
import { Form } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "User Profile | CoffeeMixer" },
        { name: "description", content: "View another user's profile, feed, and recipes." },
    ];
}

export async function loader({ params }: Route.LoaderArgs) {
    const userId = params.userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });
    if (!user) return { notFound: true };
    const recipes = await prisma.recipe.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        profile: {
            favoriteDrink: user.profile?.favoriteDrink || "",
            brewMethod: user.profile?.brewMethod || "Espresso",
            milkPreference: user.profile?.milkPreference || "None",
            sweetnessLevel: user.profile?.sweetnessLevel ?? 3,
            strengthLevel: user.profile?.strengthLevel ?? 3,
            pfpUrl: user.profile?.pfpUrl || "",
        },
        feed: recipes,
    };
}

export default function UserProfilePage({ loaderData }: Route.ComponentProps) {
    if (loaderData.notFound) {
        return <main className="max-w-2xl mx-auto p-6"><p className="text-center text-gray-500">User not found.</p></main>;
    }
    const { user, profile, feed } = loaderData;
    return (
        <main className="max-w-2xl mx-auto p-6 space-y-8">
            <section className="flex items-center gap-4 mb-8">
                <img
                    src={profile.pfpUrl || "/default-pfp.png"}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    onError={e => { e.currentTarget.src = "/default-pfp.png"; }}
                />
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
            </section>
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6" aria-labelledby="feed-heading">
                <h2 id="feed-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Recipes</h2>
                <div className="grid grid-cols-1 gap-4">
                    {feed.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No recipes yet.</p>
                    ) : (
                        feed.map((recipe: any) => (
                            <div key={recipe.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{recipe.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{recipe.brewMethod}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
