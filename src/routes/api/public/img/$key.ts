import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

function base64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function getBackendConfig() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend config missing");
  return { url, key };
}

export const Route = createFileRoute("/api/public/img/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params.key;
        if (!key || !/^[a-zA-Z0-9._-]+$/.test(key)) {
          return new Response("Invalid key", { status: 400 });
        }
        const { url: backendUrl, key: publishableKey } = getBackendConfig();
        const res = await fetch(
          `${backendUrl}/rest/v1/generated_images?key=eq.${encodeURIComponent(key)}&select=content_type,data_base64`,
          {
            headers: {
              apikey: publishableKey,
              Authorization: `Bearer ${publishableKey}`,
            },
          },
        );
        if (!res.ok) return new Response("Not found", { status: 404 });
        const rows = (await res.json()) as Array<{ content_type: string; data_base64: string }>;
        const image = rows[0];
        if (!image) return new Response("Not found", { status: 404 });
        return new Response(base64ToBytes(image.data_base64), {
          status: 200,
          headers: {
            "Content-Type": image.content_type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});