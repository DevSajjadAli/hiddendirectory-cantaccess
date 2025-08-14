/**
 * Google Analytics integration with cookie consent
 * This module handles GA4 initialization and tracking with proper consent management
 */

import { 
  isCategoryAllowed, 
  getCookiePreferences 
} from './cookieConsent';

let isInitialized = false;
let trackingId: string | null = null;

/**
 * Initialize Google Analytics with consent management
 */
export function initializeAnalytics(gaTrackingId: string): void {
  if (typeof window === 'undefined' || !gaTrackingId) return;

  trackingId = gaTrackingId;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`;
  document.head.appendChild(script);

  // Initialize gtag function
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());

  // Set default consent state (denied by default)
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted', // Always granted for security
  });

  // Configure GA4
  gtag('config', gaTrackingId, {
    // Don't send page_view automatically - we'll handle this manually
    send_page_view: false,
  });

  // Apply current consent state if available
  updateConsentState();

  // Listen for consent changes via DOM events
  window.addEventListener('cookieConsentUpdated', () => {
    updateConsentState();
  });

  isInitialized = true;
}

/**
 * Update Google Analytics consent state based on current preferences
 */
function updateConsentState(): void {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  const preferences = getCookiePreferences();
  if (!preferences) return;

  (window as any).gtag('consent', 'update', {
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'ad_storage': preferences.marketing ? 'granted' : 'denied',
    'functionality_storage': preferences.functional ? 'granted' : 'denied',
    'personalization_storage': preferences.functional ? 'granted' : 'denied',
  });

  // Send initial page view if analytics is now enabled
  if (preferences.analytics && trackingId) {
    (window as any).gtag('config', trackingId, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
}

/**
 * Track a page view with consent checking
 */
export function trackPageView(path?: string, title?: string): void {
  if (!isCategoryAllowed('analytics') || !isInitialized) return;

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: path || window.location.href,
    });
  }
}

/**
 * Track a custom event with consent checking
 */
export function trackEvent(
  action: string,
  parameters?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }
): void {
  if (!isCategoryAllowed('analytics') || !isInitialized) return;

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, parameters);
  }
}

/**
 * Track user engagement with consent checking
 */
export function trackEngagement(action: string, element?: string): void {
  trackEvent('engagement', {
    event_category: 'user_engagement',
    event_label: element,
    engagement_action: action,
  });
}

/**
 * Track search queries with consent checking
 */
export function trackSearch(searchTerm: string, resultCount?: number): void {
  trackEvent('search', {
    event_category: 'site_search',
    search_term: searchTerm,
    event_label: searchTerm,
    value: resultCount,
  });
}

/**
 * Track downloads with consent checking
 */
export function trackDownload(fileName: string, fileType?: string): void {
  trackEvent('file_download', {
    event_category: 'downloads',
    event_label: fileName,
    file_name: fileName,
    file_type: fileType,
  });
}

/**
 * Track external link clicks with consent checking
 */
export function trackExternalLink(url: string, linkText?: string): void {
  trackEvent('click', {
    event_category: 'external_links',
    event_label: linkText || url,
    link_url: url,
  });
}

/**
 * Track form interactions with consent checking
 */
export function trackFormInteraction(formName: string, action: 'start' | 'complete' | 'abandon'): void {
  trackEvent('form_interaction', {
    event_category: 'forms',
    event_label: formName,
    form_name: formName,
    form_action: action,
  });
}

/**
 * Set user properties (if functional cookies allowed)
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (!isCategoryAllowed('functional') || !isInitialized) return;

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', trackingId, {
      custom_map: properties,
    });
  }
}

/**
 * Enable enhanced measurement features (requires analytics consent)
 */
export function enableEnhancedMeasurement(): void {
  if (!isCategoryAllowed('analytics') || !isInitialized || !trackingId) return;

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', trackingId, {
      enhanced_measurement: {
        scrolls: true,
        outbound_clicks: true,
        site_search: true,
        video_engagement: true,
        file_downloads: true,
      },
    });
  }
}

/**
 * Disable analytics (useful for testing or debugging)
 */
export function disableAnalytics(): void {
  if (typeof window !== 'undefined' && trackingId) {
    // Disable GA
    (window as any)[`ga-disable-${trackingId}`] = true;
  }
}

/**
 * Enable analytics (re-enable if previously disabled)
 */
export function enableAnalytics(): void {
  if (typeof window !== 'undefined' && trackingId) {
    // Enable GA
    (window as any)[`ga-disable-${trackingId}`] = false;
  }
}

/**
 * Check if analytics is currently active
 */
export function isAnalyticsActive(): boolean {
  return isInitialized && isCategoryAllowed('analytics');
}

/**
 * Get the current tracking ID
 */
export function getTrackingId(): string | null {
  return trackingId;
}
