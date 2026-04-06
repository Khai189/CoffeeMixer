import { existsSync } from "fs";
import { join } from "path";

export function checkImage(
    url: string | null | undefined,
    fallback: string | null = null
): string | null {
    try {
        if (!url || typeof url !== "string" || url.length === 0) return fallback;
        if (url.startsWith("/uploads/")) {
            const imagePath = join(process.cwd(), "public", url);
            if (!existsSync(imagePath)) return fallback;
        }
        return url;
    } catch {
        return fallback;
    }
}

export function patchRecipeImages<
    T extends {
        imageUrl?: string | null;
        author?: { profile?: { pfpUrl?: string | null } | null } | null;
    },
>(recipes: T[]) {
    return recipes.map((recipe) => ({
        ...recipe,
        imageUrl: checkImage(recipe.imageUrl),
        author: recipe.author
            ? {
                  ...recipe.author,
                  profile: {
                      ...recipe.author.profile,
                      pfpUrl: checkImage(
                          recipe.author?.profile?.pfpUrl,
                          "/default-pfp.png"
                      ),
                  },
              }
            : recipe.author,
    }));
}
