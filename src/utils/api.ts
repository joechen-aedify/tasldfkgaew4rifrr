/**
 * API utility functions
 * Reads API base URL from VITE_API_URL environment variable
 */

// Get API base URL from environment variable, default to empty string (relative path)
// If VITE_API_URL is set, use it; otherwise use relative paths (for same-origin requests)
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Builds a full API URL from a path
 * @param path - API path (e.g., '/api/auth/login')
 * @returns Full URL or relative path depending on VITE_API_URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if API_BASE_URL already has trailing slash or ends with domain
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  if (API_BASE_URL) {
    // Remove trailing slash from base URL if present
    const cleanBase = API_BASE_URL.replace(/\/$/, '')
    return `${cleanBase}${cleanPath}`
  }
  
  // If no base URL is set, return relative path (for same-origin requests)
  return cleanPath
}

/**
 * Fetch helper with automatic API URL resolution
 * @param path - API path (e.g., '/api/auth/login')
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(path)
  return fetch(url, options)
}

