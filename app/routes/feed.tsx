import type { Route } from "./+types/feed";
import { prisma } from "../lib/db.server";
import { getUserId, requireUserId } from "../lib/session.server";
import { Form, Link, useFetcher } from "react-router";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { useState } from "react";
import ImageCropModal from "../components/ImageCropModal";
import { checkImage } from "../lib/image.server";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Feed | CoffeeMixer" },
        { name: "description", content: "See what the CoffeeMixer community is brewing" },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const userId = await getUserId(request);

    const posts = await prisma.post.findMany({
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { pfpUrl: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const safePosts = posts.map(post => ({
        ...post,
        author: {
            ...post.author,
            profile: {
                ...post.author.profile,
                pfpUrl: checkImage(post.author?.profile?.pfpUrl, "/default-pfp.png"),
            },
        },
    }));

    return { posts: safePosts, userId };
}

export async function action({ request }: Route.ActionArgs) {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "create") {
        const body = (formData.get("body") as string)?.trim();
        const imageFile = formData.get("image") as File | null;

        let imageUrl: string | null = null;

        if (!body || body.length === 0) {
            return { error: "Post body is required" };
        }
        if (body.length > 500) {
            return { error: "Post must be 500 characters or less" };
        }

        // Handle image upload
        if (imageFile && imageFile.size > 0) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(imageFile.type)) {
                return { error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
            }
            if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                return { error: "Image must be smaller than 5MB" };
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

        await prisma.post.create({
            data: { body, imageUrl, authorId: userId },
        });

        return { ok: true };
    }

    if (intent === "edit") {
        const postId = formData.get("postId") as string;
        const body = (formData.get("body") as string)?.trim();
        if (!postId || !body) return { error: "Post ID and body are required" };
        // Only allow editing your own posts
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.authorId !== userId) {
            return { error: "Not authorized" };
        }
        await prisma.post.update({ where: { id: postId }, data: { body } });
        return { ok: true };
    }

    if (intent === "delete") {
        const postId = formData.get("postId") as string;
        if (!postId) return { error: "Post ID is required" };

        // Only allow deleting your own posts
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post || post.authorId !== userId) {
            return { error: "Not authorized" };
        }

        await prisma.post.delete({ where: { id: postId } });
        return { ok: true };
    }

    return { error: "Unknown intent" };
}

function timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return then.toLocaleDateString();
}

function ComposePost({ actionData }: { actionData?: { error?: string } | undefined }) {
    const fetcher = useFetcher();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
    const error = actionData?.error;

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

        fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });

        // Reset form on successful submission
        if (fetcher.state === "idle") {
            form.reset();
            handleRemoveImage();
        }
    };

    return (
        <section aria-labelledby="compose-heading" className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <h2 id="compose-heading" className="sr-only">Create a post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="intent" value="create" />
                <div>
                    <label htmlFor="post-body" className="sr-only">What are you brewing?</label>
                    <textarea
                        id="post-body"
                        name="body"
                        rows={3}
                        maxLength={500}
                        placeholder="What are you brewing today? ☕"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none placeholder:text-gray-400"
                        required
                    />
                </div>

                {/* Image Preview */}
                {imagePreview && !showCropModal && (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
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

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                        <label htmlFor="post-image" className="sr-only">Add an image (optional)</label>
                        <input
                            id="post-image"
                            name="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileSelect}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950 dark:file:text-amber-300"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={fetcher.state === "submitting"}
                        className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-colors text-sm"
                    >
                        {fetcher.state === "submitting" ? "Posting..." : "Post"}
                    </button>
                </div>
                {error && (
                    <p className="text-sm text-red-500" role="alert">{error}</p>
                )}
            </form>

            {/* Crop Modal */}
            {showCropModal && imagePreview && (
                <ImageCropModal
                    imageUrl={imagePreview}
                    onComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={4 / 3}
                />
            )}
        </section>
    );
}

export default function Feed({ loaderData, actionData }: Route.ComponentProps) {
    const { posts, userId } = loaderData;

    return (
        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Community Feed
                </h1>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                    Share what you're brewing, discover what others are sipping.
                </p>
            </div>

            {/* Compose box — only for logged-in users */}
            {userId ? (
                <ComposePost actionData={actionData} />
            ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium focus:outline-none focus:underline">Log in</Link> or{" "}
                        <Link to="/signup" className="text-amber-600 hover:text-amber-700 font-medium focus:outline-none focus:underline">sign up</Link>{" "}
                        to share what you're brewing.
                    </p>
                </div>
            )}

            {/* Posts */}
            <section aria-labelledby="posts-heading" className="space-y-4">
                <h2 id="posts-heading" className="sr-only">Posts</h2>
                {posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
                        <p className="text-4xl mb-3" aria-hidden="true">🫗</p>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No posts yet. Be the first to share!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isOwner={userId === post.authorId}
                        />
                    ))
                )}
            </section>
        </main>
    );
}

function PostCard({
    post,
    isOwner,
    onEdit,
}: {
    post: {
        id: string;
        body: string;
        imageUrl: string | null;
        createdAt: Date | string;
        author: { id: string; name: string; profile?: { pfpUrl?: string | null } };
    };
    isOwner: boolean;
    onEdit?: (id: string, body: string) => void;
}) {
    const fetcher = useFetcher();
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(post.body);
    const isDeleting = fetcher.state !== "idle" && fetcher.formData?.get("postId") === post.id;

    if (isDeleting) return null; // optimistic removal

    return (
        <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden transition-colors">
            <div className="p-5 space-y-3">
                {/* Author row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {post.author?.profile?.pfpUrl ? (
                            <img
                                src={post.author.profile.pfpUrl}
                                alt={post.author.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                                onError={e => { e.currentTarget.src = "/default-pfp.png"; }}
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                                {post.author.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                {post.author.name}
                            </p>
                            <time
                                dateTime={new Date(post.createdAt).toISOString()}
                                className="text-xs text-gray-400"
                            >
                                {timeAgo(post.createdAt)}
                            </time>
                        </div>
                    </div>
                    {isOwner && !editing && (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="text-gray-400 hover:text-amber-600 focus:outline-none transition-colors p-1 rounded-lg"
                                aria-label="Edit this post"
                                onClick={() => setEditing(true)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                    <path d="M17.211 6.293a2.25 2.25 0 0 0 0-3.182l-.322-.322a2.25 2.25 0 0 0-3.182 0l-8.1 8.1a2.25 2.25 0 0 0-.573.97l-.7 2.8a.75.75 0 0 0 .91.91l2.8-.7a2.25 2.25 0 0 0 .97-.573l8.1-8.1ZM15.8 2.889a.75.75 0 0 1 1.06 1.06l-.322.322-1.06-1.06.322-.322ZM14.74 3.95l1.06 1.06-8.1 8.1a.75.75 0 0 1-.323.194l-2.8.7.7-2.8a.75.75 0 0 1 .194-.323l8.1-8.1Z" />
                                </svg>
                            </button>
                            <fetcher.Form method="post">
                                <input type="hidden" name="intent" value="delete" />
                                <input type="hidden" name="postId" value={post.id} />
                                <button
                                    type="submit"
                                    className="text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500 transition-colors p-1 rounded-lg"
                                    aria-label="Delete this post"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </fetcher.Form>
                        </div>
                    )}
                    {isOwner && editing && (
                        <fetcher.Form method="post" className="flex gap-2 items-center">
                            <input type="hidden" name="intent" value="edit" />
                            <input type="hidden" name="postId" value={post.id} />
                            <textarea
                                name="body"
                                value={editBody}
                                onChange={e => setEditBody(e.target.value)}
                                className="w-64 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-sm"
                                maxLength={500}
                                required
                            />
                            <button type="submit" className="text-amber-600 font-medium px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900">Save</button>
                            <button type="button" className="text-gray-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setEditing(false)}>Cancel</button>
                        </fetcher.Form>
                    )}
                </div>

                {/* Body */}
                {editing ? null : (
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {post.body}
                    </p>
                )}
            </div>

            {/* Image */}
            {post.imageUrl && (
                <img
                    src={post.imageUrl}
                    alt=""
                    className="w-full max-h-96 object-cover border-t border-gray-100 dark:border-gray-800"
                    loading="lazy"
                />
            )}
        </article>
    );
}
