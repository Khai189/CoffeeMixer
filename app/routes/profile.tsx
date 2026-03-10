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
        },
        stats: {
            saved: savedCount,
            recipes: recipesCount,
            likes: likeCount,
        },
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

    await prisma.user.update({
        where: { id: userId },
        data: { name, email },
    });

    await prisma.profile.upsert({
        where: { userId },
        update: { favoriteDrink, brewMethod, milkPreference, sweetnessLevel, strengthLevel },
        create: { userId, favoriteDrink, brewMethod, milkPreference, sweetnessLevel, strengthLevel },
    });

    return { success: true };
}

const brewMethods = [
    { value: "Espresso", emoji: "☕", label: "Espresso" },
    { value: "French Press", emoji: "🫖", label: "French Press" },
    { value: "Pour Over", emoji: "💧", label: "Pour Over" },
    { value: "Cold Brew", emoji: "🧊", label: "Cold Brew" },
    { value: "AeroPress", emoji: "🔄", label: "AeroPress" },
    const navigation = useNavigation();
    const isSaving = navigation.state === "submitting";

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <Form method="post" className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-3xl">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="ml-auto px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? "Saving…" : "Save Profile"}
                    </button>
                </div>

                {/* Personal Info */}
                <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Personal Info</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                            <input
                                type="text"
                                name="name"
                                defaultValue={user.name}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                            <input
                                type="email"
                                name="email"
                                defaultValue={user.email}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </label>
                    </div>
                </section>

                {/* Coffee Preferences */}
                <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">☕ Coffee Preferences</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="space-y-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Favorite Drink</span>
                            <input
                                type="text"
                                name="favoriteDrink"
                                defaultValue={profile.favoriteDrink}
                                placeholder="e.g. Cappuccino"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Brew Method</span>
                            <select
                                name="brewMethod"
                                defaultValue={profile.brewMethod}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {brewMethods.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </label>
                        <label className="space-y-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Milk Preference</span>
                            <select
                                name="milkPreference"
                                defaultValue={profile.milkPreference}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {milkOptions.map((milk) => (
                                    <option key={milk} value={milk}>{milk}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Sliders */}
                    <div className="space-y-4 pt-2">
                        <label className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Sweetness</span>
                                <span className="text-amber-600 font-medium">{profile.sweetnessLevel}/5</span>
                            </div>
                            <input type="range" name="sweetnessLevel" min={1} max={5} defaultValue={profile.sweetnessLevel} className="w-full accent-amber-600" />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Bitter</span>
                                <span>Sweet</span>
                            </div>
                        </label>
                        <label className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Strength</span>
                                <span className="text-amber-600 font-medium">{profile.strengthLevel}/5</span>
                            </div>
                            <input type="range" name="strengthLevel" min={1} max={5} defaultValue={profile.strengthLevel} className="w-full accent-amber-600" />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Mild</span>
                                <span>Strong</span>
                            </div>
                        </label>
                    </div>
                </section>
            </Form>

            {/* Stats */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">📊 Your Coffee Stats</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">{stats.saved}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recipes Saved</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">{stats.recipes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recipes Created</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">{stats.likes}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recipes Liked</p>
                    </div>
                </div>
            </section>
        </div>
    );
}