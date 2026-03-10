import type { Route } from "./+types/home";
import CoffeeCard from "../components/CoffeeCard";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "CoffeeMixer — Discover Your Perfect Brew" },
        { name: "description", content: "Get personalized coffee recommendations and share your favorite brews" },
    ];
}

// Mock data — will come from the database later
const feedRecipes = [
    {
        id: "1",
        name: "Honey Oat Latte",
        description: "A smooth and creamy latte with a touch of honey and oat milk. Perfect for a cozy morning.",
        brewMethod: "Espresso",
        difficulty: "easy" as const,
        ingredients: ["Espresso", "Oat Milk", "Honey", "Cinnamon"],
        author: "BaristaBen",
        likes: 42,
    },
    {
        id: "2",
        name: "Iced Vanilla Cold Brew",
        description: "Cold brewed for 18 hours with a hint of vanilla. Refreshing and bold.",
        brewMethod: "Cold Brew",
        difficulty: "easy" as const,
        ingredients: ["Coarse Ground Coffee", "Cold Water", "Vanilla Syrup", "Ice"],
        author: "ColdBrewQueen",
        likes: 87,
        saved: true,
    },
    {
        id: "3",
        name: "Caramel Macchiato",
        description: "Layered espresso with steamed milk, vanilla, and caramel drizzle. A classic crowd-pleaser.",
        brewMethod: "Espresso",
        difficulty: "medium" as const,
        ingredients: ["Espresso", "Whole Milk", "Vanilla Syrup", "Caramel Sauce"],
        author: "EspressoEllie",
        likes: 156,
    },
    {
        id: "4",
        name: "French Press Dark Roast",
        description: "Full-bodied and rich. A no-frills brew that lets the beans speak for themselves.",
        brewMethod: "French Press",
        difficulty: "easy" as const,
        ingredients: ["Dark Roast Beans", "Hot Water"],
        author: "SimpleSips",
        likes: 31,
    },
    {
        id: "5",
        name: "Lavender Oat Cappuccino",
        description: "Floral and creamy with a perfect foam top. An artisan café experience at home.",
        brewMethod: "Espresso",
        difficulty: "hard" as const,
        ingredients: ["Espresso", "Oat Milk", "Lavender Syrup", "Dried Lavender"],
        author: "FloralBrews",
        likes: 203,
    },
    {
        id: "6",
        name: "Mocha AeroPress",
        description: "AeroPress brewed coffee mixed with rich chocolate. Quick, clean, and indulgent.",
        brewMethod: "AeroPress",
        difficulty: "medium" as const,
        ingredients: ["Medium Roast Beans", "Hot Water", "Chocolate Syrup", "Steamed Milk"],
        author: "AeroPressAddict",
        likes: 64,
        saved: true,
    },
];

export default function Home() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Hero */}
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    Discover Your Perfect Brew ☕
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                    Explore coffee recipes, share your custom mixes, and get personalized recommendations.
                </p>
            </section>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-amber-600 text-white">
                    For You
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Popular
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Espresso
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Cold Brew
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Easy
                </button>
            </div>

            {/* Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedRecipes.map((recipe) => (
                    <CoffeeCard key={recipe.id} {...recipe} />
                ))}
            </div>
        </div>
    );
}
