/**
 * Cookie Consent Management Utilities
 * Provides functions to check consent status and manage cookies based on user preferences
 */

const STORAGE_KEY = 'cookie-consent';
const PREFERENCES_KEY = 'cookie-preferences';

export interface ConsentData {
  type: 'accepted' | 'declined' | 'customized';
  timestamp: number;
  preferences: Record<string, boolean>;
}

export interface CookiePreferences {
  essential?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  functional?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Get the current cookie consent status
 */
export function getConsentStatus(): ConsentData | null {
  if (typeof window === 'undefined') {
    // Server-side rendering - return null
    return null;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

/**
 * Get the current cookie preferences
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') {
    // Server-side rendering - return null
    return null;
  }
  
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading cookie preferences:', error);
    return null;
  }
}

/**
 * Check if a specific category of cookies is allowed
 */
export function isCategoryAllowed(category: keyof CookiePreferences): boolean {
  const preferences = getCookiePreferences();
  if (!preferences) {
    // No consent given yet, default to false except for essential
    return category === 'essential';
  }
  return preferences[category] === true;
}

/**
 * Check if the user has given any form of consent
 */
export function hasConsentBeenGiven(): boolean {
  return getConsentStatus() !== null;
}

/**
 * Reset cookie consent (useful for testing or allowing users to change their minds)
 */
export function resetConsent(): void {
  if (typeof window === 'undefined') {
    // Server-side rendering - do nothing
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PREFERENCES_KEY);
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('cookieConsentReset'));
}

/**
 * Set a cookie with consent checking
 */
export function setConsentedCookie(
  name: string,
  value: string,
  category: keyof CookiePreferences,
  options: {
    expires?: number; // days
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): boolean {
  if (!isCategoryAllowed(category)) {
    console.warn(`Cookie "${name}" not set: ${category} cookies not allowed`);
    return false;
  }

  let cookieString = `${name}=${value}`;

  if (options.expires) {
    const date = new Date();
    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/';
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
  return true;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): void {
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Initialize Google Analytics with consent
 */
export function initializeGoogleAnalytics(trackingId: string): void {
  if (!trackingId || typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());

  // Set default consent state
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted', // Always granted for essential cookies
  });

  // Initialize GA with consent
  const preferences = getCookiePreferences();
  if (preferences) {
    gtag('consent', 'update', {
      'analytics_storage': preferences.analytics ? 'granted' : 'denied',
      'ad_storage': preferences.marketing ? 'granted' : 'denied',
      'functionality_storage': preferences.functional ? 'granted' : 'denied',
      'personalization_storage': preferences.functional ? 'granted' : 'denied',
    });
  }

  gtag('config', trackingId);
}

/**
 * Track an event with consent checking
 */
export function trackEvent(
  action: string,
  category: string = 'General',
  label?: string,
  value?: number
): void {
  if (!isCategoryAllowed('analytics')) {
    console.warn('Analytics tracking blocked due to cookie consent');
    return;
  }

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Load external scripts based on consent
 */
export function loadConsentedScript(
  src: string,
  category: keyof CookiePreferences,
  options?: {
    async?: boolean;
    defer?: boolean;
    onLoad?: () => void;
    onError?: () => void;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isCategoryAllowed(category)) {
      console.warn(`Script "${src}" not loaded: ${category} cookies not allowed`);
      reject(new Error(`${category} cookies not allowed`));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    
    if (options?.async) script.async = true;
    if (options?.defer) script.defer = true;

    script.onload = () => {
      options?.onLoad?.();
      resolve();
    };

    script.onerror = () => {
      options?.onError?.();
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Clear all non-essential cookies
 */
export function clearNonEssentialCookies(): void {
  const cookies = document.cookie.split(';');
  
  // Essential cookie patterns that should not be deleted
  const essentialPatterns = [
    'theme',
    'locale',
    STORAGE_KEY,
    PREFERENCES_KEY,
    'docusaurus',
    'auth',
    'session',
    '_csrf'
  ];

  cookies.forEach(cookie => {
    const [name] = cookie.trim().split('=');
    
    // Check if this is an essential cookie
    const isEssential = essentialPatterns.some(pattern => 
      name.toLowerCase().includes(pattern.toLowerCase())
    );

    if (!isEssential) {
      // Delete the cookie for current domain and path
      deleteCookie(name);
      // Also try to delete for parent domain
      if (window.location.hostname.includes('.')) {
        const domain = '.' + window.location.hostname.split('.').slice(-2).join('.');
        deleteCookie(name, '/', domain);
      }
    }
  });
}

/**
 * Listen for consent changes
 */
export function onConsentChange(callback: (consentData: ConsentData) => void): () => void {
  const handler = (event: CustomEvent<ConsentData>) => {
    callback(event.detail);
  };

  window.addEventListener('cookieConsentChange', handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('cookieConsentChange', handler as EventListener);
  };
}

/**
 * Show cookie preferences modal programmatically
 */
export function showCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent('showCookiePreferences'));
}

/**
 * Check if consent is needed (for regions like EU)
 */
export function isConsentRequired(): boolean {
  // This could be enhanced to check user's location via IP geolocation
  // For now, we assume consent is always required for better compliance
  return true;
}

/**
 * Get consent age in days
 */
export function getConsentAge(): number | null {
  const consent = getConsentStatus();
  if (!consent) return null;
  
  const ageMs = Date.now() - consent.timestamp;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if consent needs to be refreshed (e.g., after 1 year)
 */
export function isConsentStale(maxAgeDays: number = 365): boolean {
  const age = getConsentAge();
  return age === null || age > maxAgeDays;
}
