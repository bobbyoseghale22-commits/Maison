"use client";

import * as React from "react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/helpers";

interface ProductImage {
  url: string;
  alt?: string;
  publicId?: string;
}

/**
 * Demo form showing the ImageUploader in context. In the full admin
 * product editor this would be one section of a larger product form
 * that saves the image URLs and public IDs to the Product document.
 */
export function ProductImageUploadForm() {
  const [images, setImages] = React.useState<ProductImage[]>([]);
  const [saved, setSaved] = React.useState(false);

  function handleSave() {
    // In production: PATCH /api/admin/products/[id] with { images }
    console.log("Images to save:", images);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-8">
      <ImageUploader
        value={images}
        onChange={setImages}
        maxImages={8}
      />

      {images.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl italic text-foreground">
            Image URLs{" "}
            <span className="text-sm font-normal not-italic text-muted-foreground">
              ({images.length} image{images.length !== 1 ? "s" : ""})
            </span>
          </h2>
          <ul className="space-y-2">
            {images.map((img, i) => (
              <li key={img.url + i} className="space-y-0.5">
                <p className="text-label text-foreground/60">
                  {i === 0 ? "Primary" : `Image ${i + 1}`}
                  {img.publicId && (
                    <span className="ml-2 text-foreground/40">
                      · {img.publicId}
                    </span>
                  )}
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  {img.url}
                </p>
              </li>
            ))}
          </ul>

          <Button
            type="button"
            onClick={handleSave}
            className="rounded-none"
          >
            {saved ? "Saved!" : "Save to Product"}
          </Button>
        </div>
      )}
    </div>
  );
}
