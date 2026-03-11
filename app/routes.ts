import { type RouteConfig, index, route } from "@react-router/dev/routes";
import UserProfilePage from "./routes/user";

export default [
  index("routes/home.tsx"),
  route("feed", "routes/feed.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("recipe/new", "routes/new-recipe.tsx"),
  route("recipe/:id", "routes/recipe.tsx"),
  route("profile", "routes/profile.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("logout", "routes/logout.tsx"),
  route("user/:userId", "routes/user.tsx"),
] satisfies RouteConfig;
