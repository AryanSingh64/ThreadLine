/**
 * Utility: Merge CSS class names with Tailwind conflict resolution.
 * Uses clsx for conditional classes + tailwind-merge to deduplicate Tailwind classes.
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
