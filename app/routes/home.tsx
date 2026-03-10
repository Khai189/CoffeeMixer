import type { Route } from "./+types/home";
import { prisma } from "../lib/db.server";
import { getUserId } from "../lib/session.server";
import { redirect, Form, useNavigation } from "react-router";
import CoffeeCard from "../components/CoffeeCard";
import { getRecommendationsForUser, getTrendingRecipes } from "../lib/recommendations.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CoffeeMixer — Discover Your Perfect Brew" },
    {
      name: "description",
      content:
        "Get personalized coffee recommendations and share your favorite brews",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") || "all";
  const userId = await getUserId(request);

  // Get personalized recommendations or trending recipes
  let recommendations = [];
  if (userId) {
    recommendations = await getRecommendationsForUser(userId, 6);
  } else {
    recommendations = await getTrendingRecipes(6);
  }

  // Build the where clause based on filter
  let where: Record<string, unknown> = {};
  if (filter === "espresso") where.brewMethod = "Espresso";
  else if (filter === "cold-brew") where.brewMethod = "Cold Brew";
  else if (filter === "easy") where.difficulty = "easy";

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { likes: true, savedBy: true } },
    },
    orderBy:
      filter === "popular"
        ? { likes: { _count: "desc" } }
        : { createdAt: "desc" },
  });

  // If user is logged in, get their likes and saves for highlighting
  let userLikes: string[] = [];
  let userSaves: string[] = [];

  if (userId) {
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        select: { recipeId: true },
      }),
      prisma.savedRecipe.findMany({
        where: { userId },
        select: { recipeId: true },
      }),
    ]);
    userLikes = likes.map((l) => l.recipeId);
    userSaves = saves.map((s) => s.recipeId);
  }

  return { recipes, userLikes, userSaves, filter, userId, recommendations };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const recipeId = formData.get("recipeId") as string;

  if (!recipeId) return { error: "Missing recipe ID" };

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

const filterTabs = [
  { label: "All Recipes", value: "all" },
  { label: "Popular", value: "popular" },
  { label: "Espresso", value: "espresso" },
  { label: "Cold Brew", value: "cold-brew" },
  { label: "Easy", value: "easy" },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { recipes, userLikes, userSaves, filter, userId, recommendations } = loaderData;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero */}
      <section className="text-center mb-8 sm:mb-12" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Discover Your Perfect Brew <span aria-hidden="true">☕</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto px-4">
          Explore coffee recipes, share your custom mixes, and get personalized
          recommendations.
        </p>
      </section>

      {/* For You / Trending Section */}
      {recommendations.length > 0 && (
        <section className="mb-8 sm:mb-12" aria-labelledby="recommendations-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recommendations-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {userId ? "For You ✨" : "Trending Now 🔥"}
            </h2>
            {userId && (
              <a
                href="/profile"
                className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 focus:outline-none focus:underline"
              >
                Update preferences
              </a>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {userId
              ? "Personalized recommendations based on your coffee preferences"
              : "Popular recipes loved by the CoffeeMixer community"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((recipe) => (
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
        </section>
      )}

      {/* Filter tabs */}
      <nav className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide" aria-label="Recipe filters">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.value;
          return (
            <a
              key={tab.value}
              href={tab.value === "all" ? "/" : `/?filter=${tab.value}`}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${
                isActive
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </a>
          );
        })}
      </nav>

      {/* Feed */}
      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4" aria-hidden="true">☕</p>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No recipes found for this filter.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-amber-600 hover:text-amber-700 focus:outline-none focus:underline font-medium"
          >
            View all recipes →
          </a>
        </div>
      ) : (
        <section aria-label={`${recipes.length} recipes`}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {filter === "all" && "All Recipes"}
            {filter === "popular" && "Popular Recipes"}
            {filter === "espresso" && "Espresso Recipes"}
            {filter === "cold-brew" && "Cold Brew Recipes"}
            {filter === "easy" && "Easy Recipes"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
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
        </section>
      )}
    </main>
  );
}
