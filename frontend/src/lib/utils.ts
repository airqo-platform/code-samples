import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the generateId function to utils
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}
