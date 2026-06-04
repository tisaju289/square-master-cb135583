import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import SquareStudio from "@/components/SquareStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Square Studio — Image to 1:1 Ratio Converter" },
      { name: "description", content: "Resize images to square, portrait, story, landscape, or custom ratios with optional background removal." },
      { property: "og:title", content: "Square Studio — Image to 1:1 Ratio Converter" },
      { property: "og:description", content: "Resize images to custom ratios with optional background removal." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <SquareStudio />
      <Toaster theme="system" position="bottom-right" richColors />
    </>
  );
}
