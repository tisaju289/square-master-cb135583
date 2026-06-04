import { createFileRoute } from "@tanstack/react-router";
import process from "node:process";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonErr(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export const Route = createFileRoute("/api/public/remove-bg")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.REMOVE_BG_API_KEY;
          if (!apiKey) return jsonErr(500, "AI key missing");

          const contentType = request.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) {
            return jsonErr(400, "Send raw image bytes with image/* content-type");
          }

          const buf = await request.arrayBuffer();
          if (buf.byteLength === 0 || buf.byteLength > 12 * 1024 * 1024) {
            return jsonErr(400, "Image too large or empty (max 12MB)");
          }

          // remove.bg API call
          const formData = new FormData();
          formData.append(
            "image_file",
            new Blob([buf], { type: contentType }),
            "image"
          );
          formData.append("size", "auto");

          const aiRes = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: {
              "X-Api-Key": apiKey,
            },
            body: formData,
          });

          if (!aiRes.ok) {
            const t = await aiRes.text();
            console.error("remove.bg error", aiRes.status, t);
            if (aiRes.status === 429) return jsonErr(429, "Rate limit. Try again in a moment.");
            if (aiRes.status === 402) return jsonErr(402, "API credits exhausted.");
            return jsonErr(502, "Background removal failed");
          }

          const outBytes = new Uint8Array(await aiRes.arrayBuffer());

          return new Response(outBytes, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store",
              ...corsHeaders,
            },
          });
        } catch (e) {
          console.error(e);
          return jsonErr(500, "Server error");
        }
      },
    },
  },
});
