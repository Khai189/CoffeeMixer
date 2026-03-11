import type { Route } from "../../+types/api_upload";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
        return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "webp";
    const filename = `${Date.now()}-${randomUUID()}.${ext}`;
    const uploadPath = join(process.cwd(), "public", "uploads", filename);
    await writeFile(uploadPath, buffer);
    return new Response(JSON.stringify({ url: `/uploads/${filename}` }), {
        headers: { "Content-Type": "application/json" },
    });
}
