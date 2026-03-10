import type { Route } from "./+types/logout";
import { logout } from "~/lib/session.server";

// Logout only works as a POST action (for security — no GET logout)
export async function action({ request }: Route.ActionArgs) {
    return logout(request);
}
