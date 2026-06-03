import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
        if (!url) {
          return new Response("Missing url", { status: 400 });
        }
        let target: URL;
        try {
          target = new URL(url);
        } catch {
          return new Response("Invalid url", { status: 400 });
        }
        if (target.protocol !== "http:" && target.protocol !== "https:") {
          return new Response("Unsupported protocol", { status: 400 });
        }
        try {
          const upstream = await fetch(target.toString(), {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; SquareStudio/1.0; +https://lovable.dev)",
              Accept: "image/*,*/*;q=0.8",
            },
            redirect: "follow",
          });
          if (!upstream.ok) {
            return new Response(`Upstream ${upstream.status}`, {
              status: upstream.status,
              headers: { "Access-Control-Allow-Origin": "*" },
            });
          }
          const contentType =
            upstream.headers.get("content-type") || "application/octet-stream";
          if (!contentType.startsWith("image/")) {
            return new Response("Not an image", {
              status: 415,
              headers: { "Access-Control-Allow-Origin": "*" },
            });
          }
          const buf = await upstream.arrayBuffer();
          return new Response(buf, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch {
          return new Response("Fetch failed", {
            status: 502,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
      },
    },
  },
});
