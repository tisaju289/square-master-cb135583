import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function bytesToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function getBackendConfig() {
  const url = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend config missing");
  return { url, key };
}

export const Route = createFileRoute("/api/public/upload-square")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const contentType = (request.headers.get("content-type") || "image/png").split(";")[0];
          if (!contentType.startsWith("image/")) {
            return new Response(JSON.stringify({ error: "Invalid content type" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          const ext =
            contentType === "image/jpeg" ? "jpg" :
            contentType === "image/webp" ? "webp" : "png";
          const buf = await request.arrayBuffer();
          if (buf.byteLength === 0 || buf.byteLength > 20 * 1024 * 1024) {
            return new Response(JSON.stringify({ error: "File too large or empty" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          const id =
            (globalThis.crypto?.randomUUID?.() ??
              Date.now().toString(36) + Math.random().toString(36).slice(2));
          const key = `${id}.${ext}`;
          const { url: backendUrl, key: publishableKey } = getBackendConfig();
          const saveRes = await fetch(`${backendUrl}/rest/v1/generated_images`, {
            method: "POST",
            headers: {
              apikey: publishableKey,
              Authorization: `Bearer ${publishableKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              key,
              content_type: contentType,
              data_base64: bytesToBase64(buf),
            }),
          });
          if (!saveRes.ok) {
            const detail = await saveRes.text().catch(() => "");
            console.error("Generated image save failed", saveRes.status, detail);
            return new Response(JSON.stringify({ error: "Public link save failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          const origin = new URL(request.url).origin;
          const url = `${origin}/api/img/${key}`;
          return new Response(JSON.stringify({ url, key }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (e) {
          console.error(e);
          return new Response(JSON.stringify({ error: "Upload failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
