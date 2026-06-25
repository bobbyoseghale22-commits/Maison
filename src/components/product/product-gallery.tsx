"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GalleryImage {
  url: string;
  alt?: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

/**
 * Product gallery: main image with a hover-magnify lens on desktop
 * (pointer-fine devices), thumbnail rail, and a click-to-fullscreen
 * lightbox for closer inspection on any device including touch.
 *
 * No external zoom/lightbox library — the magnifier is a CSS
 * `background-position` trick driven by pointer coordinates, and the
 * lightbox reuses the `Dialog` primitive already in the design
 * system, rather than adding a new dependency for what's a fairly
 * small amount of logic.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const activeImage = images[activeIndex];

  if (!activeImage) {
    return (
      <div className="aspect-[4/5] w-full bg-secondary" aria-hidden="true" />
    );
  }

  function goTo(index: number) {
    setActiveIndex(
      ((index % images.length) + images.length) % images.length,
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[64px_1fr] gap-4 sm:grid-cols-[80px_1fr]">
        {/* Thumbnail rail */}
        {images.length > 1 && (
          <div className="flex flex-col gap-3">
            {images.map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex}
                className={cn(
                  "relative aspect-[4/5] w-full overflow-hidden border transition-colors",
                  index === activeIndex
                    ? "border-foreground"
                    : "border-border hover:border-foreground/40",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image with hover-magnify */}
        <div className={images.length === 1 ? "col-span-2" : undefined}>
          <MagnifyImage
            image={activeImage}
            productName={productName}
            onOpenLightbox={() => setLightboxOpen(true)}
          />
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">
            {productName} — full size image
          </DialogTitle>
          <DialogDescription className="sr-only">
            Use the arrow buttons to view other images.
          </DialogDescription>

          <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? productName}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-background/80 text-foreground transition-colors hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MagnifyImageProps {
  image: GalleryImage;
  productName: string;
  onOpenLightbox: () => void;
}

/**
 * The main image itself. On pointer-fine devices (mouse/trackpad),
 * moving the pointer over the image reveals a magnified portion
 * positioned to follow the cursor — implemented with a second,
 * larger copy of the image whose `background-position` is driven by
 * pointer percentage, revealed only inside a small circular lens so
 * the rest of the image stays unobstructed.
 */
function MagnifyImage({
  image,
  productName,
  onOpenLightbox,
}: MagnifyImageProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [lensPosition, setLensPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setLensPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setLensPosition(null)}
      className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-secondary"
    >
      <button
        type="button"
        onClick={onOpenLightbox}
        aria-label={`View full size image of ${productName}`}
        className="absolute inset-0 z-10"
      />

      <Image
        src={image.url}
        alt={image.alt ?? productName}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
        className="object-cover"
      />

      {/* Magnified lens — only rendered while a mouse is hovering, so
          touch devices never pay for it and tap always goes straight
          to the lightbox via the overlay button above. */}
      {lensPosition && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-no-repeat sm:block"
          style={{
            backgroundImage: `url(${image.url})`,
            backgroundSize: "200%",
            backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
            clipPath: `circle(90px at ${lensPosition.x}% ${lensPosition.y}%)`,
          }}
        />
      )}

      <span className="text-label pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/90 px-2 py-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
        <ZoomIn className="h-3 w-3" aria-hidden="true" />
        Zoom
      </span>
    </div>
  );
}
