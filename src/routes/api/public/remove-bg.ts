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
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return jsonErr(500, "AI key missing");

          const contentType = request.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) {
            return jsonErr(400, "Send raw image bytes with image/* content-type");
          }

          const buf = await request.arrayBuffer();
          if (buf.byteLength === 0 || buf.byteLength > 12 * 1024 * 1024) {
            return jsonErr(400, "Image too large or empty (max 12MB)");
          }

          // base64 encode (chunked, Worker-safe)
          const bytes = new Uint8Array(buf);
          let binary = "";
          const CHUNK = 0x8000;
          for (let i = 0; i < bytes.length; i += CHUNK) {
            binary += String.fromCharCode.apply(
              null,
              Array.from(bytes.subarray(i, i + CHUNK)) as unknown as number[],
            );
          }
          const b64 = btoa(binary);
          const dataUrl = `data:${contentType};base64,${b64}`;

          const aiRes = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3.1-flash-image-preview",
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Remove every part of the background completely. Return only the main foreground subject as a clean PNG cutout with true transparent alpha. Do not add checkerboards, shadows, patterns, shapes, replacement backgrounds, outlines, or decorative artifacts. Preserve the subject exactly and make all non-subject pixels fully transparent.",
                      },
                      { type: "image_url", image_url: { url: dataUrl } },
                    ],
                  },
                ],
                modalities: ["image", "text"],
              }),
            },
          );

          if (!aiRes.ok) {
            const t = await aiRes.text();
            console.error("AI error", aiRes.status, t);
            if (aiRes.status === 429) return jsonErr(429, "Rate limit. Try again in a moment.");
            if (aiRes.status === 402) return jsonErr(402, "AI credits exhausted. Top up Lovable AI.");
            return jsonErr(502, "AI background removal failed");
          }
          const data = (await aiRes.json()) as {
            choices?: Array<{
              message?: {
                images?: Array<{ image_url?: { url?: string } }>;
              };
            }>;
          };
          const out = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!out || !out.startsWith("data:")) {
            return jsonErr(502, "AI returned no image");
          }
          const comma = out.indexOf(",");
          const meta = out.slice(5, comma); // image/png;base64
          const outMime = meta.split(";")[0] || "image/png";
          const outB64 = out.slice(comma + 1);
          const outBin = atob(outB64);
          const outBytes = new Uint8Array(outBin.length);
          for (let i = 0; i < outBin.length; i++) outBytes[i] = outBin.charCodeAt(i);

          return new Response(outBytes, {
            status: 200,
            headers: {
              "Content-Type": outMime,
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
