import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Link as LinkIcon, ImageIcon, Sparkles, Square, Download,
  Copy, Check, RotateCcw, Loader2, AlertCircle, Crop, Moon, Sun,
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
  const [bgColor, setBgColor] = useState("#ffffff");
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

  useEffect(() => {
    const saved = window.localStorage.getItem("square-studio-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("square-studio-theme", theme);
  }, [theme]);

  const activeSize = targetSize(ratioPreset, customWidth, customHeight);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const src = URL.createObjectURL(file);
    try {
      const el = await loadImage(src, false);
      setImage({ el, src, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null);
    } catch {
      toast.error("Could not load image");
    }
  }, []);

  const handleUrl = useCallback(async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    setError(null);
    const proxied = `/api/proxy-image?url=${encodeURIComponent(raw)}`;
    // Try direct first (faster, keeps original URL). If CORS or load fails, fall back to server proxy.
    try {
      const el = await loadImage(raw, true);
      setImage({ el, src: raw, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null);
      return;
    } catch {
      // fall through to proxy
    }
    try {
      const el = await loadImage(proxied, false);
      setImage({ el, src: proxied, width: el.naturalWidth, height: el.naturalHeight });
      setResult(null);
      toast.success("Loaded via proxy");
    } catch {
      setError("এই image URL load করা যাচ্ছে না। URL টি সঠিক কিনা check করুন, অথবা image টি download করে upload করুন।");
    }
  }, [urlInput]);

  const finalize = useCallback((canvas: HTMLCanvasElement, mode: "with" | "without", ratioLabel: string) => {
    const url = canvas.toDataURL("image/png");
    setResult({ canvas, url, w: canvas.width, h: canvas.height, mode, ratioLabel });
    setBlobUrl("");
    setLinkStatus("uploading");
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setLinkStatus("failed");
        return;
      }
      try {
        const res = await fetch("/api/public/upload-square", {
          method: "POST",
          headers: { "Content-Type": "image/png" },
          body: blob,
        });
        if (!res.ok) throw new Error("upload_failed");
        const data = (await res.json()) as { url: string };
        setBlobUrl(data.url);
        setLinkStatus("ready");
      } catch {
        setLinkStatus("failed");
        toast.error("Public link upload failed. Use download instead.");
      }
    }, "image/png");
  }, []);

  const processWithBg = useCallback(async () => {
    if (!image) return;
    setProcessing("with");
    try {
      await new Promise((r) => setTimeout(r, 200));
      const size = targetSize(ratioPreset, customWidth, customHeight);
      const canvas = buildCoverCanvas(image.el, bgColor, size.width, size.height);
      finalize(canvas, "with", size.label);
      toast.success(`Resized to ${size.label}`);
    } finally {
      setProcessing(null);
    }
  }, [image, bgColor, ratioPreset, customWidth, customHeight, finalize]);

  const processWithoutBg = useCallback(async () => {
    if (!image) return;
    setProcessing("without");
    try {
      const size = targetSize(ratioPreset, customWidth, customHeight);
      const srcBlob = await fetch(image.src).then((r) => r.blob());
      const ct = srcBlob.type && srcBlob.type.startsWith("image/") ? srcBlob.type : "image/png";
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
      const canvas = buildCoverCanvas(el, null, size.width, size.height);
      finalize(canvas, "without", size.label);
      URL.revokeObjectURL(outUrl);
      toast.success(`Background removed & resized to ${size.label}`);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Background removal failed";
      toast.error(msg);
    } finally {
      setProcessing(null);
    }
  }, [image, ratioPreset, customWidth, customHeight, finalize]);

  const download = (type: "png" | "jpg" | "webp") => {
    if (!result) return;
    const mime = type === "png" ? "image/png" : type === "jpg" ? "image/jpeg" : "image/webp";
    const url = type === "png" ? result.canvas.toDataURL("image/png") : result.canvas.toDataURL(mime, 0.92);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ti-saju-square-studio-${result.w}x${result.h}.${type}`;
    a.click();
  };

  const copyLink = async () => {
    if (!blobUrl) return;
    try {
      await navigator.clipboard.writeText(blobUrl);
      setCopied(true);
      toast.success("✓ Link Copied!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  const reset = () => {
    if (image?.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
    
    setImage(null);
    setResult(null);
    setBlobUrl("");
    setLinkStatus("idle");
    setUrlInput("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Square className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">Ti Saju <span className="text-gradient">Square Studio</span></h1>
              <p className="text-xs text-muted-foreground">Image ratio resize converter</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-surface-elevated transition-colors"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          {image && (
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-surface-elevated transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Drop in. <span className="text-gradient">Resize out.</span></h2>
              <p className="text-muted-foreground">Resize any image to the ratio you need — with or without background.</p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                dragOver ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-surface hover:border-primary/50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Upload className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="font-semibold mb-1">Drop image or click to upload</p>
              <p className="text-sm text-muted-foreground">PNG · JPG · WebP · up to 20MB</p>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Or paste image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrl()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
                />
                <button
                  onClick={handleUrl}
                  className="px-5 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-glow"
                >
                  Load
                </button>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Image info & options */}
            {image && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-2xl border border-border bg-gradient-surface p-5">
                  <div className="flex items-center gap-4">
                    <div className="checker-bg rounded-lg overflow-hidden w-20 h-20 flex-shrink-0 flex items-center justify-center">
                      <img src={image.src} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Original</p>
                      <p className="font-semibold">{image.width} × {image.height}</p>
                      <p className="text-sm text-muted-foreground">ratio {ratioStr(image.width, image.height)}</p>
                    </div>
                  </div>
                </div>

                {/* Size options */}
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Crop className="w-4 h-4" /> Resize ratio
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                      {activeSize.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RESIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setRatioPreset(preset.id)}
                        className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                          ratioPreset === preset.id
                            ? "border-primary bg-primary/10 shadow-glow"
                            : "border-border bg-surface-elevated hover:border-primary/60"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{preset.label}</span>
                        <span className="block text-xs text-muted-foreground">{preset.detail}</span>
                      </button>
                    ))}
                  </div>
                  {ratioPreset === "custom" && (
                    <div className="grid grid-cols-2 gap-3 animate-fade-in">
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Width</span>
                        <input
                          type="number"
                          min="32"
                          max="2400"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">Height</span>
                        <input
                          type="number"
                          min="32"
                          max="2400"
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Two option cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={processWithoutBg}
                    disabled={processing !== null}
                    className="group relative text-left p-5 rounded-2xl border border-border bg-surface hover:border-primary hover:-translate-y-1 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 shadow-glow">
                      {processing === "without"
                        ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                        : <Sparkles className="w-5 h-5 text-primary-foreground" />}
                    </div>
                    <h3 className="font-bold text-lg mb-1">Without BG</h3>
                    <p className="text-sm text-muted-foreground">Remove background, export transparent cover resize.</p>
                  </button>

                  <button
                    onClick={processWithBg}
                    disabled={processing !== null}
                    className="group relative text-left p-5 rounded-2xl border border-border bg-surface hover:border-primary hover:-translate-y-1 hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 shadow-glow">
                      {processing === "with"
                        ? <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                        : <Square className="w-5 h-5 text-primary-foreground" />}
                    </div>
                    <h3 className="font-bold text-lg mb-1">With BG</h3>
                    <p className="text-sm text-muted-foreground">Resize to selected ratio with full cover crop.</p>
                  </button>
                </div>

                {/* BG color picker */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
                  <label className="text-sm text-muted-foreground flex-1">Padding color (for "With BG")</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-border"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg bg-input border border-border text-sm font-mono focus:outline-none focus:border-primary"
                  />
                </div>

              </div>
            )}
          </section>

          {/* RIGHT */}
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-gradient-surface p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Preview</h3>
                {result && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 font-medium">
                    {result.w} × {result.h} — 1:1 ✓
                  </span>
                )}
              </div>

              <div className="flex-1 checker-bg rounded-xl overflow-hidden flex items-center justify-center min-h-[320px] p-4">
                {result ? (
                  <img src={result.url} alt="Result" className="max-w-full max-h-[420px] object-contain animate-fade-in shadow-elevated" />
                ) : image ? (
                  <img src={image.src} alt="Original" className="max-w-full max-h-[420px] object-contain opacity-60" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Your result will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="space-y-4 animate-fade-in">
                {/* Downloads */}
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(["png", "jpg", "webp"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => download(t)}
                        className="py-3 rounded-lg border border-border bg-surface-elevated hover:border-primary hover:-translate-y-0.5 hover:shadow-glow transition-all text-sm font-semibold uppercase tracking-wider"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blob link */}
                <div className="rounded-2xl border border-border bg-surface p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Direct link
                  </h4>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={blobUrl}
                      className="flex-1 px-3 py-2.5 rounded-lg bg-input border border-border text-xs font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground font-medium text-sm flex items-center gap-2 hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-glow"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-center text-xs text-muted-foreground">
        Square Studio — Professional 1:1 image converter
      </footer>
    </div>
  );
}
