import React from "react";
import Recipe from "../components/Recipe";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Dashboard" },
        { name: "description", content: "This is the dashboard page" },
    ];
    }  

export default function Dashboard() {
    return (
        <div className = "flex items-center justify-center pt-16 pb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                Welcome to your Dashboard!
            </h1>
            
        </div>
    )
}
