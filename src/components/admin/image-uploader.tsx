"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedImageResult {
  publicId: string;
  secureUrl: string;
  displayUrl: string;
  width: number;
  height: number;
}

interface ImageUploaderProps {
  /** Currently saved images (from the product document). */
  value: Array<{ url: string; alt?: string; publicId?: string }>;
  onChange: (images: Array<{ url: string; alt?: string; publicId?: string }>) => void;
  maxImages?: number;
  className?: string;
}

interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  uploadPreset?: string;
}

/**
 * Reusable multi-image uploader for the admin. Uses direct browser →
 * Cloudinary uploads (signed by our server at /api/admin/cloudinary/sign)
 * so large files never transit through our Next.js server.
 *
 * Flow:
 *  1. User picks files via drag-drop or file picker.
 *  2. We fetch a fresh upload signature from our API.
 *  3. Each file is POSTed to https://api.cloudinary.com/v1_1/.../image/upload.
 *  4. On success we call `onChange` with the updated image list.
 *  5. Delete calls DELETE /api/admin/cloudinary/delete and removes from list.
 */
export function ImageUploader({
  value,
  onChange,
  maxImages = 8,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canUploadMore = value.length < maxImages;

  async function getSignature(): Promise<UploadSignatureResponse> {
    const res = await fetch("/api/admin/cloudinary/sign");
    if (!res.ok) throw new Error("Failed to get upload signature.");
    return res.json() as Promise<UploadSignatureResponse>;
  }

  async function uploadFile(
    file: File,
    sig: UploadSignatureResponse,
  ): Promise<UploadedImageResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);
    if (sig.uploadPreset) formData.append("upload_preset", sig.uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!res.ok) {
      const err = await res.json() as { error?: { message: string } };
      throw new Error(err.error?.message ?? "Upload failed.");
    }

    const data = await res.json() as {
      public_id: string;
      secure_url: string;
      width: number;
      height: number;
    };

    // Build an optimised display URL
    const displayUrl = `https://res.cloudinary.com/${sig.cloudName}/image/upload/f_auto,q_auto,w_1200/${data.public_id}`;

    return {
      publicId: data.public_id,
      secureUrl: data.secure_url,
      displayUrl,
      width: data.width,
      height: data.height,
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErrors([]);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const MAX_MB = 10;
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        newErrors.push(`"${file.name}" is not a supported image format.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        newErrors.push(`"${file.name}" exceeds the ${MAX_MB} MB limit.`);
        continue;
      }
      if (value.length + validFiles.length >= maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed.`);
        break;
      }
      validFiles.push(file);
    }

    if (newErrors.length) setErrors(newErrors);
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const sig = await getSignature();
      const uploaded: Array<{ url: string; publicId: string }> = [];

      for (const file of validFiles) {
        try {
          const result = await uploadFile(file, sig);
          uploaded.push({ url: result.displayUrl, publicId: result.publicId });
        } catch (err) {
          newErrors.push(
            `Failed to upload "${file.name}": ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
      if (newErrors.length) setErrors(newErrors);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Upload failed."]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(index: number) {
    const image = value[index];
    if (!image) return;

    const updated = value.filter((_, i) => i !== index);
    onChange(updated); // optimistic

    if (image.publicId) {
      try {
        await fetch("/api/admin/cloudinary/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: image.publicId }),
        });
      } catch {
        // Non-fatal — the image reference is removed from the product
        // regardless. The orphaned Cloudinary asset can be cleaned up
        // via the Cloudinary console or a scheduled job.
      }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Existing images */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((image, index) => (
            <div
              key={image.url + index}
              className="group relative aspect-[4/5] overflow-hidden bg-secondary"
            >
              <Image
                src={image.url}
                alt={image.alt ?? `Product image ${index + 1}`}
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(index)}
                aria-label={`Remove image ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-background/90 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="text-label absolute bottom-1 left-1 bg-background/90 px-1.5 py-0.5 text-foreground/70">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canUploadMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 border-2 border-dashed py-10 transition-colors",
            isDragging ? "border-foreground bg-secondary" : "border-border",
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm text-foreground">
              {uploading ? "Uploading…" : "Drag images here or"}
            </p>
            {!uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="mt-1 text-sm underline underline-offset-4"
              >
                browse to upload
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP, AVIF · up to 10 MB each · max {maxImages} images
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
