/**
 * OAuth 2.0 Access Token Management and Automatic Token Refresh
 * Automatically exchanges refresh_token for a fresh access_token via Google OAuth 2.0
 */

export interface OAuthSecrets {
  oauth_client_id: string;
  oauth_client_secret: string;
  oauth_refresh_token: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

let inMemoryAccessToken: string | null = null;
let inMemoryExpiresAt = 0;
let refreshPromise: Promise<string> | null = null;

/**
 * 1. Retrieve oauth_client_id, oauth_client_secret, and oauth_refresh_token from secrets/environment variables
 */
export function getOAuthSecrets(): OAuthSecrets {
  const env: Record<string, any> = typeof process !== 'undefined' && process.env ? process.env : {};
  const metaEnv: Record<string, any> = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
  const winObj: Record<string, any> = typeof window !== 'undefined' ? (window as any) : {};
  const winSecrets: Record<string, any> = winObj.__SECRETS__ || winObj.__OAUTH_SECRETS__ || {};

  const oauth_client_id =
    env.oauth_client_id ||
    env.OAUTH_CLIENT_ID ||
    metaEnv.oauth_client_id ||
    metaEnv.OAUTH_CLIENT_ID ||
    metaEnv.VITE_OAUTH_CLIENT_ID ||
    winSecrets.oauth_client_id ||
    winSecrets.OAUTH_CLIENT_ID ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('oauth_client_id') : '') ||
    '';

  const oauth_client_secret =
    env.oauth_client_secret ||
    env.OAUTH_CLIENT_SECRET ||
    metaEnv.oauth_client_secret ||
    metaEnv.OAUTH_CLIENT_SECRET ||
    metaEnv.VITE_OAUTH_CLIENT_SECRET ||
    winSecrets.oauth_client_secret ||
    winSecrets.OAUTH_CLIENT_SECRET ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('oauth_client_secret') : '') ||
    '';

  const oauth_refresh_token =
    env.oauth_refresh_token ||
    env.OAUTH_REFRESH_TOKEN ||
    metaEnv.oauth_refresh_token ||
    metaEnv.OAUTH_REFRESH_TOKEN ||
    metaEnv.VITE_OAUTH_REFRESH_TOKEN ||
    winSecrets.oauth_refresh_token ||
    winSecrets.OAUTH_REFRESH_TOKEN ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('oauth_refresh_token') : '') ||
    '';

  return {
    oauth_client_id: (oauth_client_id || '').trim(),
    oauth_client_secret: (oauth_client_secret || '').trim(),
    oauth_refresh_token: (oauth_refresh_token || '').trim()
  };
}

/**
 * Checks if OAuth secrets are fully configured (requires client_id, client_secret, AND refresh_token)
 */
export function hasOAuthCredentials(): boolean {
  const secrets = getOAuthSecrets();
  return Boolean(secrets.oauth_refresh_token && secrets.oauth_client_id && secrets.oauth_client_secret);
}

/**
 * Saves active access token in memory and localStorage
 */
export function saveActiveAccessToken(accessToken: string, expiresIn: number = 3600): void {
  inMemoryAccessToken = accessToken;
  // Subtract 90 seconds safety buffer before expiration
  inMemoryExpiresAt = Date.now() + Math.max(30, expiresIn - 90) * 1000;

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('gemini_enterprise_token', accessToken);
      localStorage.setItem('gemini_token_expires_at', String(inMemoryExpiresAt));
      // Trigger a window event so all open views sync their state
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Clears current access token from memory and localStorage
 */
export function clearCachedAccessToken(): void {
  inMemoryAccessToken = null;
  inMemoryExpiresAt = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('gemini_token_expires_at');
    } catch (e) {}
  }
}

/**
 * 2. Makes a POST request to https://oauth2.googleapis.com/token with:
 *    - client_id: secrets.oauth_client_id
 *    - client_secret: secrets.oauth_client_secret
 *    - refresh_token: secrets.oauth_refresh_token
 *    - grant_type: 'refresh_token'
 * 3. Extracts the new access_token from the JSON response
 */
export async function refreshOAuthAccessToken(): Promise<string> {
  // If a refresh is already in flight, reuse the same promise to prevent duplicate requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const secrets = getOAuthSecrets();

    // Check if refresh credentials are fully present
    if (!secrets.oauth_refresh_token || !secrets.oauth_client_id) {
      // If no refresh token in secrets, check if backend proxy has it in process.env
      try {
        const proxyRes = await fetch('/api/token/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (proxyRes.ok) {
          const data: OAuthTokenResponse = await proxyRes.json();
          if (data.access_token) {
            saveActiveAccessToken(data.access_token, data.expires_in || 3600);
            return data.access_token;
          }
        }
      } catch (proxyErr) {
        // Continue to detailed error below
      }

      throw new Error(
        'Kredensial OAuth belum lengkap (oauth_client_id, oauth_client_secret, dan oauth_refresh_token diperlukan).'
      );
    }

    const payload = {
      client_id: secrets.oauth_client_id,
      client_secret: secrets.oauth_client_secret,
      refresh_token: secrets.oauth_refresh_token,
      grant_type: 'refresh_token'
    };

    // 1. Try via backend server proxy first if available (keeps client_secret completely internal and avoids CORS)
    try {
      const serverProxyRes = await fetch('/api/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (serverProxyRes.ok) {
        const proxyData: OAuthTokenResponse = await serverProxyRes.json();
        if (proxyData.access_token) {
          saveActiveAccessToken(proxyData.access_token, proxyData.expires_in || 3600);
          return proxyData.access_token;
        }
      }
    } catch (proxyErr) {
      // Backend proxy unavailable or failed, proceed to direct endpoint
    }

    // 2. Direct POST request to https://oauth2.googleapis.com/token
    let response: Response;
    try {
      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr: any) {
      console.warn('Direct JSON token refresh request encountered network error:', netErr);
      // Try with application/x-www-form-urlencoded
      const urlParams = new URLSearchParams();
      urlParams.append('client_id', secrets.oauth_client_id);
      urlParams.append('client_secret', secrets.oauth_client_secret);
      urlParams.append('refresh_token', secrets.oauth_refresh_token);
      urlParams.append('grant_type', 'refresh_token');

      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlParams.toString()
      });
    }

    // If initial JSON request wasn't OK, attempt form-encoded fallback
    if (!response.ok) {
      const errText = await response.text();
      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errText);
      } catch {}

      // If bad request with JSON, try x-www-form-urlencoded
      try {
        const urlParams = new URLSearchParams();
        urlParams.append('client_id', secrets.oauth_client_id);
        urlParams.append('client_secret', secrets.oauth_client_secret);
        urlParams.append('refresh_token', secrets.oauth_refresh_token);
        urlParams.append('grant_type', 'refresh_token');

        const retryRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: urlParams.toString()
        });

        if (retryRes.ok) {
          const retryData: OAuthTokenResponse = await retryRes.json();
          if (retryData.access_token) {
            saveActiveAccessToken(retryData.access_token, retryData.expires_in || 3600);
            return retryData.access_token;
          }
        }
      } catch (retryErr) {
        // ignore
      }

      // If refresh failed (e.g. 401 Unauthorized), clear stale token
      clearCachedAccessToken();
      const errMsg = parsedErr?.error_description || parsedErr?.error || errText || `HTTP ${response.status}`;
      throw new Error(`Ralat penyegaran token OAuth (${response.status}): ${errMsg}`);
    }

    // 3. Extract the new access_token from the JSON response
    const tokenData: OAuthTokenResponse = await response.json();
    if (!tokenData.access_token) {
      throw new Error('Respons daripada pelayan OAuth Google tidak mengandungi access_token.');
    }

    saveActiveAccessToken(tokenData.access_token, tokenData.expires_in || 3600);
    return tokenData.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * 4. Retrieves the currently active access token or refreshes it automatically if expired
 */
export async function getEffectiveAccessToken(forceRefresh = false): Promise<string> {
  // If not forced, check memory cache and expiration
  if (!forceRefresh) {
    if (inMemoryAccessToken && Date.now() < inMemoryExpiresAt) {
      return inMemoryAccessToken;
    }

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('gemini_enterprise_token');
      const storedExp = Number(localStorage.getItem('gemini_token_expires_at') || '0');
      if (stored && stored.trim().length > 10) {
        // If stored token hasn't expired yet
        if (storedExp > Date.now()) {
          inMemoryAccessToken = stored;
          inMemoryExpiresAt = storedExp;
          return stored;
        }
      }
    }
  }

  // If refresh credentials exist or if forced, trigger automatic refresh
  if (hasOAuthCredentials()) {
    try {
      return await refreshOAuthAccessToken();
    } catch (refreshErr) {
      console.warn('Automatic OAuth token refresh failed:', refreshErr);
      // Fallback to stored token if available
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('gemini_enterprise_token');
        if (stored && stored.trim().length > 10) {
          return stored;
        }
      }
      return '';
    }
  }

  // Fallback to existing localStorage token if no credentials yet
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('gemini_enterprise_token');
    if (stored && stored.trim().length > 10) {
      return stored;
    }
  }

  return '';
}
