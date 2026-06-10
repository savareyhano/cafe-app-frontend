/// <reference types="vite/client" />
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  // Only set application/json if we are not sending FormData
  if (!(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important to include cookies
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `API request failed with status ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) return null;
  
  try {
    return await response.json();
  } catch {
    return null;
  }
}
