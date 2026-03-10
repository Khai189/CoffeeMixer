import type { Route } from "./+types/profile";
import Profile from "../components/Profile";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Your Profile | CoffeeMixer" },
        { name: "description", content: "View and edit your coffee preferences" },
    ];
}

export default function ProfilePage() {
    return <Profile />;
}