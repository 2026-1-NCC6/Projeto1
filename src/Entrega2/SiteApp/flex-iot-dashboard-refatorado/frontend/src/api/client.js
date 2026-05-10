const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export function getToken() {
  return localStorage.getItem('token');
}

export function setSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.clear();
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Erro na requisição');
  if (res.status === 204) return null;
  return res.json();
}

export { API_URL };
