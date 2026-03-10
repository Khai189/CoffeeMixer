import type { Route } from "./+types/profile";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "User Profile" },
        { name: "description", content: "View and edit your profile information" },
    ];
}

export default function Profile() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="text-gray-700 dark:text-gray-300">
                View and edit your profile information.
            </p>
        </div>
    );
}