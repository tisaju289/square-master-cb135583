import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/upload-square")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const contentType = request.headers.get("content-type") || "image/png";
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
          const { error } = await supabaseAdmin.storage
            .from("squares")
            .upload(key, buf, { contentType, upsert: false });
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
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
