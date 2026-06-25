"use client";

import { cn } from "@/lib/utils";

interface ColorOption {
  name: string;
  hex?: string;
  /** False when this color has zero stock across every size. */
  available: boolean;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selected: string | null;
  onSelect: (color: string) => void;
}

/**
 * Color swatches. Unavailable colors (zero stock across all sizes)
 * stay visible but are struck through and disabled rather than
 * hidden — seeing "Navy: sold out" is more useful than the option
 * silently disappearing, especially since the customer may have
 * arrived via a shared link describing that exact color.
 */
export function ColorSelector({
  colors,
  selected,
  onSelect,
}: ColorSelectorProps) {
  if (colors.length === 0) return null;

  return (
    <fieldset>
      <legend className="text-label flex items-baseline gap-2 text-foreground/60">
        Color
        {selected && (
          <span className="text-sm normal-case tracking-normal text-foreground">
            {selected}
          </span>
        )}
      </legend>
      <div className="mt-3 flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.name === selected;
          return (
            <button
              key={color.name}
              type="button"
              disabled={!color.available}
              onClick={() => onSelect(color.name)}
              aria-pressed={isSelected}
              aria-label={
                color.available ? color.name : `${color.name} — out of stock`
              }
              title={color.name}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                isSelected
                  ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background"
                  : "border-border hover:border-foreground/50",
                !color.available && "cursor-not-allowed opacity-40",
              )}
            >
              <span
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: color.hex ?? "transparent" }}
              />
              {!color.available && (
                <span
                  aria-hidden="true"
                  className="absolute h-px w-9 rotate-45 bg-foreground/60"
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
