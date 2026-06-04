import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Link as LinkIcon, ImageIcon, Sparkles, Square, Download,
  Copy, Check, RotateCcw, Loader2, AlertCircle, Crop, Moon, Sun, Palette, Ban,
} from "lucide-react";
import { toast } from "sonner";

type LoadedImage = {
  el: HTMLImageElement;
  src: string;
  width: number;
  height: number;
};

type ResultImage = {
  canvas: HTMLCanvasElement;
  url: string;
  w: number;
  h: number;
  mode: "with" | "without";
  ratioLabel: string;
};

type ResizePreset = {
  id: string;
  label: string;
  detail: string;
  width: number;
  height: number;
};

const RESIZE_PRESETS: ResizePreset[] = [
  { id: "1:1", label: "Square", detail: "1:1 · 1080×1080", width: 1080, height: 1080 },
  { id: "4:5", label: "Portrait", detail: "4:5 · 1080×1350", width: 1080, height: 1350 },
  { id: "9:16", label: "Story", detail: "9:16 · 1080×1920", width: 1080, height: 1920 },
  { id: "16:9", label: "Landscape", detail: "16:9 · 1920×1080", width: 1920, height: 1080 },
  { id: "3:2", label: "Classic", detail: "3:2 · 1500×1000", width: 1500, height: 1000 },
  { id: "custom", label: "Custom", detail: "Your size", width: 1080, height: 1080 },
];

const QUICK_COLORS = [
  "#ffffff", "#000000", "#f8f9fa", "#1a1a2e",
  "#e63946", "#2196f3", "#4caf50", "#ff9800",
  "#9c27b0", "#00bcd4", "#ff5722", "#607d8b",
];

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.21 8.21 0 0 0 4.79 1.52V6.78a4.85 4.85 0 0 1-1.02-.09z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function ratioStr(w: number, h: number) {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function loadImage(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load_failed"));
    img.src = src;
  });
}

function clampSize(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(32, Math.min(2400, parsed));
}

function targetSize(presetId: string, customWidth: string, customHeight: string) {
  const preset = RESIZE_PRESETS.find((item) => item.id === presetId) ?? RESIZE_PRESETS[0];
  const width = preset.id === "custom" ? clampSize(customWidth, 1080) : preset.width;
  const height = preset.id === "custom" ? clampSize(customHeight, 1080) : preset.height;
  return {
    width,
    height,
    label: `${ratioStr(width, height)} · ${width}×${height}`,
  };
}

function buildCoverCanvas(img: HTMLImageElement, bg: string | null, targetW: number, targetH: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, targetW, targetH);
  }
  const scale = Math.max(targetW / img.width, targetH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (targetW - dw) / 2;
  const dy = (targetH - dh) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, dw, dh);
  return canvas;
}

export default function SquareStudio() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [bgColor, setBgColor] = useState<string | null>("#ffffff");
  const [ratioPreset, setRatioPreset] = useState("1:1");
  const [customWidth, setCustomWidth] = useState("1080");
  const [customHeight, setCustomHeight] = useState("1080");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [processing, setProcessing] = useState<null | "with" | "without">(null);
  const [result, setResult] = useState<ResultImage | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [linkStatus, setLinkStatus] = useState<"idle" | "uploading" | "ready" | "failed">("idle");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [removedBgEl, setRemovedBgEl] = useState<HTMLImageElement | null>(null);
  const applyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("square-studio-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
    window.localStorage.setItem("square-studio-theme", theme);
  }, [theme]);

  // Live re-render: triggers whenever color OR ratio changes after BG removal
  useEffect(() => {
    if (!removedBgEl) return;
    if (applyDebounceRef.current) clearTimeout(applyDebounceRef.current);
    applyDebounceRef.current = setTimeout(() => {
      const size = targetSize(ratioPreset, customWidth, customHeight);
      const canvas = buildCoverCanvas(removedBgEl, bgColor, size.width, size.height);
      const url = canvas.toDataURL("image/png");
      setResult((prev) =>
        prev
          ? { ...prev, canvas, url, mode: "without", w: size.width, h: size.height, ratioLabel: size.label }
          : null
      );
    }, 80);
  }, [bgColor, removedBgEl, ratioPreset, customWidth, customHeight]);

  const activeSize = targetSize(ratioPreset, customWidth, customHeight);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    const src = URL.createObjectURL(file);
    try {
      const el = await loadImage(src, false);
      setImage({ el, src, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null);
      setRemovedBgEl(null);
    } catch { toast.error("Could not load image"); }
  }, []);

  const handleUrl = useCallback(async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    setError(null);
    const proxied = `/api/proxy-image?url=${encodeURIComponent(raw)}`;
    try {
      const el = await loadImage(raw, true);
      setImage({ el, src: raw, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null); setRemovedBgEl(null); return;
    } catch { /* fall through */ }
    try {
      const el = await loadImage(proxied, false);
      setImage({ el, src: proxied, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null); setRemovedBgEl(null);
      toast.success("Loaded via proxy");
    } catch {
      setError("এই image URL load করা যাচ্ছে না। URL টি সঠিক কিনা check করুন, অথবা image টি download করে upload করুন।");
    }
  }, [urlInput]);

  const finalize = useCallback((canvas: HTMLCanvasElement, mode: "with" | "without", ratioLabel: string) => {
    const url = canvas.toDataURL("image/png");
    setResult({ canvas, url, w: canvas.width, h: canvas.height, mode, ratioLabel });
    setBlobUrl(""); setLinkStatus("uploading");
    canvas.toBlob(async (blob) => {
      if (!blob) { setLinkStatus("failed"); return; }
      try {
        const res = await fetch("/api/public/upload-square", {
          method: "POST",
          headers: { "Content-Type": blob.type || "image/png" },
          body: blob,
        });
        if (!res.ok) throw new Error("upload_failed");
        const data = (await res.json()) as { url: string };
        setBlobUrl(data.url); setLinkStatus("ready");
      } catch {
        setLinkStatus("failed");
        toast.error("Public link upload failed. Use download instead.");
      }
    }, "image/webp", 0.92);
  }, []);

  const processWithBg = useCallback(async () => {
    if (!image) return;
    setProcessing("with"); setRemovedBgEl(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const size = targetSize(ratioPreset, customWidth, customHeight);
      const canvas = buildCoverCanvas(image.el, bgColor, size.width, size.height);
      finalize(canvas, "with", size.label);
      toast.success(`Resized to ${size.label}`);
    } finally { setProcessing(null); }
  }, [image, bgColor, ratioPreset, customWidth, customHeight, finalize]);

  const processWithoutBg = useCallback(async () => {
    if (!image) return;
    setProcessing("without");
    try {
      const size = targetSize(ratioPreset, customWidth, customHeight);
      const srcBlob = await fetch(image.src).then((r) => r.blob());
      const ct = srcBlob.type?.startsWith("image/") ? srcBlob.type : "image/png";
      const res = await fetch("/api/public/remove-bg", {
        method: "POST",
        headers: { "Content-Type": ct },
        body: srcBlob,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(j.error || "Failed");
      }
      const outBlob = await res.blob();
      const outUrl = URL.createObjectURL(outBlob);
      const el = await loadImage(outUrl, false);
      setRemovedBgEl(el);
      const canvas = buildCoverCanvas(el, bgColor, size.width, size.height);
      finalize(canvas, "without", size.label);
      URL.revokeObjectURL(outUrl);
      toast.success(`Background removed & resized to ${size.label}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Background removal failed";
      toast.error(msg);
    } finally { setProcessing(null); }
  }, [image, bgColor, ratioPreset, customWidth, customHeight, finalize]);

  const download = (type: "png" | "jpg" | "webp") => {
    if (!result) return;
    const mime = type === "png" ? "image/png" : type === "jpg" ? "image/jpeg" : "image/webp";
    const url = type === "png" ? result.canvas.toDataURL("image/png") : result.canvas.toDataURL(mime, 0.92);
    const a = document.createElement("a");
    a.href = url; a.download = `ti-saju-square-studio-${result.w}x${result.h}.${type}`; a.click();
  };

  const copyLink = async () => {
    if (!blobUrl) return;
    try {
      await navigator.clipboard.writeText(blobUrl);
      setCopied(true); toast.success("✓ Link Copied!");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Copy failed"); }
  };

  const reset = () => {
    if (image?.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
    setImage(null); setResult(null); setBlobUrl(""); setLinkStatus("idle");
    setUrlInput(""); setError(null); setRemovedBgEl(null);
  };

  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <Square className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">
                Ti Saju <span className="text-gradient">Square Studio</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Image ratio resize converter</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setTheme((c) => c === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border hover:bg-surface-elevated transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {image && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">

          {/* LEFT — controls */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                Drop in. <span className="text-gradient">Resize out.</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Resize any image to the ratio you need — with or without background.
              </p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all ${
                dragOver ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-surface hover:border-primary/50"
              }`}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <p className="font-semibold mb-1 text-sm sm:text-base">Drop image or click to upload</p>
              <p className="text-xs sm:text-sm text-muted-foreground">PNG · JPG · WebP · up to 20MB</p>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Or paste image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url" value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrl()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
                <button onClick={handleUrl}
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-glow flex-shrink-0">
                  Load
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs sm:text-sm text-destructive animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Mobile-only inline preview — shows after URL, before controls */}
            <div className="block lg:hidden">
              <div className="rounded-2xl border border-border bg-gradient-surface p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base">Preview</h3>
                  {result && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                      {result.w} × {result.h} — {result.ratioLabel.split(" · ")[0]} ✓
                    </span>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden flex items-center justify-center p-3 min-h-[200px] checker-bg">
                  {result ? (
                    <img src={result.url} alt="Result"
                      className="max-w-full max-h-[240px] object-contain animate-fade-in shadow-elevated rounded-lg" />
                  ) : image ? (
                    <img src={image.src} alt="Original"
                      className="max-w-full max-h-[240px] object-contain opacity-60" />
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Your result will appear here</p>
                    </div>
                  )}
                </div>
              </div>
              {result && (
                <div className="space-y-3 mt-3 animate-fade-in">
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" /> Download
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "jpg", "webp"] as const).map((t) => (
                        <button key={t} onClick={() => download(t)}
                          className="py-2.5 rounded-lg border border-border bg-surface-elevated hover:border-primary hover:-translate-y-0.5 hover:shadow-glow transition-all text-xs font-semibold uppercase tracking-wider">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surface p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <LinkIcon className="w-4 h-4" /> Direct link
                    </h4>
                    <div className="flex gap-2">
                      <input readOnly value={linkStatus === "uploading" ? "Creating public link..." : blobUrl}
                        className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-input border border-border text-xs font-mono truncate focus:outline-none" />
                      <button onClick={copyLink} disabled={!blobUrl || linkStatus !== "ready"}
                        className="px-3 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                        {linkStatus === "uploading" ? <Loader2 className="w-4 h-4 animate-spin" /> : copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{linkStatus === "uploading" ? "Wait" : copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    {linkStatus === "failed" && (
                      <p className="mt-2 text-xs text-destructive">Public link failed. Please try processing again.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {image && (
              <div className="space-y-4 sm:space-y-5 animate-fade-in">
                {/* Original info */}
                <div className="rounded-2xl border border-border bg-gradient-surface p-4 sm:p-5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="checker-bg rounded-lg overflow-hidden w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
                      <img src={image.src} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Original</p>
                      <p className="font-semibold text-sm sm:text-base">{image.width} × {image.height}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">ratio {ratioStr(image.width, image.height)}</p>
                    </div>
                  </div>
                </div>

                {/* Resize ratio */}
                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                      <Crop className="w-4 h-4" /> Resize ratio
                    </h3>
                    <span className="text-xs px-2 sm:px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                      {activeSize.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {RESIZE_PRESETS.map((preset) => (
                      <button key={preset.id} type="button" onClick={() => setRatioPreset(preset.id)}
                        className={`text-left rounded-lg border px-2 sm:px-3 py-2 sm:py-2.5 transition-all ${
                          ratioPreset === preset.id
                            ? "border-primary bg-primary/10 shadow-glow"
                            : "border-border bg-surface-elevated hover:border-primary/60"
                        }`}>
                        <span className="block text-xs sm:text-sm font-semibold">{preset.label}</span>
                        <span className="block text-[10px] sm:text-xs text-muted-foreground leading-tight">{preset.detail}</span>
                      </button>
                    ))}
                  </div>
                  {ratioPreset === "custom" && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 animate-fade-in">
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Width</span>
                        <input type="number" min="32" max="2400" value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Height</span>
                        <input type="number" min="32" max="2400" value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full px-3 py-2 sm:py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary" />
                      </label>
                    </div>
                  )}
                  {removedBgEl && (
                    <p className="text-xs text-primary/80 animate-fade-in flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
                      Ratio change auto-updates the result
                    </p>
                  )}
                </div>

                {/* Action cards — above color picker */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button onClick={processWithoutBg} disabled={processing !== null}
                    className="group text-left p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:border-primary hover:-translate-y-1 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-2 sm:mb-3 shadow-glow">
                      {processing === "without"
                        ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground animate-spin" />
                        : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-0.5">Remove BG</h3>
                    <p className="text-xs text-muted-foreground leading-snug">AI removes background, apply your color.</p>
                  </button>

                  <button onClick={processWithBg} disabled={processing !== null}
                    className="group text-left p-4 sm:p-5 rounded-2xl border border-border bg-surface hover:border-primary hover:-translate-y-1 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-2 sm:mb-3 shadow-glow">
                      {processing === "with"
                        ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground animate-spin" />
                        : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-0.5">Keep BG</h3>
                    <p className="text-xs text-muted-foreground leading-snug">Resize with color padding &amp; cover crop.</p>
                  </button>
                </div>

                {/* Background Color — below action buttons */}
                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm sm:text-base">Background Color</h3>
                    {removedBgEl && (
                      <span className="ml-auto text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium animate-fade-in">
                        Live ✓
                      </span>
                    )}
                  </div>

                  {/* Quick swatches + No Color */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBgColor(null)}
                      title="No background (transparent)"
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 flex-shrink-0 flex items-center justify-center checker-bg ${
                        bgColor === null ? "border-primary shadow-glow scale-110" : "border-border"
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5 text-destructive" />
                    </button>
                    {QUICK_COLORS.map((c) => (
                      <button key={c} onClick={() => setBgColor(c)} title={c}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 transition-all hover:scale-110 flex-shrink-0 ${
                          bgColor === c ? "border-primary shadow-glow scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  {/* Custom color row */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm text-muted-foreground flex-1">Custom</span>
                    <div className="relative flex-shrink-0">
                      <input ref={colorInputRef} type="color"
                        value={bgColor ?? "#ffffff"}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        aria-label="Pick color"
                      />
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-border pointer-events-none flex items-center justify-center overflow-hidden"
                        style={bgColor ? { backgroundColor: bgColor } : undefined}
                      >
                        {!bgColor && <span className="checker-bg absolute inset-0" />}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={bgColor ?? ""}
                      placeholder="transparent"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") { setBgColor(null); return; }
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBgColor(v);
                      }}
                      className="w-24 sm:w-28 px-2 sm:px-3 py-2 rounded-lg bg-input border border-border text-xs sm:text-sm font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  {bgColor === null && (
                    <p className="text-xs text-muted-foreground animate-fade-in">
                      No background — output will be transparent (PNG only).
                    </p>
                  )}
                  {removedBgEl && (
                    <p className="text-xs text-primary/80 animate-fade-in">
                      BG removed — pick any color above to apply it instantly.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* RIGHT — preview (desktop only) */}
          <section className="hidden lg:block space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-border bg-gradient-surface p-4 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-bold text-base sm:text-lg">Preview</h3>
                {result && (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                    {result.w} × {result.h} — {result.ratioLabel.split(" · ")[0]} ✓
                  </span>
                )}
              </div>
              <div className="flex-1 rounded-xl overflow-hidden flex items-center justify-center p-3 sm:p-4 min-h-[220px] sm:min-h-[320px] checker-bg">
                {result ? (
                  <img src={result.url} alt="Result"
                    className="max-w-full max-h-[260px] sm:max-h-[420px] object-contain animate-fade-in shadow-elevated rounded-lg" />
                ) : image ? (
                  <img src={image.src} alt="Original"
                    className="max-w-full max-h-[260px] sm:max-h-[420px] object-contain opacity-60" />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-40" />
                    <p className="text-xs sm:text-sm">Your result will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="space-y-3 sm:space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Download className="w-4 h-4" /> Download
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(["png", "jpg", "webp"] as const).map((t) => (
                      <button key={t} onClick={() => download(t)}
                        className="py-2.5 sm:py-3 rounded-lg border border-border bg-surface-elevated hover:border-primary hover:-translate-y-0.5 hover:shadow-glow transition-all text-xs sm:text-sm font-semibold uppercase tracking-wider">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <LinkIcon className="w-4 h-4" /> Direct link
                  </h4>
                  <div className="flex gap-2">
                    <input readOnly value={linkStatus === "uploading" ? "Creating public link..." : blobUrl}
                      className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-input border border-border text-xs font-mono truncate focus:outline-none" />
                    <button onClick={copyLink} disabled={!blobUrl || linkStatus !== "ready"}
                      className="px-3 sm:px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-shrink-0">
                      {linkStatus === "uploading" ? <Loader2 className="w-4 h-4 animate-spin" /> : copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{linkStatus === "uploading" ? "Wait" : copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  {linkStatus === "failed" && (
                    <p className="mt-2 text-xs text-destructive">Public link failed. Please try processing again.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-4">
          <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-3">
            <a href="https://www.facebook.com/tisaju289" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border hover:border-primary/50 text-xs sm:text-sm transition-all hover:-translate-y-0.5"
              title="Facebook">
              <span className="text-[#1877F2]"><FacebookIcon /></span>
              <span className="hidden sm:inline font-medium">Facebook</span>
            </a>
            <a href="https://www.linkedin.com/in/tisaju289/" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border hover:border-primary/50 text-xs sm:text-sm transition-all hover:-translate-y-0.5"
              title="LinkedIn">
              <span className="text-[#0A66C2]"><LinkedInIcon /></span>
              <span className="hidden sm:inline font-medium">LinkedIn</span>
            </a>
            <a href="https://www.youtube.com/@TajulslamSaju" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border hover:border-primary/50 text-xs sm:text-sm transition-all hover:-translate-y-0.5"
              title="YouTube">
              <span className="text-[#FF0000]"><YouTubeIcon /></span>
              <span className="hidden sm:inline font-medium">YouTube</span>
            </a>
            <a href="https://www.tiktok.com/@tisaju289" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border hover:border-primary/50 text-xs sm:text-sm transition-all hover:-translate-y-0.5"
              title="TikTok">
              <span className="dark:text-white text-black"><TikTokIcon /></span>
              <span className="hidden sm:inline font-medium">TikTok</span>
            </a>
            <a href="https://wa.me/8801881324067" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border hover:border-primary/50 text-xs sm:text-sm transition-all hover:-translate-y-0.5"
              title="WhatsApp">
              <span className="text-[#25D366]"><WhatsAppIcon /></span>
              <span className="hidden sm:inline font-medium">WhatsApp</span>
            </a>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Developed by{" "}
            <a href="https://www.facebook.com/tisaju289" target="_blank" rel="noreferrer"
              className="text-primary hover:underline font-medium">
              Tajul Islam Saju
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
