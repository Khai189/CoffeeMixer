import { useCallback, useState, useEffect, useRef } from "react";
import type { Route } from "./+types/home";
import { prisma } from "../lib/db.server";
import { getUserId } from "../lib/session.server";
import { redirect, Form, useNavigation, useFetcher } from "react-router";
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
  const searchQuery = url.searchParams.get("search")?.trim() || "";
  const userId = await getUserId(request);

  // Get personalized recommendations or trending recipes
  let recommendations = [];
  if (userId) {
    recommendations = await getRecommendationsForUser(userId, 6);
  } else {
    recommendations = await getTrendingRecipes(6);
  }

  // Only fetch recipes if there's a search query
  let recipes: any[] = [];
  let userLikes: string[] = [];
  let userSaves: string[] = [];

  // Collect all recipe IDs shown
  const allRecipeIds = [
    ...recommendations.map(r => r.id),
    ...(searchQuery ? [] : []), // will be filled below
  ];

  if (searchQuery) {
    const where: any = {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { brewMethod: { contains: searchQuery, mode: "insensitive" } },
        { difficulty: { contains: searchQuery, mode: "insensitive" } },
        { ingredients: { has: searchQuery } },
      ],
    };

    recipes = await prisma.recipe.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, profile: { select: { pfpUrl: true } } } },
        _count: { select: { likes: true, savedBy: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit results
    });
    allRecipeIds.push(...recipes.map(r => r.id));
  }

  // If user is logged in, get their likes and saves for all shown recipes
  if (userId && allRecipeIds.length > 0) {
    const [likes, saves] = await Promise.all([
      prisma.like.findMany({
        where: { userId, recipeId: { in: allRecipeIds } },
        select: { recipeId: true },
      }),
      prisma.savedRecipe.findMany({
        where: { userId, recipeId: { in: allRecipeIds } },
        select: { recipeId: true },
      }),
    ]);
    userLikes = likes.map((l) => l.recipeId);
    userSaves = saves.map((s) => s.recipeId);
  }

  // Utility for robust image fallback (no fs/path, serverless-safe)
  function checkImage(url: string | null | undefined, fallback: string) {
    // If the url is missing, empty, or not a string, fallback
    if (!url || typeof url !== "string" || url.length === 0) return fallback;
    // If the url is for uploads, just return it (let client handle 404)
    return url;
  }

  // Patch recipe and pfp images for recommendations and search results
  const patchedRecommendations = recommendations.map(recipe => {
    let authorPfpUrl = "/default-pfp.png";
    // Defensive: check for profile property and pfpUrl
    if (
      recipe.author &&
      typeof recipe.author === "object" &&
      "profile" in recipe.author &&
      recipe.author.profile &&
      typeof recipe.author.profile === "object" &&
      "pfpUrl" in recipe.author.profile &&
      typeof (recipe.author.profile as any).pfpUrl === "string"
    ) {
      authorPfpUrl = checkImage((recipe.author.profile as any).pfpUrl, "/default-pfp.png");
    }
    return {
      ...recipe,
      imageUrl: checkImage(recipe.imageUrl, "/default-recipe.png"),
      author: {
        ...recipe.author,
        authorPfpUrl,
      },
    };
  });
  const patchedRecipes = recipes.map(recipe => {
    let authorPfpUrl = "/default-pfp.png";
    if (
      recipe.author &&
      typeof recipe.author === "object" &&
      "profile" in recipe.author &&
      recipe.author.profile &&
      typeof recipe.author.profile === "object" &&
      "pfpUrl" in recipe.author.profile &&
      typeof (recipe.author.profile as any).pfpUrl === "string"
    ) {
      authorPfpUrl = checkImage((recipe.author.profile as any).pfpUrl, "/default-pfp.png");
    }
    return {
      ...recipe,
      imageUrl: checkImage(recipe.imageUrl, "/default-recipe.png"),
      author: {
        ...recipe.author,
        authorPfpUrl,
      },
    };
  });

  return {
    recommendations: patchedRecommendations,
    recipes: patchedRecipes,
    userLikes,
    userSaves,
    searchQuery,
    userId,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const recipeId = formData.get("recipeId") as string;

  if (!recipeId) return { error: "Missing recipe ID" };

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
  }

  return { ok: true };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { recipes, userLikes, userSaves, userId, recommendations, searchQuery } = loaderData;
  const [search, setSearch] = useState(searchQuery || "");
  const fetcher = useFetcher();
  const isFirstRun = useRef(true);

  // Callback to reload home feed after like/save
  const handleLikeSave = useCallback(() => {
    // If searching, refresh results. If not, the main loader revalidates automatically.
    // We use the fetcher to reload the current view without a hard page reload.
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetcher.load(`?${params.toString()}`);
  }, [search, fetcher]);

  // Debounced instant search
  useEffect(() => {
    // Prevent double-fetch on initial load
    if (isFirstRun.current) {
        isFirstRun.current = false;
        if (search === (searchQuery || "")) return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      // Use relative URL `?` instead of hardcoded `/home`.
      fetcher.load(`?${params.toString()}`);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  // Use fetcher data if available, else loaderData
  const data = fetcher.data || loaderData;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero */}
      <section className="text-center mb-8 sm:mb-12" aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Discover Your Perfect Brew
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto px-4 mb-6">
          Explore coffee recipes, share your custom mixes, and get personalized
          recommendations.
        </p>

        {/* Search Bar */}
        <Form method="get" className="max-w-2xl mx-auto" onSubmit={e => e.preventDefault()}>
          <div className="relative">
            <input
              type="search"
              name="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes, ingredients, brew methods..."
              className="w-full px-6 py-4 pl-14 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              aria-label="Search recipes"
              autoComplete="off"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {search && (
              <a
                href="/"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </a>
            )}
          </div>
        </Form>
      </section>      {/* For You / Trending Section - Hide when searching */}
      {!search && data.recommendations.length > 0 && (
        <section className="mb-8 sm:mb-12" aria-labelledby="recommendations-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recommendations-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {userId ? "For You" : "Trending Now"}
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
            {(data.recommendations as any[]).map((recipe) => (
              <CoffeeCard
                key={recipe.id}
                id={recipe.id}
                name={recipe.name}
                description={recipe.description || ""}
                brewMethod={recipe.brewMethod}
                difficulty={recipe.difficulty as "easy" | "medium" | "hard"}
                ingredients={recipe.ingredients}
                author={recipe.author?.name || "CoffeeMixer"}
                authorId={recipe.author?.id}
                likes={recipe._count.likes}
                liked={data.userLikes.includes(recipe.id)}
                saved={data.userSaves.includes(recipe.id)}
                imageUrl={recipe.imageUrl}
                authorPfpUrl={recipe.author?.authorPfpUrl || null}
                onLikeSave={handleLikeSave}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search Results */}
      {search && (
        <>
          {fetcher.state !== 'idle' ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
                Searching for recipes...
              </p>
            </div>
          ) : data.recipes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No recipes found for "{search}"
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                Try a different search term or browse recommendations above
              </p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Clear search
              </a>
            </div>
          ) : (
            <section aria-label={`${data.recipes.length} search results`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Search Results for "{search}"
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data.recipes.length} {data.recipes.length === 1 ? "result" : "results"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.recipes as any[]).map((recipe) => (
                  <CoffeeCard
                    key={recipe.id}
                    id={recipe.id}
                    name={recipe.name}
                    description={recipe.description || ""}
                    brewMethod={recipe.brewMethod}
                    difficulty={recipe.difficulty as "easy" | "medium" | "hard"}
                    ingredients={recipe.ingredients}
                    author={recipe.author?.name || "CoffeeMixer"}
                    authorId={recipe.author?.id}
                    likes={recipe._count.likes}
                    liked={data.userLikes.includes(recipe.id)}
                    saved={data.userSaves.includes(recipe.id)}
                    imageUrl={recipe.imageUrl}
                    authorPfpUrl={recipe.author?.authorPfpUrl || null}
                    onLikeSave={handleLikeSave}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
