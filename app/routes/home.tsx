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
  let recommendations = [];
  if (userId) {
    recommendations = await getRecommendationsForUser(userId, limit, skip);
  } else {
    recommendations = await getTrendingRecipes(limit, skip);
  }

  // Only fetch recipes if there's a search query
  let recipes: any[] = [];
  let userLikes: string[] = [];
  let userSaves: string[] = [];

  // Collect all recipe IDs shown to fetch like/save status efficiently
  const allRecipeIds = [
    ...recommendations.map(r => r.id),
    ...(searchQuery ? [] : []), 
  ];

  if (searchQuery) {
    const where: any = {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { difficulty: { contains: searchQuery, mode: "insensitive" } },
        { author: { name: { contains: searchQuery, mode: "insensitive" } } },
        // Keeping brewMethod as it's useful, but the query strictly covers your request
        { brewMethod: { contains: searchQuery, mode: "insensitive" } },
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

  // Utility for robust image fallback
  function checkImage(url: string | null | undefined, fallback: string) {
    if (!url || typeof url !== "string" || url.length === 0) return fallback;
    return url;
  }

  // Patch recipe and pfp images
  const patchRecipe = (recipe: any) => {
    let authorPfpUrl = "/default-pfp.png";
    if (recipe.author?.profile?.pfpUrl) {
      authorPfpUrl = checkImage(recipe.author.profile.pfpUrl, "/default-pfp.png");
    }
    return {
      ...recipe,
      imageUrl: checkImage(recipe.imageUrl, "/default-recipe.png"),
      author: {
        ...recipe.author,
        authorPfpUrl,
      },
    };
  };

  return {
    recommendations: recommendations.map(patchRecipe),
    recipes: recipes.map(patchRecipe),
    userLikes,
    userSaves,
    page,
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

export default function Home({ loaderData }: Route.ComponentProps) {
  const { userLikes, userSaves, userId, searchQuery } = loaderData;
  const [search, setSearch] = useState(searchQuery || "");
  
  // State to hold the displayed list of items
  const [displayRecommendations, setDisplayRecommendations] = useState(loaderData.recommendations || []);
  const [displayRecipes, setDisplayRecipes] = useState(loaderData.recipes || []);
  
  const [recPage, setRecPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const PAGE_SIZE = 6;

  const fetcher = useFetcher();
  const loadMoreFetcher = useFetcher();
  const isFirstRun = useRef(true);
  const lastProcessedData = useRef<any>(null);

  // Callback to reload home feed after like/save (optimistic updates handle UI, this ensures consistency)
  const handleLikeSave = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetcher.load(`?${params.toString()}`);
  }, [search, fetcher]);

  // Handle Load More
  const handleLoadMore = () => {
    const params = new URLSearchParams();
    const nextPage = search ? searchPage + 1 : recPage + 1;
    
    if (search) params.set("search", search);
    params.set("page", nextPage.toString());
    
    loadMoreFetcher.load(`?${params.toString()}`);
  };

  // Append data when loadMoreFetcher completes
  useEffect(() => {
    if (loadMoreFetcher.data && loadMoreFetcher.data !== lastProcessedData.current) {
      lastProcessedData.current = loadMoreFetcher.data;
      if (search) {
        setDisplayRecipes(prev => [...(prev || []), ...(loadMoreFetcher.data?.recipes || [])]);
        setSearchPage(prev => prev + 1);
      } else {
        setDisplayRecommendations(prev => [...(prev || []), ...(loadMoreFetcher.data?.recommendations || [])]);
        setRecPage(prev => prev + 1);
      }
    }
  }, [loadMoreFetcher.data, search]);

  // Sync main fetcher data (for search or revalidation)
  useEffect(() => {
    const source = fetcher.data || loaderData;
    if (source) {
      // Always update lists when new data arrives
      if (source.recipes) setDisplayRecipes(source.recipes);
      if (source.recommendations) setDisplayRecommendations(source.recommendations);
      
      // Reset search page only if this is a fresh search result from the main fetcher
      if (fetcher.data && fetcher.data.recipes) setSearchPage(1);
    }
  }, [fetcher.data, loaderData]);

  // Debounced instant search
  useEffect(() => {
    if (isFirstRun.current) {
        isFirstRun.current = false;
        if (search === (searchQuery || "")) return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      fetcher.load(`?${params.toString()}`);
    }, 250); // 250ms debounce for "instant" feel
    return () => clearTimeout(timeout);
  }, [search, fetcher]);

  // Use current likes/saves from fetcher if available, otherwise loader
  const currentLikes = fetcher.data?.userLikes || userLikes || [];
  const currentSaves = fetcher.data?.userSaves || userSaves || [];

  const activeList = search ? displayRecipes : displayRecommendations;
  const safeList = activeList || [];
  
  // Only show load more if not currently loading
  const showLoadMore = safeList.length > 0 && safeList.length % PAGE_SIZE === 0 && loadMoreFetcher.state === "idle";

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
              placeholder="Search recipes, difficulty, authors..."
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </Form>
      </section>

      {/* For You / Trending Section - Hide when searching */}
      {!search && displayRecommendations.length > 0 && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayRecommendations.map((recipe: any) => (
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
                likes={recipe._count?.likes || 0}
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
          {displayRecipes.length === 0 && fetcher.state === 'idle' ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No recipes found for "{search}"
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                Try a different search term or browse recommendations
              </p>
            </div>
          ) : (
            <section aria-label="Search results" className={fetcher.state !== 'idle' ? "opacity-50 transition-opacity" : ""}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Search Results
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {displayRecipes.length > 0 ? "Found recipes" : "Searching..."}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayRecipes.map((recipe: any) => (
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
                    likes={recipe._count?.likes || 0}
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
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </main>
  );
}
