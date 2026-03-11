import type { Route } from "./+types/profile";
import { prisma } from "../lib/db.server";
import { requireUserId } from "../lib/session.server";
import { redirect, Form, useNavigation, useFetcher } from "react-router";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Your Profile | CoffeeMixer" },
        { name: "description", content: "View and edit your coffee preferences" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await requireUserId(request);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });

    if (!user) throw redirect("/login");

    const [savedCount, recipesCount, likeCount] = await Promise.all([
        prisma.savedRecipe.count({ where: { userId } }),
        prisma.recipe.count({ where: { authorId: userId } }),
        prisma.like.count({ where: { userId } }),
    ]);

    const recipes = await prisma.recipe.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
        profile: {
            favoriteDrink: user.profile?.favoriteDrink || "",
            brewMethod: user.profile?.brewMethod || "Espresso",
            milkPreference: user.profile?.milkPreference || "None",
            sweetnessLevel: user.profile?.sweetnessLevel ?? 3,
            strengthLevel: user.profile?.strengthLevel ?? 3,
            pfpUrl: user.profile?.pfpUrl || "",
        },
        stats: {
            saved: savedCount,
            recipes: recipesCount,
            likes: likeCount,
        },
        feed: recipes,
    };
}

export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const favoriteDrink = formData.get("favoriteDrink") as string;
    const brewMethod = formData.get("brewMethod") as string;
    const milkPreference = formData.get("milkPreference") as string;
    const sweetnessLevel = Number(formData.get("sweetnessLevel"));
    const strengthLevel = Number(formData.get("strengthLevel"));
    const pfpUrl = formData.get("pfpUrl") as string | undefined;

    await prisma.user.update({
        where: { id: userId },
        data: { name, email },
    });

    await prisma.profile.upsert({
        where: { userId },
        update: { favoriteDrink, brewMethod, milkPreference, sweetnessLevel, strengthLevel, pfpUrl },
        create: { userId, favoriteDrink, brewMethod, milkPreference, sweetnessLevel, strengthLevel, pfpUrl },
    });

    return { success: true };
}

const brewMethods = [
    { value: "Espresso", emoji: "☕", label: "Espresso" },
    { value: "French Press", emoji: "🫖", label: "French Press" },
    { value: "Pour Over", emoji: "💧", label: "Pour Over" },
    { value: "Cold Brew", emoji: "🧊", label: "Cold Brew" },
    { value: "AeroPress", emoji: "🔄", label: "AeroPress" },
    { value: "Moka Pot", emoji: "🫗", label: "Moka Pot" },
];

const milkOptions = [
    { value: "None", emoji: "⬛", label: "Black / None" },
    { value: "Whole Milk", emoji: "🥛", label: "Whole Milk" },
    { value: "Oat Milk", emoji: "🌾", label: "Oat Milk" },
    { value: "Almond Milk", emoji: "🌰", label: "Almond Milk" },
    { value: "Soy Milk", emoji: "🫘", label: "Soy Milk" },
    { value: "Coconut Milk", emoji: "🥥", label: "Coconut Milk" },
];

const sweetnessLabels = ["None", "Hint", "Balanced", "Sweet", "Dessert"];
const strengthLabels = ["Light", "Mild", "Medium", "Bold", "Intense"];

export default function ProfilePage({ loaderData, actionData }: Route.ComponentProps) {
    const { user, profile, stats, feed } = loaderData;
    const navigation = useNavigation();
    const isSaving = navigation.state === "submitting";

    const [brewMethod, setBrewMethod] = useState(profile.brewMethod);
    const [milkPreference, setMilkPreference] = useState(profile.milkPreference);
    const [sweetness, setSweetness] = useState(profile.sweetnessLevel);
    const [strength, setStrength] = useState(profile.strengthLevel);
    const [favoriteDrink, setFavoriteDrink] = useState(profile.favoriteDrink);
    const [pfpUrl, setPfpUrl] = useState(profile.pfpUrl);

    const showSuccess = actionData && "success" in actionData && actionData.success && navigation.state === "idle";

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setPfpUrl(data.url);
    };

    return (
        <main className="max-w-2xl mx-auto p-6 space-y-8">
            <Form method="post" className="space-y-8" aria-label="Profile settings">
                {/* Hidden fields for controlled state */}
                <input type="hidden" name="brewMethod" value={brewMethod} />
                <input type="hidden" name="milkPreference" value={milkPreference} />
                <input type="hidden" name="sweetnessLevel" value={sweetness} />
                <input type="hidden" name="strengthLevel" value={strength} />
                <input type="hidden" name="pfpUrl" value={pfpUrl} />

                {/* Header with avatar upload */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src={pfpUrl || "/default-pfp.png"}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover cursor-pointer border-2 border-gray-300"
                            onClick={() => document.getElementById("pfp-upload")?.click()}
                        />
                        <input
                            id="pfp-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 transition-all"
                        aria-label="Save profile changes"
                    >
                        {isSaving ? "Saving…" : "Save Profile"}
                    </button>
                </div>

                {/* Success toast */}
                {showSuccess && (
                    <div className="rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2" role="status" aria-live="polite">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                        Profile saved successfully!
                    </div>
                )}

                {/* Personal Info */}
                <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4" aria-labelledby="personal-info-heading">
                    <h2 id="personal-info-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200">Personal Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                            <input
                                id="profile-name"
                                type="text"
                                name="name"
                                defaultValue={user.name}
                                required
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="profile-email" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                            <input
                                id="profile-email"
                                type="email"
                                name="email"
                                defaultValue={user.email}
                                required
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                        </div>
                    </div>
                </section>

                {/* Coffee Preferences — Interactive */}
                <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-6" aria-labelledby="prefs-heading">
                    <h2 id="prefs-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200">☕ Coffee Preferences</h2>

                    {/* Favorite Drink */}
                    <div className="space-y-1.5">
                        <label htmlFor="fav-drink" className="block text-sm font-medium text-gray-600 dark:text-gray-400">Favorite Drink</label>
                        <input
                            id="fav-drink"
                            type="text"
                            name="favoriteDrink"
                            value={favoriteDrink}
                            onChange={(e) => setFavoriteDrink(e.target.value)}
                            placeholder="e.g. Cappuccino, Flat White…"
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                        />
                    </div>

                    {/* Brew Method — Chip Picker */}
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">Preferred Brew Method</legend>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Brew method selection">
                            {brewMethods.map((method) => {
                                const selected = brewMethod === method.value;
                                return (
                                    <button
                                        key={method.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setBrewMethod(method.value)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border-2 focus:outline-none focus-visible:border-amber-500 ${
                                            selected
                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <span aria-hidden="true">{method.emoji}</span>
                                        {method.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Milk Preference — Chip Picker */}
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">Milk Preference</legend>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Milk preference selection">
                            {milkOptions.map((milk) => {
                                const selected = milkPreference === milk.value;
                                return (
                                    <button
                                        key={milk.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setMilkPreference(milk.value)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border-2 focus:outline-none focus-visible:border-amber-500 ${
                                            selected
                                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                    >
                                        <span aria-hidden="true">{milk.emoji}</span>
                                        {milk.label}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Sweetness — Visual Dot Picker */}
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Sweetness — <span className="text-amber-600 dark:text-amber-400 font-semibold">{sweetnessLabels[sweetness - 1]}</span>
                        </legend>
                        <div className="flex items-center gap-1" role="radiogroup" aria-label="Sweetness level">
                            {sweetnessLabels.map((label, i) => {
                                const level = i + 1;
                                const active = sweetness >= level;
                                const selected = sweetness === level;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={`${label} (${level} of 5)`}
                                        onClick={() => setSweetness(level)}
                                        className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-colors focus:outline-none focus-visible:border-amber-500 ${
                                            selected
                                                ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                                                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
                                            active
                                                ? "bg-amber-100 dark:bg-amber-900"
                                                : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                        }`}>
                                            {active ? "🍯" : "·"}
                                        </div>
                                        <span className={`text-xs transition-colors ${
                                            selected ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-gray-400"
                                        }`}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Strength — Visual Dot Picker */}
                    <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Strength — <span className="text-amber-600 dark:text-amber-400 font-semibold">{strengthLabels[strength - 1]}</span>
                        </legend>
                        <div className="flex items-center gap-1" role="radiogroup" aria-label="Strength level">
                            {strengthLabels.map((label, i) => {
                                const level = i + 1;
                                const active = strength >= level;
                                const selected = strength === level;
                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={`${label} (${level} of 5)`}
                                        onClick={() => setStrength(level)}
                                        className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-colors focus:outline-none focus-visible:border-amber-500 ${
                                            selected
                                                ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                                                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
                                            active
                                                ? "bg-stone-200 dark:bg-stone-800"
                                                : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                                        }`}>
                                            {active ? "💪" : "·"}
                                        </div>
                                        <span className={`text-xs transition-colors ${
                                            selected ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-gray-400"
                                        }`}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Live Preview */}
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-4" aria-live="polite" aria-label="Preference summary">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Coffee Profile</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            You enjoy a <span className="font-semibold text-amber-600 dark:text-amber-400">{strengthLabels[strength - 1].toLowerCase()}</span>
                            {", "}
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{sweetnessLabels[sweetness - 1].toLowerCase()}</span>-sweetness
                            {" "}
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{brewMethod}</span>
                            {milkPreference !== "None" && (
                                <> with <span className="font-semibold text-amber-600 dark:text-amber-400">{milkPreference.toLowerCase()}</span></>
                            )}
                            {favoriteDrink && (
                                <>. Your go-to is a <span className="font-semibold text-amber-600 dark:text-amber-400">{favoriteDrink}</span></>
                            )}.
                        </p>
                    </div>
                </section>
            </Form>

            {/* User Feed/Recipes Section */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6" aria-labelledby="feed-heading">
                <h2 id="feed-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Recipes</h2>
                <div className="grid grid-cols-1 gap-4">
                    {feed.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No recipes yet.</p>
                    ) : (
                        feed.map((recipe: any) => (
                            <div key={recipe.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{recipe.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{recipe.description}</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{recipe.brewMethod}</span>
                                {/* Add link to author profile */}
                                <div className="mt-2">
                                    <a href={`/user/${recipe.authorId}`} className="text-sm font-semibold text-amber-600 hover:underline">
                                        View Author Profile
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Stats */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6" aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📊 Your Coffee Stats</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600" aria-label={`${stats.saved} recipes saved`}>{stats.saved}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Saved</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600" aria-label={`${stats.recipes} recipes created`}>{stats.recipes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600" aria-label={`${stats.likes} recipes liked`}>{stats.likes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Liked</p>
                    </div>
                </div>
            </section>
        </main>
    );
}