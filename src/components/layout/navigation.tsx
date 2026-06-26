import Link from "next/link";
import { mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";

interface NavigationProps {
  className?: string;
}

/**
 * Primary desktop navigation. Hidden below `lg` in favor of
 * `MobileNav`'s sheet trigger — see `header.tsx` for the breakpoint
 * split.
 *
 * Hover/focus state is a hairline underline that grows from the
 * center, not a background fill — keeps the "garment tag" label
 * vocabulary (see `text-label` utility in globals.css) consistent
 * across the whole header rather than borrowing a generic pill/chip
 * treatment.
 */
export function Navigation({ className }: NavigationProps) {
  return (
        <nav className={cn("hidden items-center gap-6 lg:flex xl:gap-8", className)}>
      {mainNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-label group relative whitespace-nowrap py-2 text-foreground/80",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:text-foreground",
          )}
        >
          {item.label}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 -bottom-px h-px origin-center scale-x-0 bg-accent",
              "transition-transform duration-300 ease-out",
              "group-hover:scale-x-100 group-focus-visible:scale-x-100",
            )}
          />
        </Link>
      ))}
    </nav>
  );
}
