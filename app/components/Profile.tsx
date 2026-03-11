import { useState } from "react";
import type { ChangeEvent, FC } from "react";

interface UserProfile {
    name: string;
    email: string;
    favoriteDrink: string;
    brewMethod: string;
    milkPreference: string;
    sweetnessLevel: number;
    strengthLevel: number;
    profileUrl?: string;
    pfp?: string;
}

interface ProfileProps {
    user: UserProfile;
    onUpdate: (user: UserProfile) => void;
}

const brewMethods = ["Espresso", "French Press", "Pour Over", "Cold Brew", "AeroPress", "Moka Pot"];
const milkOptions = ["None", "Whole Milk", "Oat Milk", "Almond Milk", "Soy Milk", "Coconut Milk"];

const Profile: FC<ProfileProps> = ({ user, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        name: user.name || "Coffee Lover",
        email: user.email || "coffee@example.com",
        favoriteDrink: user.favoriteDrink || "Cappuccino",
        brewMethod: user.brewMethod || "Espresso",
        milkPreference: user.milkPreference || "Oat Milk",
        sweetnessLevel: user.sweetnessLevel || 3,
        strengthLevel: user.strengthLevel || 4,
        profileUrl: user.profileUrl || "",
        pfp: user.pfp || "",
    });
    const [uploading, setUploading] = useState(false);

    const handleChange = (field: keyof UserProfile, value: string | number) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleProfileUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setProfile((prev) => ({ ...prev, profileUrl: newUrl, name: newUrl }));
        onUpdate({ ...user, profileUrl: newUrl, name: newUrl });
    };

    const handlePfpClick = () => {
        const input = document.getElementById("pfp-upload") as HTMLInputElement | null;
        if (input) input.click();
    };

    const handlePfpUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setProfile((prev) => ({ ...prev, pfp: data.url }));
        setUploading(false);
        onUpdate({ ...user, pfp: data.url });
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <img
                        src={profile.pfp || "/default-pfp.png"}
                        alt="Profile"
                        className="rounded-full w-20 h-20 object-cover cursor-pointer border-2 border-gray-300"
                        onClick={handlePfpClick}
                    />
                    {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">Uploading...</div>}
                    <input
                        id="pfp-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePfpUpload}
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {profile.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="ml-auto px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                    {isEditing ? "Save" : "Edit Profile"}
                </button>
            </div>

            {/* Personal Info */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Personal Info
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100">{profile.name}</p>
                        )}
                    </label>
                    <label className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                        {isEditing ? (
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100">{profile.email}</p>
                        )}
                    </label>
                </div>
            </section>

            {/* Coffee Preferences */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    ☕ Coffee Preferences
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Favorite Drink
                        </span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile.favoriteDrink}
                                onChange={(e) => handleChange("favoriteDrink", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100">
                                {profile.favoriteDrink}
                            </p>
                        )}
                    </label>

                    <label className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Brew Method
                        </span>
                        {isEditing ? (
                            <select
                                value={profile.brewMethod}
                                onChange={(e) => handleChange("brewMethod", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {brewMethods.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100">
                                {profile.brewMethod}
                            </p>
                        )}
                    </label>

                    <label className="space-y-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Milk Preference
                        </span>
                        {isEditing ? (
                            <select
                                value={profile.milkPreference}
                                onChange={(e) => handleChange("milkPreference", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {milkOptions.map((milk) => (
                                    <option key={milk} value={milk}>
                                        {milk}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-gray-900 dark:text-gray-100">
                                {profile.milkPreference}
                            </p>
                        )}
                    </label>
                </div>

                {/* Sliders */}
                <div className="space-y-4 pt-2">
                    <label className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Sweetness</span>
                            <span className="text-amber-600 font-medium">
                                {profile.sweetnessLevel}/5
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            value={profile.sweetnessLevel}
                            onChange={(e) =>
                                handleChange("sweetnessLevel", Number(e.target.value))
                            }
                            disabled={!isEditing}
                            className="w-full accent-amber-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Bitter</span>
                            <span>Sweet</span>
                        </div>
                    </label>

                    <label className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Strength</span>
                            <span className="text-amber-600 font-medium">
                                {profile.strengthLevel}/5
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            value={profile.strengthLevel}
                            onChange={(e) =>
                                handleChange("strengthLevel", Number(e.target.value))
                            }
                            disabled={!isEditing}
                            className="w-full accent-amber-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Mild</span>
                            <span>Strong</span>
                        </div>
                    </label>
                </div>
            </section>

            {/* Stats */}
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    📊 Your Coffee Stats
                </h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">12</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recipes Saved</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">5</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Custom Mixes</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
                        <p className="text-2xl font-bold text-amber-600">3</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Brew Methods</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Profile;