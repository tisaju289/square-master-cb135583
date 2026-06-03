import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/img/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params.key;
        if (!key || !/^[a-zA-Z0-9._-]+$/.test(key)) {
          return new Response("Invalid key", { status: 400 });
        }
        const { data, error } = await supabaseAdmin.storage
          .from("squares")
          .download(key);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }
        const ext = key.split(".").pop()?.toLowerCase();
        const contentType =
          ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
          ext === "webp" ? "image/webp" : "image/png";
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
