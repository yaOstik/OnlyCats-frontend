const TOKEN_KEY = 'token';
const USERNAME_KEY = 'username';

export function getStoredToken() {
  const value = localStorage.getItem(TOKEN_KEY);
  return value ? value.replace(/"/g, '') : null;
}

export function getStoredUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function saveAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function saveStoredUsername(username) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function getUserIdFromToken(token) {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.sub || payload.id || payload.user_id);
  } catch {
    return null;
  }
}

