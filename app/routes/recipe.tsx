import Recipe from "../components/Recipe";
import type { Route } from "./+types/recipe";
import { useParams } from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Recipe Details" },
        { name: "description", content: "Detailed view of a coffee recipe" },
    ];
}

export default function RecipePage() {
    const { id } = useParams();
    return <Recipe id={id!} />;
}