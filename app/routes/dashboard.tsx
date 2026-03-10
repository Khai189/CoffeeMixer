import React from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Dashboard" },
        { name: "description", content: "This is the dashboard page" },
    ];
    }  

export default function Dashboard() {
    return (
        
    )
}
