import type { Route } from "../../+types/api_upload";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) {
    return new Response(JSON.stringify({ error: "No file uploaded." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Process the uploaded file here
  // ...

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
