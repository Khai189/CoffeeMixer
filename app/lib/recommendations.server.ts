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
    userLikes: string[]
): number {
    let score = 0;
    
    // Already liked/saved? Penalty (we want new recommendations)
    if (userLikes.includes(recipe.id)) {
        return -100;
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
    
    return score;
}

/**
 * Get personalized recipe recommendations for a user
 */
export async function getRecommendationsForUser(
    userId: string,
    limit: number = 10
): Promise<RecipeWithScore[]> {
    // 1. Get user's profile and preferences
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
                author: { select: { id: true, name: true } },
                _count: { select: { likes: true, savedBy: true } },
            },
            orderBy: [
                { likes: { _count: "desc" } },
                { createdAt: "desc" },
            ],
            take: limit,
        });
        
        return recipes.map(r => ({ ...r, score: 0 }));
    }
    
    // 2. Get user's liked recipes
    const userLikes = await prisma.like.findMany({
        where: { userId },
        select: { recipeId: true },
    });
    const likedRecipeIds = userLikes.map(l => l.recipeId);
    
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
        take: 50, // Top 50 users for performance
    });
    
    const similarUsers = allProfiles
        .map(profile => ({
            userId: profile.userId,
            similarity: calculateUserSimilarity(userProfile, profile),
            likedRecipes: profile.user.likes.map(l => l.recipeId),
        }))
        .filter(u => u.similarity > 40) // Only consider similar users
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Top 10 similar users
    
    // 4. Get recipes liked by similar users
    const collaborativeRecipeIds = new Set<string>();
    similarUsers.forEach(user => {
        user.likedRecipes.forEach(recipeId => {
            if (!likedRecipeIds.includes(recipeId)) {
                collaborativeRecipeIds.add(recipeId);
            }
        });
    });
    
    // 5. Get all recipes (excluding already liked)
    const allRecipes = await prisma.recipe.findMany({
        where: {
            id: { notIn: likedRecipeIds },
        },
        include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true, savedBy: true } },
        },
        take: 100, // Consider top 100 recipes
    });
    
    // 6. Score each recipe
    const scoredRecipes: RecipeWithScore[] = allRecipes.map(recipe => {
        let score = calculateContentScore(recipe, userProfile, likedRecipeIds);
        
        // Collaborative boost (if similar users liked it)
        if (collaborativeRecipeIds.has(recipe.id)) {
            score += 30;
        }
        
        return { ...recipe, score };
    });
    
    // 7. Sort by score and return top N
    return scoredRecipes
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Get trending recipes (fallback for non-logged-in users)
 */
export async function getTrendingRecipes(limit: number = 10) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return prisma.recipe.findMany({
        include: {
            author: { select: { id: true, name: true } },
            _count: { select: { likes: true, savedBy: true } },
        },
        orderBy: [
            { likes: { _count: "desc" } },
            { savedBy: { _count: "desc" } },
            { createdAt: "desc" },
        ],
        take: limit,
    });
}
