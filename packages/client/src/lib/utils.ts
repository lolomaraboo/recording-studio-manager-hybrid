import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract initials from a name string
 * @param name - Full name (e.g., "Emma Dubois", "Sound Production SARL")
 * @returns Initials (e.g., "ED", "SP")
 */
export function getInitials(name: string): string {
  if (!name || name.trim() === '') return '??';

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    // Single word: take first 2 chars
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple words: take first char of first 2 words
  return parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}
