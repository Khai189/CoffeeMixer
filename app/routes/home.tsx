import { useCallback, useState, useEffect, useRef } from "react";
import type { Route } from "./+types/home";
import { prisma } from "../lib/db.server";
import { getUserId } from "../lib/session.server";
import { redirect, Form, useFetcher } from "react-router";
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
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 6;
  const skip = (page - 1) * limit;
  const userId = await getUserId(request);

  // Get personalized recommendations or trending recipes
  let recommendations: any[] = [];
  if (userId) {
    recommendations = await getRecommendationsForUser(userId, limit, skip);
  } else {
    recommendations = await getTrendingRecipes(limit, skip);
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
    // Use raw query to perform fuzzy search (ILIKE) on the ingredients array
    // We convert the array to a string to allow partial matching (e.g. "l" finds "Lavender")
    let ingredientIds: string[] = [];
    try {
      const ingredientMatches = await prisma.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Recipe"
        WHERE array_to_string("ingredients"::text[], ' ') ILIKE ${`%${searchQuery}%`}
      `;
      ingredientIds = ingredientMatches.map(r => r.id);
    } catch (error) {
      console.error("RAW SQL ERROR in search:", error);
    }

    const where: any = {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { brewMethod: { contains: searchQuery, mode: "insensitive" } },
        { difficulty: { contains: searchQuery, mode: "insensitive" } },
        { author: { name: { contains: searchQuery, mode: "insensitive" } } },
        { id: { in: ingredientIds } },
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
      take: limit,
      skip: skip,
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
    page,
    limit,
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
  const {
    recommendations: initialRecommendations,
    recipes: initialRecipes,
    userLikes,
    userSaves,
    userId,
    searchQuery,
    limit,
  } = loaderData;

  const [search, setSearch] = useState(searchQuery || "");
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [recipes, setRecipes] = useState(initialRecipes);

  const searchFetcher = useFetcher();
  const loadMoreFetcher = useFetcher();
  const isFirstRun = useRef(true);

  // This handles re-syncing data after a user likes or saves a recipe.
  const handleLikeSave = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const queryStr = params.toString();
    searchFetcher.load(`/?index${queryStr ? `&${queryStr}` : ""}`);
  }, [search, searchFetcher]);

  // This effect replaces the list when a new search is performed.
  useEffect(() => {
    if (searchFetcher.data) {
      setRecipes(searchFetcher.data.recipes || []);
    }
  }, [searchFetcher.data]);

  // This effect appends new items when the "Load More" fetcher gets data.
  useEffect(() => {
    if (loadMoreFetcher.data) {
      if (search) {
        setRecipes(prev => [...prev, ...(loadMoreFetcher.data.recipes || [])]);
      } else {
        setRecommendations(prev => [...prev, ...(loadMoreFetcher.data.recommendations || [])]);
      }
    }
  }, [loadMoreFetcher.data, search]);

  // Debounced instant search
  useEffect(() => {
    if (isFirstRun.current) {
        isFirstRun.current = false;
        return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const queryStr = params.toString();
      searchFetcher.load(`/?index${queryStr ? `&${queryStr}` : ""}`);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleLoadMore = () => {
    const currentList = search ? recipes : recommendations;
    const currentPage = Math.ceil(currentList.length / limit);
    const nextPage = currentPage + 1;

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(nextPage));
    const queryStr = params.toString();
    loadMoreFetcher.load(`/?index${queryStr ? `&${queryStr}` : ""}`);
  };

  const currentLikes = searchFetcher.data?.userLikes || userLikes;
  const currentSaves = searchFetcher.data?.userSaves || userSaves;

  const activeList = search ? recipes : recommendations;
  const showLoadMore = activeList.length > 0 && activeList.length % limit === 0 && loadMoreFetcher.state === 'idle';

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
              type="text"
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
          </div>
        </Form>
      </section>      {/* For You / Trending Section - Hide when searching */}
      {!search && recommendations.length > 0 && (
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
                authorId={recipe.author?.id}
                likes={recipe._count.likes}
                liked={currentLikes.includes(recipe.id)}
                saved={currentSaves.includes(recipe.id)}
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
          {searchFetcher.state !== 'idle' && recipes.length === 0 ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg mt-4">
                Searching for recipes...
              </p>
            </div>)
           : recipes.length === 0 ? (
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
            <section aria-label={`${recipes.length} search results`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Search Results for "{search}"
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {recipes.length} {recipes.length === 1 ? "result" : "results"}
                </span>
              </div>
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
                    authorId={recipe.author?.id}
                    likes={recipe._count.likes}
                    liked={currentLikes.includes(recipe.id)}
                    saved={currentSaves.includes(recipe.id)}
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

      {/* Load More Button */}
      {showLoadMore && (
        <div className="mt-10 mb-16 sm:mb-24 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadMoreFetcher.state !== "idle"}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadMoreFetcher.state !== "idle" ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </main>
  );
}
