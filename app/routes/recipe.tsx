import type { Route } from "./+types/recipe";
import { prisma } from "../lib/db.server";
import { getUserId } from "../lib/session.server";
import { Link, useFetcher, redirect } from "react-router";

export async function loader({ params, request }: Route.LoaderArgs) {
    const userId = await getUserId(request);
    const recipe = await prisma.recipe.findUnique({
        where: { id: params.id },
        include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true, savedBy: true } },
        },
    });

    if (!recipe) throw new Response("Recipe not found", { status: 404 });

    let liked = false;
    let saved = false;
    if (userId) {
        const [likeRecord, saveRecord] = await Promise.all([
            prisma.like.findUnique({ where: { userId_recipeId: { userId, recipeId: recipe.id } } }),
            prisma.savedRecipe.findUnique({ where: { userId_recipeId: { userId, recipeId: recipe.id } } }),
        ]);
        liked = !!likeRecord;
        saved = !!saveRecord;
    }

    return { recipe, liked, saved, userId };
}

export async function action({ request, params }: Route.ActionArgs) {
    const userId = await getUserId(request);
    if (!userId) return redirect("/login");

    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    const recipeId = params.id;

    if (intent === "like") {
        const existing = await prisma.like.findUnique({
            where: { userId_recipeId: { userId, recipeId } },
        });
        if (existing) {
            await prisma.like.delete({ where: { id: existing.id } });
        } else {
            await prisma.like.create({ data: { userId, recipeId } });
        }
    } else if (intent === "save") {
        const existing = await prisma.savedRecipe.findUnique({
            where: { userId_recipeId: { userId, recipeId } },
        });
        if (existing) {
            await prisma.savedRecipe.delete({ where: { id: existing.id } });
        } else {
            await prisma.savedRecipe.create({ data: { userId, recipeId } });
        }
    }

    return { ok: true };
}

export function meta({ data }: Route.MetaArgs) {
    return [
        { title: data?.recipe ? `${data.recipe.name} | CoffeeMixer` : "Recipe | CoffeeMixer" },
        { name: "description", content: data?.recipe?.description || "A coffee recipe on CoffeeMixer" },
    ];
}

const brewMethodEmoji: Record<string, string> = {
    Espresso: "☕",
    "French Press": "🫖",
    "Pour Over": "💧",
    "Cold Brew": "🧊",
    AeroPress: "🔄",
    "Moka Pot": "🫗",
};

const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function RecipePage({ loaderData }: Route.ComponentProps) {
    const { recipe, liked, saved } = loaderData;
    const likeFetcher = useFetcher();
    const saveFetcher = useFetcher();

    const isLiked = likeFetcher.formData ? !liked : liked;
    const isSaved = saveFetcher.formData ? !saved : saved;
    const displayLikes = likeFetcher.formData
        ? (liked ? recipe._count.likes - 1 : recipe._count.likes + 1)
        : recipe._count.likes;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 mb-6 transition-colors">
                ← Back to feed
            </Link>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-2xl">
                                {brewMethodEmoji[recipe.brewMethod] ?? "☕"}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    by {recipe.author?.name || "CoffeeMixer"} · {recipe.brewMethod}
                                </p>
                            </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${difficultyColors[recipe.difficulty] || difficultyColors.medium}`}>
                            {recipe.difficulty}
                        </span>
                    </div>
                    {recipe.description && (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{recipe.description}</p>
                    )}
                </div>

                {/* Ingredients */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🧾 Ingredients</h2>
                    <div className="flex flex-wrap gap-2">
                        {recipe.ingredients.map((ingredient: string) => (
                            <span key={ingredient} className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium">
                                {ingredient}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📝 Instructions</h2>
                    <div className="space-y-3">
                        {recipe.instructions.split("\n").map((step: string, i: number) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">
                                    {i + 1}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 pt-0.5">{step.replace(/^\d+\.\s*/, "")}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 flex items-center gap-4">
                    <likeFetcher.Form method="post">
                        <input type="hidden" name="intent" value="like" />
                        <button type="submit" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLiked ? "bg-red-50 dark:bg-red-950 text-red-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            {displayLikes} {displayLikes === 1 ? "Like" : "Likes"}
                        </button>
                    </likeFetcher.Form>
                    <saveFetcher.Form method="post">
                        <input type="hidden" name="intent" value="save" />
                        <button type="submit" className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isSaved ? "bg-amber-50 dark:bg-amber-950 text-amber-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950 hover:text-amber-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    </saveFetcher.Form>
                </div>
            </div>
        </div>
    );
}