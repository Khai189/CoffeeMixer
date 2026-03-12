import { prisma } from "./db.server";

/**
 * Coffee Recommendation Engine
 * Uses a hybrid approach combining:
 * 1. Content-based filtering (user preferences match)
 * 2. Collaborative filtering (similar users' likes)
 * 3. Popularity metrics (likes/saves)
 */

interface UserPreferences {
    brewMethod?: string | null;
    milkPreference?: string | null;
    sweetnessLevel: number;
    strengthLevel: number;
}

interface RecipeWithScore {
    id: string;
    name: string;
    description: string | null;
    brewMethod: string;
    difficulty: string;
    ingredients: string[];
    instructions: string;
    imageUrl: string | null;
    authorId: string | null;
    createdAt: Date;
    author: { id: string; name: string } | null;
    _count: { likes: number; savedBy: number };
    score: number;
}

/**
 * Calculate similarity score between two users based on preferences
 */
function calculateUserSimilarity(user1: UserPreferences, user2: UserPreferences): number {
    let score = 0;
    
    // Brew method match (25 points)
    if (user1.brewMethod && user2.brewMethod && user1.brewMethod === user2.brewMethod) {
        score += 25;
    }
    
    // Milk preference match (15 points)
    if (user1.milkPreference && user2.milkPreference && user1.milkPreference === user2.milkPreference) {
        score += 15;
    }
    
    // Sweetness level similarity (30 points - closer = better)
    const sweetnessDiff = Math.abs(user1.sweetnessLevel - user2.sweetnessLevel);
    score += Math.max(0, 30 - sweetnessDiff * 6);
    
    // Strength level similarity (30 points - closer = better)
    const strengthDiff = Math.abs(user1.strengthLevel - user2.strengthLevel);
    score += Math.max(0, 30 - strengthDiff * 6);
    
    return score;
}

/**
 * Calculate content-based score for a recipe based on user preferences
 */
function calculateContentScore(
    recipe: any,
    userPrefs: UserPreferences,
    userLikes: string[],
    userSaves: string[],
    isBeingLiked: boolean = false
): number {
    let score = 0;
    
    // Already liked/saved? Deprioritize instead of exclude
    if (userLikes.includes(recipe.id) || userSaves.includes(recipe.id)) {
        score -= 100; // Large penalty, but still visible
    }
    
    // Brew method match (40 points)
    if (userPrefs.brewMethod && recipe.brewMethod === userPrefs.brewMethod) {
        score += 40;
    }
    
    // Difficulty preference (easier = higher score for casual users, harder for enthusiasts)
    const difficultyMap: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    const recipeDifficulty = difficultyMap[recipe.difficulty] || 2;
    
    // If user prefers stronger coffee, they might enjoy harder recipes
    if (userPrefs.strengthLevel >= 4 && recipeDifficulty >= 2) {
        score += 20;
    } else if (userPrefs.strengthLevel <= 2 && recipeDifficulty === 1) {
        score += 20;
    }
    
    // Milk-based ingredients check
    const hasMilk = recipe.ingredients.some((ing: string) => 
        /milk|cream|latte|cappuccino/i.test(ing)
    );
    
    if (userPrefs.milkPreference) {
        if (userPrefs.milkPreference !== "None" && hasMilk) {
            score += 25;
        } else if (userPrefs.milkPreference === "None" && !hasMilk) {
            score += 25;
        }
    }
    
    // Sweetness indicators in ingredients
    const hasSweet = recipe.ingredients.some((ing: string) => 
        /sugar|honey|syrup|caramel|chocolate|vanilla/i.test(ing)
    );
    
    if (userPrefs.sweetnessLevel >= 4 && hasSweet) {
        score += 15;
    } else if (userPrefs.sweetnessLevel <= 2 && !hasSweet) {
        score += 15;
    }
    
    // Popularity boost (likes + saves)
    const popularityScore = Math.min(20, (recipe._count.likes + recipe._count.savedBy) * 0.5);
    score += popularityScore;
    
    // Recency bonus (newer recipes get slight boost)
    const ageInDays = (Date.now() - new Date(recipe.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) {
        score += 10;
    } else if (ageInDays < 30) {
        score += 5;
    }

    // Penalty for optimistic like (if recipe is being liked right now)
    if (isBeingLiked) {
        score -= 100; // Large penalty to deprioritize
    }
    
    return score;
}

export async function getRecommendationsForUser(userId: string, limit: number = 6, skip: number = 0) {
    // 1. Get user profile
    const userProfile = await prisma.profile.findUnique({
        where: { userId },
        select: {
            brewMethod: true,
            milkPreference: true,
            sweetnessLevel: true,
            strengthLevel: true,
        },
    });
    if (!userProfile) {
        // No profile yet - return popular recipes
        const recipes = await prisma.recipe.findMany({
            include: {
                author: { select: { id: true, name: true, profile: { select: { pfpUrl: true } } } },
                _count: { select: { likes: true, savedBy: true } },
            },
            orderBy: [
                { likes: { _count: "desc" } },
                { createdAt: "desc" },
            ],
            take: limit,
            skip: skip,
        });
        return recipes.map(r => ({ ...r, score: 0 }));
    }
    // 2. Get user's liked recipes
    const userLikes = await prisma.like.findMany({
        where: { userId },
        select: { recipeId: true },
    });
    const likedRecipeIds = userLikes.map(l => l.recipeId);

    // Get user's saved recipes to deprioritize them as well
    const userSaves = await prisma.savedRecipe.findMany({
        where: { userId },
        select: { recipeId: true },
    });
    const savedRecipeIds = userSaves.map(s => s.recipeId);

    // 3. Find similar users (collaborative filtering)
    const allProfiles = await prisma.profile.findMany({
        where: { userId: { not: userId } },
        include: {
            user: {
                include: {
                    likes: { select: { recipeId: true } },
                },
            },
        },
        take: 50,
    });
    const similarUsers = allProfiles
        .filter(p => p.user) // Ensure user relation exists
        .map(profile => ({
            userId: profile.userId,
            similarity: calculateUserSimilarity(userProfile, profile),
            likedRecipes: profile.user!.likes.map(l => l.recipeId),
        }))
        .filter(u => u.similarity > 40)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    // 4. Get recipes liked by similar users
    const collaborativeRecipeIds = new Set<string>();
    similarUsers.forEach(user => {
        user.likedRecipes.forEach(recipeId => {
            if (!likedRecipeIds.includes(recipeId)) {
                collaborativeRecipeIds.add(recipeId);
            }
        });
    });
    // 5. Get all recipes (including liked)
    const allRecipes = await prisma.recipe.findMany({
        // Remove id: { notIn: likedRecipeIds }, so liked recipes are included
        include: {
            author: { select: { id: true, name: true, profile: { select: { pfpUrl: true } } } },
            _count: { select: { likes: true, savedBy: true } },
        },
        take: 100,
    });
    // 6. Score each recipe
    const scoredRecipes = allRecipes.map(recipe => {
        let score = calculateContentScore(recipe, userProfile, likedRecipeIds, savedRecipeIds, false);
        if (collaborativeRecipeIds.has(recipe.id)) {
            score += 30;
        }
        return { ...recipe, score };
    });
    // 7. Sort by score and return top N
    return scoredRecipes
        .sort((a, b) => b.score - a.score)
        .slice(skip, skip + limit);
}

/**
 * Get trending recipes (fallback for non-logged-in users)
 */
export async function getTrendingRecipes(limit: number = 10, skip: number = 0) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return prisma.recipe.findMany({
        include: {
            author: { select: { id: true, name: true, profile: { select: { pfpUrl: true } } } },
            _count: { select: { likes: true, savedBy: true } },
        },
        orderBy: [
            { likes: { _count: "desc" } },
            { savedBy: { _count: "desc" } },
            { createdAt: "desc" },
        ],
        take: limit,
        skip: skip,
    });
}
