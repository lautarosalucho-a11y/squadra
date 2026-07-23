/** Manejo mínimo de tokens JWT en memoria + persistencia.
 *  El backend devuelve { accessToken, refreshToken } en login/register/refresh. */

const ACCESS_KEY = "squadra.accessToken";
const REFRESH_KEY = "squadra.refreshToken";

export const auth = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(ACCESS_KEY));
  },
  /** Extrae el `sub` (userId) del JWT sin verificar firma (solo para UI). */
  getUserId(): string | null {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  },
};
