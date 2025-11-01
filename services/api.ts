const BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'AYU_TOKEN';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => sessionStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
      else if (Array.isArray(data?.errors) && data.errors.length) {
        message = data.errors.map((e: any) => e.msg || e.message).join(', ');
      }
    } catch {}
    throw new Error(message);
  }
  try {
    return await res.json();
  } catch {
    // No JSON body
    return undefined as unknown as T;
  }
}
