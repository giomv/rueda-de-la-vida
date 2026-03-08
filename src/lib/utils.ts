import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserRole } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHomePathForRole(role: UserRole | undefined): string {
  if (role === 'admin') return '/admin';
  if (role === 'specialist') return '/especialista';
  return '/dashboard';
}
