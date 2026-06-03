import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import SquareStudio from "@/components/SquareStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Square Studio — Image to 1:1 Ratio Converter" },
      { name: "description", content: "Convert any image to perfect 1:1 square ratio with or without background. Fast, free, browser-based." },
      { property: "og:title", content: "Square Studio — Image to 1:1 Ratio Converter" },
      { property: "og:description", content: "Convert any image to perfect 1:1 square ratio with or without background." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <SquareStudio />
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}
