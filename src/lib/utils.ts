import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to be used as a Firestore document ID.
 * Replaces invalid characters (including whitespace) with underscores.
 */
export function sanitizeDocId(id: string): string {
    return id.replace(/[.*~/[\]\s]/g, '_');
}
