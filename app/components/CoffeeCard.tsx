import { Link, useFetcher, Form } from "react-router";

interface CoffeeCardProps {
    id: string;
    name: string;
    description: string;
    brewMethod: string;
    difficulty: "easy" | "medium" | "hard";
    ingredients: string[];
    author?: string;
    authorId?: string;
    likes?: number;
    liked?: boolean;
    saved?: boolean;
    imageUrl?: string | null;
    authorPfpUrl?: string | null;
    onLikeSave?: () => void;
    isOwner?: boolean;
}

const difficultyColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const brewMethodEmoji: Record<string, string> = {
    "Espresso": "☕",
    "French Press": "🫖",
    "Pour Over": "💧",
    "Cold Brew": "🧊",
    "AeroPress": "🔄",
    "Moka Pot": "🫗",
};

export default function CoffeeCard({
    id,
    name,
    description,
    brewMethod,
    difficulty,
    ingredients,
    author = "CoffeeMixer",
    authorId,
    likes = 0,
    liked = false,
    saved = false,
    imageUrl,
    authorPfpUrl,
    onLikeSave,
    isOwner,
}: CoffeeCardProps) {
    const likeFetcher = useFetcher();
    const saveFetcher = useFetcher();

    // Remove optimistic UI logic
    // Always use props for visual state
    const isLiked = liked;
    const isSaved = saved;
    const displayLikes = likes;

    // Call onLikeSave when like/save completes
    if (onLikeSave && likeFetcher.state === "idle" && likeFetcher.data) {
        onLikeSave();
    }
    if (onLikeSave && saveFetcher.state === "idle" && saveFetcher.data) {
        onLikeSave();
    }

    return (
        <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-shadow" aria-label={`${name} by ${author}`}>
            {imageUrl && (
                <Link to={`/recipe/${id}`} className="block">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                    />
                </Link>
            )}
            <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {!imageUrl && (
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-xl" aria-hidden="true">
                        {brewMethodEmoji[brewMethod] ?? "☕"}
                    </div>
                    )}
                    {authorPfpUrl && (
                        <img
                            src={authorPfpUrl}
                            alt={author}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                            onError={e => { e.currentTarget.src = "/default-pfp.png"; }}
                        />
                    )}
                    <div>
                        <Link
                            to={`/recipe/${id}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 focus:outline-none focus:text-amber-600 dark:focus:text-amber-400 transition-colors"
                        >
                            {name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {authorId ? (
                                <Link to={`/user/${authorId}`} className="hover:text-amber-600 dark:hover:text-amber-400 underline">
                                    {author}
                                </Link>
                            ) : (
                                author
                            )}
                        </p>
                    </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${difficultyColors[difficulty]}`} aria-label={`Difficulty: ${difficulty}`}>
                    {difficulty}
                </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
            <div className="flex flex-wrap gap-1.5" aria-label="Ingredients">
                {ingredients.slice(0, 4).map((ingredient) => (
                    <span key={ingredient} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{ingredient}</span>
                ))}
                {ingredients.length > 4 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">+{ingredients.length - 4} more</span>
                )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-500 dark:text-gray-400">{brewMethod}</span>
                <div className="flex items-center gap-3">
                    <likeFetcher.Form method="post" action="/?index">
                        <input type="hidden" name="intent" value="like" />
                        <input type="hidden" name="recipeId" value={id} />
                        <button
                            type="submit"
                            className={`flex items-center gap-1 transition-colors focus:outline-none rounded-md p-1 ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                            aria-label={isLiked ? `Unlike ${name} (${displayLikes} likes)` : `Like ${name} (${displayLikes} likes)`}
                            aria-pressed={isLiked}
                            onMouseUp={e => e.currentTarget.blur()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            <span className="text-xs">{displayLikes}</span>
                        </button>
                    </likeFetcher.Form>
                    <saveFetcher.Form method="post" action="/?index">
                        <input type="hidden" name="intent" value="save" />
                        <input type="hidden" name="recipeId" value={id} />
                        <button
                            type="submit"
                            className={`transition-colors focus:outline-none rounded-md p-1 ${isSaved ? "text-amber-500" : "text-gray-400 hover:text-amber-500"}`}
                            aria-label={isSaved ? `Unsave ${name}` : `Save ${name}`}
                            aria-pressed={isSaved}
                            onMouseUp={e => e.currentTarget.blur()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>
                        </button>
                    </saveFetcher.Form>
                </div>
            </div>
            {isOwner && (
                <div className="flex gap-2 mt-2">
                    <Link
                        to={`/recipe/${id}`}
                        className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        Edit
                    </Link>
                    <Form method="post" action={`/recipe/${id}`}>
                        <input type="hidden" name="intent" value="delete" />
                        <button
                            type="submit"
                            className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            onClick={e => { if (!window.confirm("Delete this recipe?")) e.preventDefault(); }}
                        >
                            Delete
                        </button>
                    </Form>
                </div>
            )}
            </div>
        </article>
    );
}
