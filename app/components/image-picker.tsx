import { useEffect, useId, useState } from "react";
import { Icon } from "~/components/icon";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX = 4 * 1024 * 1024;

/** Mirrors the backend's upload rule, in Indonesian. */
export function imageError(file: File | null | undefined): string | undefined {
  if (!file) return;
  if (!IMAGE_TYPES.includes(file.type)) return "Gunakan gambar JPG, PNG, atau WebP.";
  if (file.size > IMAGE_MAX) return "Ukuran gambar maksimal 4 MB.";
}

export function ImagePicker({
  value,
  currentUrl,
  onChange,
  invalid,
  aspect = "aspect-square",
  label,
}: {
  value: File | null;
  currentUrl?: string | null;
  onChange: (f: File | null) => void;
  invalid?: boolean;
  aspect?: string;
  label: string;
}) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return setPreview(null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shown = preview ?? currentUrl;
  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className={cn(
          "relative grid cursor-pointer place-items-center overflow-hidden rounded-lg border-2 border-dashed border-line-strong bg-background text-ink-soft transition-colors hover:bg-fill-hover",
          aspect,
          invalid && "border-[var(--ds-control-invalid)]",
          shown && "border-solid border-transparent",
        )}
      >
        {shown ? (
          <img src={shown} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="grid justify-items-center gap-2 p-4 text-center">
            <Icon name="image" className="size-7" />
            <span className="type-label-s">Pilih gambar</span>
            <span className="type-body-xs">JPG, PNG, atau WebP, maks. 4 MB</span>
          </span>
        )}
        <span className="sr-only">{label}</span>
        <input
          id={id}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {shown && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="xs" asChild>
            <label htmlFor={id} className="cursor-pointer">
              <Icon name="edit" />
              Ganti gambar
            </label>
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(null)}>
              Batalkan pilihan
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
