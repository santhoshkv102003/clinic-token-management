import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWaitTime(minutes: number | null | undefined): number {
  if (minutes === null || minutes === undefined || isNaN(Number(minutes))) return 0;
  return Number(Number(minutes).toFixed(1));
}

