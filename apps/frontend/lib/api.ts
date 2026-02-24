/**
 * API configuration and utilities for the SquidHub frontend
 */

// API Base URL configuration
// CRITICAL: Must use absolute URL in production (Dokploy/Docker)
// Next.js rewrites don't work reliably in standalone mode with Docker
function getApiBase(): string {
  // Always use NEXT_PUBLIC_API_URL if set (works in all environments)
  // This is the CORRECT approach for Dokploy deployments
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Fallback for local development
  return ''
}

export const API_BASE = getApiBase();

/**
 * Extract error details for logging
 */
function extractErrorDetails(error: unknown) {
  return {
    errorMessage: error instanceof Error ? error.message : String(error),
    errorName: error instanceof Error ? error.name : 'Unknown',
    errorStack: error instanceof Error ? error.stack : undefined,
  };
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    callback: '/api/auth/callback',
    user: '/api/auth/user',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    fakeLogin: (role: string) => `/api/auth/fake-login/${role}`,
  },

  // Health and Documentation
  health: '/health',
  docs: '/api/docs',
  apiSpec: '/api/apispec.json',

  // Dashboard Cards
  cards: '/api/cards',

  // Admin
  admin: '/api/admin',

  // Groups
  groups: '/api/groups',

  // Marketplace
  marketplace: '/api/marketplace',

  // Fleet
  fleet: '/api/fleet',

  // Inventory
  inventory: '/api/inventory',

  // Warehouse
  warehouse: '/api/warehouse',

  // Giveaways
  giveaways: '/api/giveaways',

  // Ribbons
  ribbons: '/api/ribbons',

  // Roles
  roles: '/api/roles',

  // Audit
  audit: '/api/audit',

  // Missions
  missions: '/api/missions',
} as const;

/**
 * Build full API URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_BASE}${endpoint}`;
}

/**
 * Get base headers for authenticated requests.
 * Tokens are stored in httpOnly cookies and sent automatically via credentials: 'include'.
 * No Authorization header is injected here; the cookie jar handles authentication.
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Make authenticated API request with timeout support.
 * Relies on httpOnly cookies for authentication — credentials: 'include' ensures
 * the browser sends the access_token cookie on every request.
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { isFormData?: boolean } = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  // For FormData, don't set Content-Type (browser will set it with boundary)
  const headers: HeadersInit = options.isFormData
    ? {
        ...options.headers,
      }
    : {
        ...getAuthHeaders(),
        ...options.headers,
      };

  // Use external signal if provided, otherwise create timeout controller
  const shouldUseTimeout = !options.signal;
  const timeoutController = shouldUseTimeout ? new AbortController() : null;
  let timeoutTriggered = false;
  const timeoutId = shouldUseTimeout ? setTimeout(() => {
    timeoutTriggered = true;
    timeoutController?.abort();
  }, 30000) : null;
  const signal = options.signal || timeoutController?.signal;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Parse response body
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (error) {
      console.error(`[apiRequest] Failed to parse JSON response:`, error);
      responseData = null;
    }

    if (!response.ok) {
      console.error(`[apiRequest] Request failed: status=${response.status}, statusText="${response.statusText}", error="${responseData?.error || 'none'}", fullResponse=`, responseData);

      const errorMessage = responseData?.error || `HTTP ${response.status}: ${response.statusText}`;

      // On 401, attempt to refresh the backend token and retry once.
      // The /api/auth/backend-token endpoint signs a backend-compatible JWT from the
      // NextAuth session and sets it as the access_token httpOnly cookie.
      if (response.status === 401 && typeof window !== 'undefined') {
        try {
          const tokenRes = await fetch('/api/auth/backend-token', { credentials: 'include' });
          if (tokenRes.ok) {
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include',
            });
            if (retryResponse.ok) {
              let retryData: any;
              try { retryData = await retryResponse.json(); } catch { retryData = null; }
              return retryData as T;
            }
          }
        } catch {
          // Token refresh failed — fall through and throw the original error
        }
      }

      throw new Error(errorMessage);
    }

    // Return the full response (which includes success, data, etc.)
    return responseData as T;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    // Handle abort/timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      if (timeoutTriggered) {
        // Internal timeout triggered
        console.error(`[apiRequest] Request timed out after 30s: ${url}`);
        throw new Error('Request timed out. Please try again.');
      } else {
        // External cancellation (component unmount, navigation, user-initiated)
        throw error; // Rethrow original AbortError for external handling
      }
    }

    // Handle network errors (Failed to fetch, network failures, CORS, etc.)
    const isNetworkError =
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
       error.message.includes('NetworkError') ||
       error.message.includes('Network request failed'));

    if (isNetworkError) {
      const { errorMessage, errorName, errorStack } = extractErrorDetails(error);

      console.error(`[apiRequest] Network error:`, {
        url,
        errorName,
        errorMessage,
        apiBase: API_BASE,
        stack: errorStack,
      });

      // Provide more helpful error message
      throw new Error(`Cannot connect to API server at ${API_BASE}. Please check your connection or contact support.`);
    }

    // Log other unexpected errors with full details
    const { errorMessage, errorName, errorStack } = extractErrorDetails(error);
    console.error(`[apiRequest] Unexpected error:`, {
      url,
      errorName,
      errorMessage,
      stack: errorStack,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });

    // Re-throw other errors with their original message
    throw error;
  }
}

/**
 * Alias for apiRequest to maintain backward compatibility
 */
export const apiClient = apiRequest;

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiRequest(API_ENDPOINTS.health);
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Open API documentation in new tab
 */
export function openApiDocs(): void {
  window.open(buildApiUrl(API_ENDPOINTS.docs), '_blank');
}

/**
 * Open API health check in new tab
 */
export function openHealthCheck(): void {
  window.open(buildApiUrl(API_ENDPOINTS.health), '_blank');
}

