import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names intelligently, resolving conflicts
 * (e.g. "px-2 px-4" -> "px-4") while preserving conditional classes.
 * Required by Shadcn UI components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
