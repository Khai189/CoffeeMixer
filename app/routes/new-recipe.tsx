import type { Route } from "./+types/new-recipe";
import { prisma } from "../lib/db.server";
import { requireUserId } from "../lib/session.server";
import { redirect, Form, useNavigation, useActionData } from "react-router";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { useState } from "react";
import ImageCropModal from "../components/ImageCropModal";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Create a Recipe | CoffeeMixer" },
        { name: "description", content: "Share your custom coffee recipe with the world" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    await requireUserId(request);
    return {};
}

export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const brewMethod = formData.get("brewMethod") as string;
    const difficulty = formData.get("difficulty") as string;
    const ingredientsRaw = (formData.get("ingredients") as string)?.trim();
    const instructions = (formData.get("instructions") as string)?.trim();
    const imageFile = formData.get("image") as File | null;

    let imageUrl: string | null = null;

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(imageFile.type)) {
            return { errors: { image: "Only JPEG, PNG, WebP, and GIF images are allowed" } };
        }
        if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
            return { errors: { image: "Image must be smaller than 5MB" } };
        }

        // Generate unique filename
        const ext = imageFile.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        // Ensure uploads directory exists
        const uploadsDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });
        
        // Write file to disk
        const filepath = join(uploadsDir, filename);
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        imageUrl = `/uploads/${filename}`;
    }

    const errors: Record<string, string> = {};
    if (!name) errors.name = "Recipe name is required";
    if (!brewMethod) errors.brewMethod = "Brew method is required";
    if (!ingredientsRaw) errors.ingredients = "At least one ingredient is required";
    if (!instructions) errors.instructions = "Instructions are required";

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    const ingredients = ingredientsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const recipe = await prisma.recipe.create({
        data: {
            name,
            description: description || null,
            brewMethod,
            difficulty: difficulty || "medium",
            ingredients,
            instructions,
            imageUrl,
            authorId: userId,
        },
    });

    return redirect(`/recipe/${recipe.id}`);
}

const brewMethods = ["Espresso", "French Press", "Pour Over", "Cold Brew", "AeroPress", "Moka Pot"];
const difficulties = [
    { value: "easy", label: "Easy", emoji: "🟢" },
    { value: "medium", label: "Medium", emoji: "🟡" },
    { value: "hard", label: "Hard", emoji: "🔴" },
];

export default function NewRecipe({ actionData }: Route.ComponentProps) {
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const errors = actionData?.errors as Record<string, string> | undefined;
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (blob: Blob) => {
        setCroppedBlob(blob);
        setShowCropModal(false);
        
        // Create preview for cropped image
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(blob);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setImagePreview(null);
        setSelectedFile(null);
        setCroppedBlob(null);
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
        setCroppedBlob(null);
        // Reset the file input
        const fileInput = document.getElementById("image") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        // If we have a cropped image, replace the original file with it
        if (croppedBlob && selectedFile) {
            const croppedFile = new File([croppedBlob], selectedFile.name, {
                type: selectedFile.type,
            });
            formData.set("image", croppedFile);
        }

        // Submit the form manually
        form.submit();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create a Recipe ☕
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                Share your custom coffee creation with the CoffeeMixer community.
            </p>

            <Form method="post" encType="multipart/form-data" className="space-y-6" onSubmit={handleSubmit}>
                {/* Name */}
                <div className="space-y-1">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recipe Name *
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="e.g. Honey Oat Latte"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                    {errors?.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="What makes this recipe special?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                    />
                </div>

                {/* Image Preview */}
                {imagePreview && !showCropModal && (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                            src={imagePreview}
                            alt="Recipe preview"
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCropModal(true)}
                                className="px-3 py-1.5 bg-gray-900 bg-opacity-75 text-white text-sm rounded-lg hover:bg-opacity-90 transition-opacity"
                            >
                                ✂️ Crop
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="px-3 py-1.5 bg-red-600 bg-opacity-75 text-white text-sm rounded-lg hover:bg-opacity-90 transition-opacity"
                            >
                                ✕ Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Image Upload */}
                <div className="space-y-1">
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recipe Image <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
                    </label>
                    <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileSelect}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950 dark:file:text-amber-300"
                    />
                    {errors?.image && <p className="text-sm text-red-500">{errors.image}</p>}
                </div>

                {/* Brew Method + Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label htmlFor="brewMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Brew Method *
                        </label>
                        <select
                            id="brewMethod"
                            name="brewMethod"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        >
                            <option value="">Select a method</option>
                            {brewMethods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        {errors?.brewMethod && <p className="text-sm text-red-500">{errors.brewMethod}</p>}
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Difficulty
                        </label>
                        <select
                            id="difficulty"
                            name="difficulty"
                            defaultValue="medium"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        >
                            {difficulties.map((d) => (
                                <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Ingredients */}
                <div className="space-y-1">
                    <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ingredients * <span className="text-gray-400 font-normal">(comma-separated)</span>
                    </label>
                    <input
                        id="ingredients"
                        name="ingredients"
                        type="text"
                        placeholder="e.g. Espresso, Oat Milk, Honey, Cinnamon"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                    {errors?.ingredients && <p className="text-sm text-red-500">{errors.ingredients}</p>}
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Instructions * <span className="text-gray-400 font-normal">(one step per line)</span>
                    </label>
                    <textarea
                        id="instructions"
                        name="instructions"
                        rows={6}
                        placeholder={"1. Pull a double espresso shot.\n2. Heat oat milk and froth until creamy.\n3. Pour espresso into a mug, add honey.\n4. Pour frothed milk over espresso.\n5. Sprinkle cinnamon on top."}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                    />
                    {errors?.instructions && <p className="text-sm text-red-500">{errors.instructions}</p>}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? "Creating..." : "Publish Recipe ☕"}
                </button>
            </Form>

            {/* Crop Modal */}
            {showCropModal && imagePreview && (
                <ImageCropModal
                    imageUrl={imagePreview}
                    onComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={4 / 3}
                />
            )}
        </div>
    );
}
