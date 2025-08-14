import { useState, useEffect } from 'react';
import {
  getCookiePreferences,
  isCategoryAllowed,
  hasConsentBeenGiven
} from '../utils/cookieConsent';

/**
 * React hook for managing cookie consent in components
 */
export function useCookieConsent() {
  const [consentStatus, setConsentStatus] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Initial load
    const status = getCookiePreferences();
    const prefs = getCookiePreferences();
    
    setConsentStatus(status);
    setPreferences(prefs);
    setHasConsent(hasConsentBeenGiven());

    // Listen for changes through DOM events
    const handleConsentUpdate = (event: any) => {
      const consentData = event.detail?.preferences || getCookiePreferences();
      setConsentStatus(consentData);
      setPreferences(consentData);
      setHasConsent(true);
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, []);

  return {
    consentStatus,
    preferences,
    hasConsent,
    isCategoryAllowed,
    isAnalyticsAllowed: () => isCategoryAllowed('analytics'),
    isMarketingAllowed: () => isCategoryAllowed('marketing'),
    isFunctionalAllowed: () => isCategoryAllowed('functional'),
  };
}

/**
 * Hook for conditional rendering based on cookie consent
 */
export function useConsentGate(category: string) {
  const [isAllowed, setIsAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const checkConsent = () => {
      const allowed = isCategoryAllowed(category);
      setIsAllowed(allowed);
      setIsLoading(false);
    };

    // Check immediately
    checkConsent();

    // Listen for changes through DOM events
    const handleConsentUpdate = () => {
      checkConsent();
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, [category]);

  return { isAllowed, isLoading };
}

/**
 * Hook for tracking events with consent checking
 */
export function useAnalytics() {
  const { isAnalyticsAllowed } = useCookieConsent();

  const trackEvent = (action: string, category?: string, label?: string, value?: number) => {
    if (!isAnalyticsAllowed()) {
      console.warn('Analytics tracking blocked due to cookie consent');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category || 'General',
        event_label: label,
        value: value,
      });
    }
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (!isAnalyticsAllowed()) return;

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', (window as any).GA_MEASUREMENT_ID, {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    isEnabled: isAnalyticsAllowed(),
  };
}
