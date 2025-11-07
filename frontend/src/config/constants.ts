// API configuration
// Vite exposes env vars via import.meta.env and requires the VITE_ prefix
export const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
export const API_BASE_PATH = '/api/v1';

// Languages
export type Language = 'rus' | 'kaz' | 'eng';

export const LANGUAGES = {
  RUS: 'rus' as Language,
  KAZ: 'kaz' as Language,
  ENG: 'eng' as Language,
};

// User roles
export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
}

// Order status
export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Product status
export enum ProductStatus {
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  INACTIVE = 'inactive',
}
