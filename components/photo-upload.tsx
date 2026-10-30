"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { savePhoto } from "@/lib/actions/engagement";
import { Avatar, cn } from "@/components/ui";

const MAX_SIDE = 800;

// Resize on the phone before uploading: a 4 MB camera photo becomes ~100 KB.
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

export function PhotoUpload({
  kind, userId, currentUrl, name, shape = "round",
}: {
  kind: "worker" | "business";
  userId: string;
  currentUrl: string | null;
  name: string;
  shape?: "round" | "wide";
}) {
  const t = useTranslations("photo");
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError(t("notImage"));
    startTransition(async () => {
      try {
        const blob = await resize(file);
        const path = `${userId}/${kind}-${Date.now()}.jpg`;
        const bucket = kind === "worker" ? "avatars" : "business-photos";
        const { error: uploadError } = await createClient().storage.from(bucket).upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        });
        if (uploadError) throw uploadError;
        const result = await savePhoto(kind, path);
        if (result.error) throw new Error(result.error);
        setPreview(URL.createObjectURL(blob));
      } catch {
        setError(t("failed"));
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      {shape === "round" ? (
        <Avatar src={preview} name={name} size={80} />
      ) : (
        <div className="relative h-24 w-40 overflow-hidden rounded-xl border-2 border-ink bg-haldi">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-3xl font-bold">{name.slice(0, 1)}</span>
          )}
        </div>
      )}
      <div>
        <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label={t("choose")} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className={cn("inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-ink bg-cream px-4 text-sm font-semibold shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none", pending && "opacity-60")}
        >
          <Camera className="size-4" aria-hidden /> {pending ? t("uploading") : preview ? t("change") : t("add")}
        </button>
        <p className="mt-1 text-xs text-stone-600">{kind === "worker" ? t("hintWorker") : t("hintBusiness")}</p>
        {error && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
}
