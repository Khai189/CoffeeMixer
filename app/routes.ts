import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("recipe/:id", "routes/recipe.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
        