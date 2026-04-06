import type { Route } from "./+types/recipe";
import { prisma } from "../lib/db.server";
import { getUserId } from "../lib/session.server";
import { Link, useFetcher, redirect } from "react-router";
import React, { useState } from "react";
import { checkImage } from "../lib/image.server";
import RecipePlaceholder from "../components/RecipePlaceholder";

export async function loader({ params, request }: Route.LoaderArgs) {
    const userId = await getUserId(request);
    const recipe = await prisma.recipe.findUnique({
        where: { id: params.id },
        include: {
            author: { select: { id: true, name: true, profile: { select: { pfpUrl: true } } } },
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

    const patchedRecipe = {
        ...recipe,
        imageUrl: checkImage(recipe.imageUrl),
        author: {
            ...recipe.author,
            profile: {
                ...recipe.author?.profile,
                pfpUrl: checkImage(recipe.author?.profile?.pfpUrl, "/default-pfp.png"),
            },
        },
    };

    return { recipe: patchedRecipe, liked, saved, userId };
}

export async function action({ request, params }: Route.ActionArgs) {
    const userId = await getUserId(request);
    if (!userId) return redirect("/login");

    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    const recipeId = params.id;

    if (intent === "like") {
        if (!userId) return redirect("/login");
        const existing = await prisma.like.findUnique({
            where: { userId_recipeId: { userId, recipeId } },
        });
        if (existing) {
            await prisma.like.delete({ where: { id: existing.id } });
        } else {
            await prisma.like.create({ data: { userId, recipeId } });
        }
    } else if (intent === "save") {
        if (!userId) return redirect("/login");
        const existing = await prisma.savedRecipe.findUnique({
            where: { userId_recipeId: { userId, recipeId } },
        });
        if (existing) {
            await prisma.savedRecipe.delete({ where: { id: existing.id } });
        } else {
            await prisma.savedRecipe.create({ data: { userId, recipeId } });
        }
    } else if (intent === "edit") {
        const name = (formData.get("name") as string)?.trim();
        const description = (formData.get("description") as string)?.trim();
        const ingredientsRaw = formData.get("ingredients");
        const ingredients = typeof ingredientsRaw === "string"
            ? ingredientsRaw.split(",").map(s => s.trim()).filter(Boolean)
            : Array.isArray(ingredientsRaw)
                ? ingredientsRaw.map(s => String(s).trim()).filter(Boolean)
                : [];
        const instructions = (formData.get("instructions") as string)?.trim();
        const brewMethod = (formData.get("brewMethod") as string)?.trim();
        const difficulty = (formData.get("difficulty") as string)?.trim();
        // Only allow editing your own recipe
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe || recipe.authorId !== userId) {
            return { error: "Not authorized" };
        }
        await prisma.recipe.update({
            where: { id: recipeId },
            data: { name, description, ingredients, instructions, brewMethod, difficulty },
        });
        return { ok: true };
    } else if (intent === "comment") {
        if (!userId) return redirect("/login");
        // ...existing comment logic...
    } else if (intent === "delete") {
        // Only allow deleting your own recipe
        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe || recipe.authorId !== userId) {
            return { error: "Not authorized" };
        }
        await prisma.recipe.delete({ where: { id: recipeId } });
        return redirect("/dashboard"); // Redirect after delete
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
    const { recipe, liked, saved, userId } = loaderData;
    const likeFetcher = useFetcher();
    const saveFetcher = useFetcher();
    const editFetcher = useFetcher();
    const deleteFetcher = useFetcher();

    const isOwner = userId && recipe.author?.id === userId;
    const [showEdit, setShowEdit] = React.useState(false);
    const [imgError, setImgError] = useState(false);
    const showImage = recipe.imageUrl && !imgError;

    const isLiked = likeFetcher.formData ? !liked : liked;
    const isSaved = saveFetcher.formData ? !saved : saved;
    const displayLikes = likeFetcher.formData
        ? (liked ? recipe._count.likes - 1 : recipe._count.likes + 1)
        : recipe._count.likes;

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-600 focus:outline-none focus:text-amber-600 mb-6 transition-colors">
                ← Back to feed
            </Link>

            <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-full h-56 rounded-xl mb-6 overflow-hidden border border-gray-200 dark:border-gray-800">
                        {showImage ? (
                            <img
                                src={recipe.imageUrl!}
                                alt={recipe.name}
                                className="w-full h-full object-cover"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <RecipePlaceholder recipeId={recipe.id} className="w-full h-full" />
                        )}
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {recipe.author?.profile?.pfpUrl ? (
                                <img
                                    src={recipe.author.profile.pfpUrl}
                                    alt={recipe.author.name}
                                    className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                                    onError={e => { e.currentTarget.src = "/default-pfp.png"; }}
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-2xl" aria-hidden="true">
                                    {brewMethodEmoji[recipe.brewMethod] ?? "☕"}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{recipe.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    by {recipe.author?.name || "CoffeeMixer"} · {recipe.brewMethod}
                                </p>
                            </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${difficultyColors[recipe.difficulty] || difficultyColors.medium}`} aria-label={`Difficulty: ${recipe.difficulty}`}>
                            {recipe.difficulty}
                        </span>
                    </div>
                    {recipe.description && (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{recipe.description}</p>
                    )}
                </div>

                {/* Ingredients */}
                <section className="p-6 border-b border-gray-100 dark:border-gray-800" aria-labelledby="ingredients-heading">
                    <h2 id="ingredients-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3"><span aria-hidden="true">🧾</span> Ingredients</h2>
                    <ul className="flex flex-wrap gap-2" role="list">
                        {recipe.ingredients.map((ingredient: string) => (
                            <li key={ingredient} className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium">
                                {ingredient}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Instructions */}
                <section className="p-6 border-b border-gray-100 dark:border-gray-800" aria-labelledby="instructions-heading">
                    <h2 id="instructions-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3"><span aria-hidden="true">📝</span> Instructions</h2>
                    <ol className="space-y-3" role="list">
                        {recipe.instructions.split("\n").map((step: string, i: number) => (
                            <li key={i} className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300" aria-hidden="true">
                                    {i + 1}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 pt-0.5">{step.replace(/^\d+\.\s*/, "")}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Actions */}
                <div className="p-6 flex items-center gap-4">
                    <likeFetcher.Form method="post" className="outline-none" tabIndex={-1}>
                        <input type="hidden" name="intent" value="like" />
                        <button
                            type="submit"
                            aria-label={isLiked ? `Unlike ${recipe.name} (${displayLikes} likes)` : `Like ${recipe.name} (${displayLikes} likes)`}
                            aria-pressed={isLiked}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors outline-none ${isLiked ? "bg-red-50 dark:bg-red-950 text-red-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            {displayLikes} {displayLikes === 1 ? "Like" : "Likes"}
                        </button>
                    </likeFetcher.Form>
                    <saveFetcher.Form method="post" className="outline-none" tabIndex={-1}>
                        <input type="hidden" name="intent" value="save" />
                        <button
                            type="submit"
                            aria-label={isSaved ? `Unsave ${recipe.name}` : `Save ${recipe.name}`}
                            aria-pressed={isSaved}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors outline-none ${isSaved ? "bg-amber-50 dark:bg-amber-950 text-amber-600" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950 hover:text-amber-600"}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    </saveFetcher.Form>
                    {isOwner && (
                        <>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors outline-none"
                                onClick={() => setShowEdit(true)}
                            >
                                Edit
                            </button>
                            <deleteFetcher.Form method="post" className="outline-none" tabIndex={-1}>
                                <input type="hidden" name="intent" value="delete" />
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl font-medium bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 transition-colors outline-none"
                                    aria-label="Delete recipe"
                                    onClick={e => { if (!window.confirm("Delete this recipe?")) e.preventDefault(); }}
                                >
                                    Delete
                                </button>
                            </deleteFetcher.Form>
                        </>
                    )}
                </div>

                {/* Edit Modal */}
                {isOwner && showEdit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <editFetcher.Form method="post" className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 w-full max-w-lg relative">
                            <input type="hidden" name="intent" value="edit" />
                            <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => setShowEdit(false)} aria-label="Close">✕</button>
                            <h2 className="text-xl font-bold mb-6">Edit Recipe</h2>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input name="name" defaultValue={recipe.name} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea name="description" defaultValue={recipe.description ? recipe.description : "No description could be found"} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" rows={3} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Ingredients (comma separated)</label>
                                <input
                                    name="ingredients"
                                    defaultValue={Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : typeof recipe.ingredients === "string" ? recipe.ingredients : ""}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Instructions</label>
                                <textarea name="instructions" defaultValue={recipe.instructions} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" rows={5} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Brew Method</label>
                                <input name="brewMethod" defaultValue={recipe.brewMethod} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white" />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Difficulty</label>
                                <select name="difficulty" defaultValue={recipe.difficulty} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white">
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save Changes</button>
                        </editFetcher.Form>
                    </div>
                )}
            </article>
        </main>
    );
}