/**
 * 🍪 Cookie Consent Management System
 * GDPR & CCPA Compliant Cookie Management
 */

// Cookie consent storage keys
const CONSENT_STORAGE_KEY = 'cookie-consent-preferences';
const CONSENT_VERSION_KEY = 'cookie-consent-version';
const CONSENT_TIMESTAMP_KEY = 'cookie-consent-timestamp';

// Current consent version (increment when cookie policy changes)
const CONSENT_VERSION = '2.0';

/**
 * Get current cookie consent preferences
 * @returns {Object|null} Consent preferences or null if not set
 */
export function getConsentPreferences() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null; // Return null during SSR
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    const version = localStorage.getItem(CONSENT_VERSION_KEY);
    const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
    
    if (!stored || version !== CONSENT_VERSION) {
      return null; // Consent expired or version mismatch
    }
    
    const preferences = JSON.parse(stored);
    return {
      ...preferences,
      version,
      timestamp: parseInt(timestamp) || Date.now()
    };
  } catch (error) {
    console.error('Failed to get consent preferences:', error);
    return null;
  }
}

// Alias for compatibility with existing code
export const getConsentStatus = getConsentPreferences;
export const getCookiePreferences = getConsentPreferences;

/**
 * Save cookie consent preferences
 * @param {Object} preferences Cookie category preferences
 */
export function saveConsentPreferences(preferences) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // Skip during SSR
  }

  try {
    const timestamp = Date.now();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    localStorage.setItem(CONSENT_VERSION_KEY, CONSENT_VERSION);
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, timestamp.toString());
    
    // Trigger consent update event
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: { preferences, timestamp }
    }));
    
    // Clean up cookies based on preferences
    cleanupCookies(preferences);
    
    console.log('✅ Cookie consent preferences saved:', preferences);
    
    // Notify listeners
    consentChangeListeners.forEach(callback => {
      try {
        callback({ ...preferences, timestamp });
      } catch (error) {
        console.error('Consent change listener error:', error);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to save consent preferences:', error);
  }
}

/**
 * Check if a specific cookie category is allowed
 * @param {string} category Cookie category (essential, analytics, marketing, functional)
 * @returns {boolean} True if category is allowed
 */
export function isCategoryAllowed(category) {
  const preferences = getConsentPreferences();
  
  // Essential cookies are always allowed
  if (category === 'essential') {
    return true;
  }
  
  if (!preferences) {
    return false; // No consent given
  }
  
  return preferences.categories && preferences.categories[category] === true;
}

/**
 * Check if user has given any consent
 * @returns {boolean} True if user has made a consent choice
 */
export function hasConsentBeenGiven() {
  const preferences = getConsentPreferences();
  return preferences !== null;
}

/**
 * Reset all cookie consent data
 */
export function resetConsent() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // Skip during SSR
  }

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    localStorage.removeItem(CONSENT_VERSION_KEY);
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    
    // Clean up all non-essential cookies
    cleanupAllCookies();
    
    // Trigger consent reset event
    window.dispatchEvent(new CustomEvent('cookieConsentReset'));
    
    console.log('🧹 Cookie consent reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset consent:', error);
  }
}

// Consent change listeners
const consentChangeListeners = [];

/**
 * Add a listener for consent changes
 * @param {Function} callback Function to call when consent changes
 * @returns {Function} Function to remove the listener
 */
export function onConsentChange(callback) {
  consentChangeListeners.push(callback);
  
  // Return cleanup function
  return () => {
    const index = consentChangeListeners.indexOf(callback);
    if (index > -1) {
      consentChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Clean up cookies based on consent preferences
 * @param {Object} preferences User consent preferences
 */
function cleanupCookies(preferences) {
  const categories = preferences.categories || {};
  
  // Define cookie patterns for each category
  const cookiePatterns = {
    analytics: [
      '_ga', '_ga_*', '_gid', '_gat', '_gat_*',
      'gtag', 'gtm', '_gcl_*', '_dc_gtm_*'
    ],
    marketing: [
      '_fbp', '_fbc', 'fr', 'tr', 'ads', 'marketing',
      '_pinterest_*', '_twitter_*', '_linkedin_*'
    ],
    functional: [
      'preferences', 'settings', 'theme', 'lang',
      'functional_*', 'feature_*'
    ]
  };
  
  // Remove cookies for disabled categories
  Object.keys(cookiePatterns).forEach(category => {
    if (!categories[category]) {
      cookiePatterns[category].forEach(pattern => {
        removeCookiesByPattern(pattern);
      });
    }
  });
}

/**
 * Remove all non-essential cookies
 */
function cleanupAllCookies() {
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Essential cookie patterns that should be kept
  const essentialPatterns = [
    'adminToken', 'auth', 'session', 'csrf',
    'cookie-consent-*', 'essential_*'
  ];
  
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    
    // Check if cookie is essential
    const isEssential = essentialPatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
    
    if (!isEssential) {
      removeCookie(name);
    }
  });
}

/**
 * Remove cookies matching a pattern
 * @param {string} pattern Cookie name pattern (* for wildcard)
 */
function removeCookiesByPattern(pattern) {
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      if (regex.test(name)) {
        removeCookie(name);
      }
    } else if (name === pattern) {
      removeCookie(name);
    }
  });
}

/**
 * Remove a specific cookie
 * @param {string} name Cookie name
 */
function removeCookie(name) {
  // Remove from current domain
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  // Remove from all possible paths and domains
  const pathsToTry = ['/', '/admin', '/docs', '/blog'];
  const domainsToTry = [
    window.location.hostname,
    `.${window.location.hostname}`,
    'localhost',
    '.localhost'
  ];
  
  pathsToTry.forEach(path => {
    domainsToTry.forEach(domain => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
    });
  });
}

/**
 * Get default consent settings from admin configuration
 * @returns {Promise<Object>} Default settings
 */
export async function getConsentSettings() {
  try {
    const response = await fetch('/api/admin/settings');
    const data = await response.json();
    
    return data.cookieConsentSettings || {
      enabled: true,
      privacyPolicyUrl: '/privacy-policy',
      consentMessage: 'We use cookies to enhance your browsing experience and analyze our traffic. Please choose your cookie preferences.',
      acceptAllText: 'Accept All',
      declineAllText: 'Decline All',
      managePreferencesText: 'Manage Preferences',
      privacyPolicyText: 'Privacy Policy',
      position: 'bottom',
      theme: 'light',
      categories: {
        essential: {
          enabled: true,
          required: true,
          label: 'Essential Cookies',
          description: 'Necessary for the website to function properly. These cannot be disabled.'
        },
        analytics: {
          enabled: true,
          required: false,
          label: 'Analytics Cookies',
          description: 'Help us understand how visitors use our website to improve user experience.'
        },
        marketing: {
          enabled: false,
          required: false,
          label: 'Marketing Cookies',
          description: 'Used to deliver personalized advertisements and measure their effectiveness.'
        },
        functional: {
          enabled: false,
          required: false,
          label: 'Functional Cookies',
          description: 'Enable enhanced functionality and personalization features.'
        }
      }
    };
  } catch (error) {
    console.error('Failed to get consent settings:', error);
    return getDefaultConsentSettings();
  }
}

/**
 * Get fallback default settings
 * @returns {Object} Default consent configuration
 */
function getDefaultConsentSettings() {
  return {
    enabled: true,
    privacyPolicyUrl: '/privacy-policy',
    consentMessage: 'We use cookies to enhance your browsing experience and analyze our traffic. Please choose your cookie preferences.',
    acceptAllText: 'Accept All',
    declineAllText: 'Decline All',
    managePreferencesText: 'Manage Preferences',
    privacyPolicyText: 'Privacy Policy',
    position: 'bottom',
    theme: 'light',
    categories: {
      essential: {
        enabled: true,
        required: true,
        label: 'Essential Cookies',
        description: 'Necessary for the website to function properly.'
      },
      analytics: {
        enabled: true,
        required: false,
        label: 'Analytics Cookies',
        description: 'Help us understand how visitors use our website.'
      },
      marketing: {
        enabled: false,
        required: false,
        label: 'Marketing Cookies',
        description: 'Used for advertising and marketing purposes.'
      },
      functional: {
        enabled: false,
        required: false,
        label: 'Functional Cookies',
        description: 'Enable enhanced functionality and personalization.'
      }
    }
  };
}

/**
 * Show cookie preferences modal
 */
export function showCookiePreferences() {
  window.dispatchEvent(new CustomEvent('showCookiePreferences'));
}

/**
 * Analytics integration utilities
 */
export const Analytics = {
  /**
   * Initialize Google Analytics if analytics cookies are allowed
   * @param {string} measurementId GA4 Measurement ID
   */
  initialize(measurementId) {
    if (!measurementId || !isCategoryAllowed('analytics')) {
      return;
    }
    
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      cookie_expires: 0
    });
  },
  
  /**
   * Track page view
   * @param {string} path Page path
   * @param {string} title Page title
   */
  trackPageView(path, title) {
    if (isCategoryAllowed('analytics') && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title
      });
    }
  },
  
  /**
   * Track custom event
   * @param {string} action Event action
   * @param {Object} parameters Event parameters
   */
  trackEvent(action, parameters = {}) {
    if (isCategoryAllowed('analytics') && window.gtag) {
      window.gtag('event', action, parameters);
    }
  }
};
